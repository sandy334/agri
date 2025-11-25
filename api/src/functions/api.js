import { app } from '@azure/functions';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "agri";

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        maxPoolSize: 10
    });

    await client.connect();
    cachedClient = client;
    return client;
}

// Health Check
app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: async (request, context) => {
        try {
            if (!MONGODB_URI) {
                return {
                    status: 200,
                    jsonBody: { status: 'Local File Database - MongoDB URI not configured' }
                };
            }

            const client = await connectToDatabase();
            const db = client.db(DB_NAME);
            
            const userCount = await db.collection('users').countDocuments();
            const farmCount = await db.collection('farms').countDocuments();

            return {
                status: 200,
                jsonBody: {
                    status: 'Connected to MongoDB Atlas',
                    database: DB_NAME,
                    collections: { users: userCount, farms: farmCount },
                    timestamp: new Date().toISOString(),
                    platform: 'Azure Functions'
                }
            };
        } catch (error) {
            context.log('Health check error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Database connection failed', details: error.message }
            };
        }
    }
});

// Get Users
app.http('getUsers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users',
    handler: async (request, context) => {
        try {
            const client = await connectToDatabase();
            const users = client.db(DB_NAME).collection('users');
            
            const allUsers = await users.find().toArray();
            const sanitizedUsers = allUsers.map(u => {
                const { password, _id, ...rest } = u;
                return { ...rest, id: rest.id || _id.toString() };
            });

            return {
                status: 200,
                jsonBody: sanitizedUsers
            };
        } catch (error) {
            context.log('Get users error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch users' }
            };
        }
    }
});

// Create User
app.http('createUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'users',
    handler: async (request, context) => {
        try {
            const { email, password, name, role, thresholds } = await request.json();
            
            if (!email || !password) {
                return {
                    status: 400,
                    jsonBody: { error: 'Email and password are required' }
                };
            }

            const client = await connectToDatabase();
            const users = client.db(DB_NAME).collection('users');
            
            // Check if user exists
            const existing = await users.findOne({ email });
            if (existing) {
                return {
                    status: 409,
                    jsonBody: { error: 'User already exists' }
                };
            }

            const newUser = {
                id: "user_" + Date.now() + Math.random().toString(36).substr(2, 9),
                email,
                password,
                name: name || email.split('@')[0],
                role: role || (email.toLowerCase().startsWith('admin') ? 'Admin' : 'Farmer'),
                thresholds: thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 },
                createdAt: new Date().toISOString()
            };

            await users.insertOne(newUser);
            const { password: _, _id, ...safeUser } = newUser;

            context.log('New user registered:', email);
            return {
                status: 201,
                jsonBody: safeUser
            };
        } catch (error) {
            context.log('Create user error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to create user' }
            };
        }
    }
});

// Login
app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'login',
    handler: async (request, context) => {
        try {
            const { email, password } = await request.json();
            
            if (!email || !password) {
                return {
                    status: 400,
                    jsonBody: { error: 'Email and password are required' }
                };
            }

            const client = await connectToDatabase();
            const users = client.db(DB_NAME).collection('users');
            
            const user = await users.findOne({ email, password });
            if (!user) {
                return {
                    status: 401,
                    jsonBody: { error: 'Invalid email or password' }
                };
            }

            const { password: _, _id, ...safeUser } = user;
            context.log('User login:', email);
            
            return {
                status: 200,
                jsonBody: { ...safeUser, id: safeUser.id || _id.toString() }
            };
        } catch (error) {
            context.log('Login error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Login failed' }
            };
        }
    }
});

// Get Farms
app.http('getFarms', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'farms',
    handler: async (request, context) => {
        try {
            const userId = request.query.get('userId');
            
            const client = await connectToDatabase();
            const farms = client.db(DB_NAME).collection('farms');
            
            const query = userId ? { userId } : {};
            const allFarms = await farms.find(query).toArray();
            
            const sanitizedFarms = allFarms.map(f => ({ 
                ...f, 
                id: f.id || f._id.toString() 
            }));

            return {
                status: 200,
                jsonBody: sanitizedFarms
            };
        } catch (error) {
            context.log('Get farms error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch farms' }
            };
        }
    }
});

// Create Farm
app.http('createFarm', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'farms',
    handler: async (request, context) => {
        try {
            const farmData = await request.json();
            
            const farm = {
                ...farmData,
                id: farmData.id || Date.now().toString(),
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            const client = await connectToDatabase();
            const farms = client.db(DB_NAME).collection('farms');
            
            await farms.insertOne(farm);
            const { _id, ...farmResponse } = farm;

            context.log('New farm created:', farm.name);
            return {
                status: 201,
                jsonBody: farmResponse
            };
        } catch (error) {
            context.log('Create farm error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to create farm' }
            };
        }
    }
});

// Update Farm
app.http('updateFarm', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'farms/{id}',
    handler: async (request, context) => {
        try {
            const id = request.params.id;
            const updateData = await request.json();
            
            const farmUpdate = {
                ...updateData,
                lastUpdated: new Date().toISOString()
            };

            const client = await connectToDatabase();
            const farms = client.db(DB_NAME).collection('farms');
            
            const result = await farms.updateOne(
                { $or: [{ id }, { _id: new ObjectId(id) }] },
                { $set: farmUpdate }
            );

            if (result.matchedCount === 0) {
                return {
                    status: 404,
                    jsonBody: { error: 'Farm not found' }
                };
            }

            context.log('Farm updated:', id);
            return {
                status: 200,
                jsonBody: { ...farmUpdate, id }
            };
        } catch (error) {
            context.log('Update farm error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to update farm' }
            };
        }
    }
});

// Delete Farm
app.http('deleteFarm', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'farms/{id}',
    handler: async (request, context) => {
        try {
            const id = request.params.id;

            const client = await connectToDatabase();
            const farms = client.db(DB_NAME).collection('farms');
            
            const result = await farms.deleteOne(
                { $or: [{ id }, { _id: new ObjectId(id) }] }
            );

            if (result.deletedCount === 0) {
                return {
                    status: 404,
                    jsonBody: { error: 'Farm not found' }
                };
            }

            context.log('Farm deleted:', id);
            return {
                status: 200,
                jsonBody: { message: 'Farm deleted successfully' }
            };
        } catch (error) {
            context.log('Delete farm error:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to delete farm' }
            };
        }
    }
});