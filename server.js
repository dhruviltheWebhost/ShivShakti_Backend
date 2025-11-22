const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json());

// CORS: Allow access from your future GitHub Pages
app.use(cors({
    origin: '*', // ⚠️ SECURITY: After hosting frontend, replace '*' with 'https://your-username.github.io'
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// --- Database Connection ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Render Postgres
    }
});

// --- API Routes ---

// 1. Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM products';
        let params = [];

        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY id DESC'; // Newest first

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Add Product
app.post('/api/products', async (req, res) => {
    try {
        const { name, description, price, category, image_url } = req.body;
        
        const query = `
            INSERT INTO products (name, description, price, category, image_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        
        const result = await pool.query(query, [name, description, price, category, image_url]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// 3. Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});