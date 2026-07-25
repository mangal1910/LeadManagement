const mongoose = require('mongoose');

const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/leadmanagement_test';

beforeAll(async () => {
  try {
    await mongoose.connect(TEST_MONGO_URI);
  } catch (err) {
    console.error('Failed to connect to MongoDB test instance:', err.message);
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});
