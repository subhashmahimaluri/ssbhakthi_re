// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('ssbhakthi_api');

// Create a user for the application
db.createUser({
  user: 'api_user',
  pwd: 'api_password',
  roles: [
    {
      role: 'readWrite',
      db: 'ssbhakthi_api',
    },
  ],
});

// Create initial collections with sample documents
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('logs');

// Insert sample data (optional)
db.users.insertOne({
  _id: ObjectId(),
  email: 'admin@ssbhakthi.com',
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
});

print('Database initialized successfully!');
