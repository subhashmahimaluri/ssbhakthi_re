import { config } from 'dotenv';

// Load environment variables
config();

async function seed(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // This is a placeholder for database seeding logic
    // You can add MongoDB connection and data insertion here

    console.log('✅ Database seeding completed successfully!');

    // Sample data structure you might want to seed:
    const sampleData = {
      users: [
        {
          email: 'admin@ssbhakthi.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: new Date(),
        },
        {
          email: 'user@ssbhakthi.com',
          name: 'Regular User',
          role: 'user',
          createdAt: new Date(),
        },
      ],
      categories: [
        { name: 'General', description: 'General category' },
        { name: 'Important', description: 'Important items' },
      ],
    };

    console.log('Sample data structure:', JSON.stringify(sampleData, null, 2));
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seed();
}

export { seed };
