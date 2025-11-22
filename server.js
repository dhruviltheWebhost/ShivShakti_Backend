const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json());

// CORS Configuration
// Allows your frontend to communicate with this backend
app.use(cors({
    origin: '*', // ⚠️ In production, replace '*' with your frontend URL (e.g., https://shiv-shakti.netlify.app)
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// --- Database Connection ---
const isProduction = process.env.NODE_ENV === 'production';

// Render requires SSL for Postgres connections
const connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
};

const pool = new Pool(connectionConfig);

// Test Connection on Startup
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error acquiring client', err.stack);
    }
    console.log('✅ Connected to PostgreSQL Database');
    release();
});

// --- API Routes ---

// 1. Get All Products (Optional: Filter by category)
app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM products';
        let params = [];

        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY id DESC'; // Newest products first

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

// 2. Add Product (Used by Admin Panel)
app.post('/api/products', async (req, res) => {
    try {
        const { name, description, price, category, image_url } = req.body;
        
        // Validation
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

// 3. Delete Product (Used by Admin Panel)
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

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
