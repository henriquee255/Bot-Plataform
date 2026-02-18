import { DataSource } from 'typeorm';
import { Company } from '../modules/companies/company.entity';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    username: 'chat',
    password: 'chat_secret',
    database: 'chatdb',
    entities: [Company],
    synchronize: false,
});

async function createTestCompany() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conectado ao banco de dados');

        const companyRepo = AppDataSource.getRepository(Company);

        // Verificar se já existe
        const existing = await companyRepo.findOne({ where: { slug: 'empresa-teste' } });

        if (existing) {
            console.log('\n✅ Empresa de teste já existe!');
            console.log('Nome:', existing.name);
            console.log('Widget Key:', existing.widget_key);
            console.log('\nUse esta Widget Key no HTML:');
            console.log(`key: '${existing.widget_key}'`);
            return;
        }

        // Criar nova empresa
        const company = companyRepo.create({
            name: 'Empresa Teste',
            slug: 'empresa-teste',
            status: 'active',
            plan: 'free',
            max_agents: 3,
        });

        await companyRepo.save(company);

        console.log('\n✅ Empresa de teste criada!');
        console.log('Nome:', company.name);
        console.log('Widget Key:', company.widget_key);
        console.log('\nUse esta Widget Key no HTML:');
        console.log(`key: '${company.widget_key}'`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

createTestCompany();
