import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

async function resetPassword() {
    const client = new Client({
        connectionString: 'postgresql://chat:chat_secret@127.0.0.1:5432/chatdb',
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const email = 'eu.henriquee2501@gmail.com';
        const newPassword = '12345678';
        const hash = await bcrypt.hash(newPassword, 12);

        const res = await client.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [hash, email]
        );

        if (res.rowCount === 0) {
            console.log(`User with email ${email} not found.`);
        } else {
            console.log(`Password for ${email} reset successfully.`);
        }
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
    }
}

resetPassword();
