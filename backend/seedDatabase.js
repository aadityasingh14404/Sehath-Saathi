import 'dotenv/config';
import { seedMedicines } from './utils/seedMedicines.js';
import connectDB from './config/mongodb.js';

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        await connectDB();
        await seedMedicines();
        console.log('✅ Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
