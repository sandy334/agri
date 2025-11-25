import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

dotenv.config(); // VERY IMPORTANT — loads .env

// ----------------------
// ENV VARIABLES
// ----------------------
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "agri";
const USE_LOCAL = (process.env.USE_LOCAL_DB || "false").toLowerCase() === "true";

// ----------------------
// EXPRESS SETUP
// ----------------------
const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// FILE DB HELPERS
// ----------------------
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
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
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
    console.log("✅ Using MongoDB Atlas");

    app.get("/api/users", async (req, res) => {
        const all = await users.find().toArray();
        res.json(all.map(u => { const { password, ...rest } = u; return rest; }));
    });

    app.post("/api/users", async (req, res) => {
        const { email, password, name, role, thresholds } = req.body;
        if (!email || !password) return res.status(400).json({ error: "email & password required" });

        try {
            const newUser = {
                email,
                password,
                name: name || email.split("@")[0],
                role: role || "Farmer",
                thresholds: thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 }
            };

            const r = await users.insertOne(newUser);
            const created = await users.findOne({ _id: r.insertedId });
            const { password: _, ...safe } = created;

            res.status(201).json(safe);
        } catch (err) {
            if (err.code === 11000) return res.status(409).json({ error: "User exists" });
            res.status(500).json({ error: "server error" });
        }
    });

    app.post("/api/login", async (req, res) => {
        const { email, password } = req.body;
        const user = await users.findOne({ email, password });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const { password: _, ...safe } = user;
        res.json(safe);
    });

    app.get("/api/farms", async (req, res) => {
        const all = await farms.find().toArray();
        res.json(all);
    });

    app.post("/api/farms", async (req, res) => {
        const farm = req.body;
        const r = await farms.insertOne(farm);
        const created = await farms.findOne({ _id: r.insertedId });
        res.status(201).json(created);
    });
}

// ----------------------
// START SERVER
// ----------------------
async function start() {
    // If local DB is forced
    if (USE_LOCAL) {
        setupLocalRoutes();
    } 
    else {
        try {
            const client = new MongoClient(MONGODB_URI);
            await client.connect();
            console.log("🌍 Connected to MongoDB Atlas");

            const db = client.db(DB_NAME);
            const users = db.collection("users");
            const farms = db.collection("farms");

            await users.createIndex({ email: 1 }, { unique: true });

            setupMongoRoutes(users, farms);
        } 
        catch (err) {
            console.error("❌ MongoDB connection failed. Using local DB.", err.message);
            setupLocalRoutes();
        }
    }

    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log("🚀 Server running on port", port));
}

start();
