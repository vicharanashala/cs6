import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import bcrypt from 'file:///d:/Projects/FAQ/backend/node_modules/bcrypt/bcrypt.js';

const MONGODB_URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

const resetPassword = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    const username = 'admin_31241';
    const email = 'admin_3544@example.com';
    const newPassword = 'Admin@123';

    // Hash the password using bcrypt
    console.log('Hashing new password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    console.log(`Updating password for username: ${username}, email: ${email}...`);
    const result = await mongoose.connection.db.collection('users').updateOne(
      { username, email },
      { $set: { passwordHash } }
    );

    if (result.matchedCount === 0) {
      console.log('No user matched the provided username and email. Searching for user by username only...');
      const userByUsername = await mongoose.connection.db.collection('users').findOne({ username });
      if (userByUsername) {
        console.log(`User found by username. Email is: ${userByUsername.email}. Updating...`);
        const updateRes = await mongoose.connection.db.collection('users').updateOne(
          { username },
          { $set: { passwordHash } }
        );
        console.log(`Update result: ${JSON.stringify(updateRes)}`);
      } else {
        console.log('User not found by username either.');
      }
    } else {
      console.log(`Update successful: ${JSON.stringify(result)}`);
    }

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

resetPassword();
