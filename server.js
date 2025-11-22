const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// --- 1. INITIALIZE APP (Must be here!) ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. MIDDLEWARE ---
app.use(express.json());
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// --- 3. DATABASE CONNECTION ---
const isProduction = process.env.NODE_ENV === 'production';
const connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
};

const pool = new Pool(connectionConfig);

// Test Connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error acquiring client', err.stack);
    }
    console.log('✅ Connected to PostgreSQL Database');
    release();
});

// ==========================================
// 🪄 4. MAGIC SETUP ROUTE (Run this once)
// ==========================================
app.get('/api/setup-db', async (req, res) => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price VARCHAR(50),
                category VARCHAR(50) NOT NULL,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);

        const checkData = await pool.query('SELECT * FROM products');
        if (checkData.rows.length === 0) {
            await pool.query(`
                INSERT INTO products (name, description, price, category, image_url)
                VALUES 
                ('Test Channel', 'Testing database connection', '500', 'channels', 'https://placehold.co/600'),
                ('Test Handle', 'Testing handles category', '200', 'handles', 'https://placehold.co/600')
            `);
            res.send("✅ Success! Table 'products' created and dummy data added.");
        } else {
            res.send("✅ Table 'products' already exists. You are good to go.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("❌ Error creating table: " + err.message);
    }
});

// --- 5. API ROUTES ---

// Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM products';
        let params = [];

        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY id DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

// Add Product
app.post('/api/products', async (req, res) => {
    try {
        const { name, description, price, category, image_url } = req.body;
        
        if (!name || !category || !image_url) {
            return res.status(400).json({ error: "Name, Category, and Image URL are required." });
        }

        const query = `
            INSERT INTO products (name, description, price, category, image_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        
        const result = await pool.query(query, [name, description, price, category, image_url]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// --- 6. START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
