// ... existing imports and pool setup ...

// ==========================================
// 🪄 MAGIC SETUP ROUTE (Run this once)
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
        
        // Add some dummy data so it's not empty
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

// ... existing API routes (GET /api/products) ...
