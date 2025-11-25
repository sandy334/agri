import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "agri";
const USE_LOCAL = (process.env.USE_LOCAL_DB || "false").toLowerCase() === "true";
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(process.cwd(), "server", "data", "db.json");

function ensureFileDB() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], farms: [] }, null, 2));
    }
}

function readFileDB() {
    ensureFileDB();
    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        return JSON.parse(raw);
    } catch (e) {
        return { users: [], farms: [] };
    }
}

function writeFileDB(data) {
    ensureFileDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ----------------------
// LOCAL FILE DB ROUTES
// ----------------------
function setupLocalRoutes() {
    console.log("⚠️  Using LOCAL FILE DATABASE (db.json)");

    app.get("/api/users", (req, res) => {
        const db = readFileDB();
        res.json(db.users || []);
    });

    app.post("/api/users", (req, res) => {
        const { email, password, name, role, thresholds } = req.body;
        if (!email || !password) return res.status(400).json({ error: "email & password required" });

        const db = readFileDB();
        if (db.users.find(u => u.email === email)) return res.status(409).json({ error: "User exists" });

        const newUser = {
            id: "user_" + Date.now(),
            email,
            password,
            name: name || email.split("@")[0],
            role: role || "Farmer",
            thresholds: thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 }
        };

        db.users.push(newUser);
        writeFileDB(db);

        const { password: _, ...safe } = newUser;
        res.status(201).json(safe);
    });

    app.post("/api/login", (req, res) => {
        const { email, password } = req.body;
        const db = readFileDB();
        const user = db.users.find(u => u.email === email && u.password === password);
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const { password: _, ...safe } = user;
        res.json(safe);
    });

    app.get("/api/farms", (req, res) => {
        const db = readFileDB();
        res.json(db.farms || []);
    });

    app.post("/api/farms", (req, res) => {
        const farm = req.body;
        const db = readFileDB();
        db.farms.push(farm);
        writeFileDB(db);
        res.status(201).json(farm);
    });
}

// ----------------------
// MONGODB ROUTES
// ----------------------
function setupMongoRoutes(users, farms) {
    console.log("✅ Using MongoDB Atlas Database");

    app.get("/api/users", async (req, res) => {
        try {
            const all = await users.find().toArray();
            res.json(all.map(u => { 
                const { password, _id, ...rest } = u; 
                return { ...rest, id: rest.id || _id.toString() }; 
            }));
        } catch (err) {
            console.error("Error fetching users:", err);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    });

    app.post("/api/users", async (req, res) => {
        const { email, password, name, role, thresholds } = req.body;
        if (!email || !password) return res.status(400).json({ error: "email & password required" });

        try {
            // Check if user already exists
            const existing = await users.findOne({ email });
            if (existing) return res.status(409).json({ error: "User already exists" });

            const newUser = {
                id: "user_" + Date.now() + Math.random().toString(36).substr(2, 9),
                email,
                password,
                name: name || email.split("@")[0],
                role: role || (email.toLowerCase().startsWith("admin") ? "Admin" : "Farmer"),
                thresholds: thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 },
                createdAt: new Date().toISOString()
            };

            const result = await users.insertOne(newUser);
            const { password: _, _id, ...safe } = newUser;
            
            console.log(`👤 New user registered: ${email} (${newUser.role})`);
            res.status(201).json(safe);
        } catch (err) {
            console.error("Error creating user:", err);
            if (err.code === 11000) return res.status(409).json({ error: "User already exists" });
            res.status(500).json({ error: "Failed to create user" });
        }
    });

    app.post("/api/login", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });

        try {
            const user = await users.findOne({ email, password });
            if (!user) return res.status(401).json({ error: "Invalid email or password" });

            const { password: _, _id, ...safe } = user;
            console.log(`🔐 User login: ${email}`);
            res.json({ ...safe, id: safe.id || _id.toString() });
        } catch (err) {
            console.error("Error during login:", err);
            res.status(500).json({ error: "Login failed" });
        }
    });

    app.get("/api/farms", async (req, res) => {
        try {
            const { userId } = req.query;
            const query = userId ? { userId } : {};
            const all = await farms.find(query).toArray();
            res.json(all.map(f => ({ ...f, id: f.id || f._id.toString() })));
        } catch (err) {
            console.error("Error fetching farms:", err);
            res.status(500).json({ error: "Failed to fetch farms" });
        }
    });

    app.post("/api/farms", async (req, res) => {
        try {
            const farm = {
                ...req.body,
                id: req.body.id || Date.now().toString(),
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            const result = await farms.insertOne(farm);
            const { _id, ...farmData } = farm;
            
            console.log(`🌾 New farm created: ${farm.name} by user ${farm.userId}`);
            res.status(201).json(farmData);
        } catch (err) {
            console.error("Error creating farm:", err);
            res.status(500).json({ error: "Failed to create farm" });
        }
    });

    app.put("/api/farms/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = {
                ...req.body,
                lastUpdated: new Date().toISOString()
            };
            
            const result = await farms.updateOne(
                { $or: [{ id }, { _id: new ObjectId(id) }] },
                { $set: updateData }
            );
            
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Farm not found" });
            }
            
            console.log(`🌾 Farm updated: ${id}`);
            res.json({ ...updateData, id });
        } catch (err) {
            console.error("Error updating farm:", err);
            res.status(500).json({ error: "Failed to update farm" });
        }
    });

    app.delete("/api/farms/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const result = await farms.deleteOne(
                { $or: [{ id }, { _id: new ObjectId(id) }] }
            );
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Farm not found" });
            }
            
            console.log(`🗑️ Farm deleted: ${id}`);
            res.json({ message: "Farm deleted successfully" });
        } catch (err) {
            console.error("Error deleting farm:", err);
            res.status(500).json({ error: "Failed to delete farm" });
        }
    });

    // Enhanced health check endpoint
    app.get("/api/health", async (req, res) => {
        try {
            const userCount = await users.countDocuments();
            const farmCount = await farms.countDocuments();
            const dbStats = await users.db.stats();
            
            res.json({
                status: "Connected to MongoDB Atlas",
                database: DB_NAME,
                collections: {
                    users: userCount,
                    farms: farmCount
                },
                storage: {
                    dataSize: Math.round(dbStats.dataSize / 1024) + " KB",
                    indexSize: Math.round(dbStats.indexSize / 1024) + " KB"
                },
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("Health check failed:", e);
            res.status(500).json({ error: "Database connection issue" });
        }
    });
}

// ----------------------
// DATA MIGRATION HELPER
// ----------------------
async function migrateLocalDataToMongo(users, farms) {
    try {
        // Read existing local data
        const localData = readFileDB();
        
        if (localData.users && localData.users.length > 0) {
            console.log(`📦 Migrating ${localData.users.length} users to MongoDB...`);
            for (const user of localData.users) {
                try {
                    await users.insertOne(user);
                } catch (e) {
                    if (e.code !== 11000) { // Ignore duplicate key errors
                        console.warn('Failed to migrate user:', user.email, e.message);
                    }
                }
            }
        }
        
        if (localData.farms && localData.farms.length > 0) {
            console.log(`🌾 Migrating ${localData.farms.length} farms to MongoDB...`);
            for (const farm of localData.farms) {
                try {
                    await farms.insertOne(farm);
                } catch (e) {
                    console.warn('Failed to migrate farm:', farm.name, e.message);
                }
            }
        }
        
        console.log('✅ Data migration completed successfully');
    } catch (e) {
        console.warn('⚠️  Data migration failed:', e.message);
    }
}

// ----------------------
// START SERVER
// ----------------------
async function connectToMongoDB() {
    const connectionStrategies = [
        // Strategy 1: Standard connection with TLS bypass
        {
            name: "TLS Bypass",
            uri: MONGODB_URI + "&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true",
            options: {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
                socketTimeoutMS: 8000,
                tls: true,
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true
            }
        },
        // Strategy 2: Without TLS (if cluster supports it)
        {
            name: "No TLS",
            uri: MONGODB_URI.replace(/ssl=true/g, 'ssl=false').replace(/tls=true/g, 'tls=false'),
            options: {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
                socketTimeoutMS: 8000,
                tls: false
            }
        },
        // Strategy 3: Minimal options
        {
            name: "Minimal Config",
            uri: MONGODB_URI,
            options: {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000
            }
        }
    ];

    for (const strategy of connectionStrategies) {
        try {
            console.log(`🔌 Attempting MongoDB connection: ${strategy.name}...`);
            const client = new MongoClient(strategy.uri, strategy.options);
            
            // Test connection with ping
            await client.connect();
            await client.db(DB_NAME).admin().ping();
            
            console.log(`✅ MongoDB connected successfully using ${strategy.name}`);
            return client;
            
        } catch (err) {
            console.log(`❌ Strategy '${strategy.name}' failed: ${err.message.split('\n')[0]}`);
            continue;
        }
    }
    
    throw new Error("All MongoDB connection strategies failed");
}

async function start() {
    if (USE_LOCAL) {
        console.log("⚠️  Using LOCAL FILE DATABASE (db.json)");
        setupLocalRoutes();
    } else if (!MONGODB_URI) {
        console.log("⚠️  No MONGODB_URI in .env, falling back to local file DB");
        setupLocalRoutes();
    } else {
        try {
            const client = await connectToMongoDB();
            
            const db = client.db(DB_NAME);
            const users = db.collection("users");
            const farms = db.collection("farms");

            // Create indexes
            try {
                await users.createIndex({ email: 1 }, { unique: true });
                await farms.createIndex({ userId: 1 });
                console.log("📊 Database indexes created");
            } catch (e) {
                console.log("📊 Database indexes already exist");
            }

            // Migrate existing local data to MongoDB
            await migrateLocalDataToMongo(users, farms);

            setupMongoRoutes(users, farms);
            
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n🔌 Closing MongoDB connection...');
                await client.close();
                console.log('✅ MongoDB connection closed');
                process.exit(0);
            });
            
        } catch (err) {
            console.error("❌ All MongoDB connection attempts failed:", err.message);
            console.log("⚠️  Falling back to LOCAL FILE DATABASE");
            setupLocalRoutes();
        }
    }

    app.listen(PORT, () => {
        console.log("🚀 Server running on http://localhost:" + PORT);
        console.log("API endpoints ready at http://localhost:" + PORT + "/api/{users,login,farms}");
    });
}

start().catch(e => {
    console.error("Fatal error starting server:", e.message);
    process.exit(1);
});
