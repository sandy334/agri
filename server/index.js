import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'agricloud';

const client = new MongoClient(MONGODB_URI);

const app = express();
app.use(cors());
app.use(express.json());

async function start() {
  // If USE_LOCAL_DB=true is set, skip MongoDB and use file-based DB directly
  const useLocal = (process.env.USE_LOCAL_DB || 'false').toLowerCase() === 'true';
  if (useLocal) {
    console.log('USE_LOCAL_DB=true — using local file DB, skipping MongoDB connection');
    // File-based fallback
    const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');
    function ensureDb() {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], farms: [] }, null, 2));
      }
    }
    function readDb() {
      ensureDb();
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw || '{"users": [], "farms": []}');
    }
    function writeDb(obj) {
      ensureDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2));
    }

    app.get('/api/users', (req, res) => {
      const db = readDb();
      res.json(db.users || []);
    });

    app.post('/api/users', (req, res) => {
      const { email, password, name, role, thresholds } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const db = readDb();
      if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'User exists' });
      const newUser = {
        id: 'user_' + Date.now() + Math.random().toString(36).substr(2,9),
        name: name || email.split('@')[0],
        email,
        password,
        role: role || 'Farmer',
        thresholds: thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 }
      };
      db.users.push(newUser);
      writeDb(db);
      const { password: _, ...safe } = newUser;
      res.status(201).json(safe);
    });

    app.post('/api/login', (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const db = readDb();
      const user = db.users.find(u => u.email === email && u.password === password);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const { password: _, ...safe } = user;
      res.json(safe);
    });

    app.get('/api/farms', (req, res) => {
      const db = readDb();
      res.json(db.farms || []);
    });

    app.post('/api/farms', (req, res) => {
      const farm = req.body;
      if (!farm || !farm.id) return res.status(400).json({ error: 'farm with id required' });
      const db = readDb();
      db.farms.push(farm);
      writeDb(db);
      res.status(201).json(farm);
    });

    app.put('/api/farms/:id', (req, res) => {
      const id = req.params.id;
      let db = readDb();
      const idx = db.farms.findIndex(f => f.id === id);
      if (idx === -1) return res.status(404).json({ error: 'not found' });
      db.farms[idx] = req.body;
      writeDb(db);
      res.json(db.farms[idx]);
    });

    app.delete('/api/farms/:id', (req, res) => {
      const id = req.params.id;
      let db = readDb();
      db.farms = db.farms.filter(f => f.id !== id);
      writeDb(db);
      res.status(204).end();
    });

    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log('Server running on port', port, '(local file DB)'));
    return;
  }

  // Try MongoDB first; if it fails, fallback to file-based DB
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const users = db.collection('users');
    const farms = db.collection('farms');

    // Ensure indexes
    await users.createIndex({ email: 1 }, { unique: true }).catch(() => {});

    // Users
    app.get('/api/users', async (req, res) => {
      const all = await users.find().toArray();
      res.json(all.map(u => { const { password, ...rest } = u; return rest; }));
    });

    app.post('/api/users', async (req, res) => {
      const { email, password, name, role, thresholds } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      try {
        const newUser = {
          name: name || email.split('@')[0],
          email,
          password,
          role: role || 'Farmer',
          thresholds: thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 }
        };
        const r = await users.insertOne(newUser);
        const created = await users.findOne({ _id: r.insertedId });
        const { password: _, ...safe } = created;
        res.status(201).json(safe);
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ error: 'User exists' });
        console.error(e);
        res.status(500).json({ error: 'server error' });
      }
    });

    app.post('/api/login', async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const user = await users.findOne({ email, password });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const { password: _, ...safe } = user;
      res.json(safe);
    });

    // Farms
    app.get('/api/farms', async (req, res) => {
      const all = await farms.find().toArray();
      res.json(all);
    });

    app.post('/api/farms', async (req, res) => {
      const farm = req.body;
      if (!farm) return res.status(400).json({ error: 'farm required' });
      const r = await farms.insertOne(farm);
      const created = await farms.findOne({ _id: r.insertedId });
      res.status(201).json(created);
    });

    app.put('/api/farms/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const _id = new ObjectId(id);
        await farms.replaceOne({ _id }, req.body);
        const updated = await farms.findOne({ _id });
        res.json(updated);
      } catch (e) {
        res.status(400).json({ error: 'invalid id' });
      }
    });

    app.delete('/api/farms/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const _id = new ObjectId(id);
        await farms.deleteOne({ _id });
        res.status(204).end();
      } catch (e) {
        res.status(400).json({ error: 'invalid id' });
      }
    });
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to file DB:', err.message);

    // File-based fallback
    const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');
    function ensureDb() {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], farms: [] }, null, 2));
      }
    }
    function readDb() {
      ensureDb();
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw || '{"users": [], "farms": []}');
    }
    function writeDb(obj) {
      ensureDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2));
    }

    app.get('/api/users', (req, res) => {
      const db = readDb();
      res.json(db.users || []);
    });

    app.post('/api/users', (req, res) => {
      const { email, password, name, role, thresholds } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const db = readDb();
      if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'User exists' });
      const newUser = {
        id: 'user_' + Date.now() + Math.random().toString(36).substr(2,9),
        name: name || email.split('@')[0],
        email,
        password,
        role: role || 'Farmer',
        thresholds: thresholds || { tempMax: 35, humidityMin: 30, moistureMin: 20, rainMax: 20 }
      };
      db.users.push(newUser);
      writeDb(db);
      const { password: _, ...safe } = newUser;
      res.status(201).json(safe);
    });

    app.post('/api/login', (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const db = readDb();
      const user = db.users.find(u => u.email === email && u.password === password);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const { password: _, ...safe } = user;
      res.json(safe);
    });

    app.get('/api/farms', (req, res) => {
      const db = readDb();
      res.json(db.farms || []);
    });

    app.post('/api/farms', (req, res) => {
      const farm = req.body;
      if (!farm || !farm.id) return res.status(400).json({ error: 'farm with id required' });
      const db = readDb();
      db.farms.push(farm);
      writeDb(db);
      res.status(201).json(farm);
    });

    app.put('/api/farms/:id', (req, res) => {
      const id = req.params.id;
      let db = readDb();
      const idx = db.farms.findIndex(f => f.id === id);
      if (idx === -1) return res.status(404).json({ error: 'not found' });
      db.farms[idx] = req.body;
      writeDb(db);
      res.json(db.farms[idx]);
    });

    app.delete('/api/farms/:id', (req, res) => {
      const id = req.params.id;
      let db = readDb();
      db.farms = db.farms.filter(f => f.id !== id);
      writeDb(db);
      res.status(204).end();
    });
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log('Server running on port', port));
}

start();
