import { Client } from 'pg';

async function checkDb() {
    console.log('Checking DB connection...');
    const client = new Client({
        connectionString: 'postgresql://chat:chat_secret@127.0.0.1:5432/chatdb',
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Current time:', res.rows[0]);
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await client.end();
    }
}

checkDb();
