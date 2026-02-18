import { Client } from 'pg';

async function getWidgetKey() {
    const client = new Client({
        connectionString: 'postgresql://chat:chat_secret@127.0.0.1:5432/chatdb'
    });

    try {
        await client.connect();
        const result = await client.query('SELECT widget_key, name FROM companies LIMIT 1');

        if (result.rows.length === 0) {
            console.log('❌ Nenhuma empresa encontrada no banco de dados.');
            console.log('Você precisa criar uma empresa primeiro.');
        } else {
            const company = result.rows[0];
            console.log('✅ Widget Key encontrada!');
            console.log('Empresa:', company.name);
            console.log('Widget Key:', company.widget_key);
            console.log('\nUse esta key no demo.html');
        }
    } catch (error) {
        console.error('Erro ao conectar ao banco:', error);
    } finally {
        await client.end();
    }
}

getWidgetKey();
