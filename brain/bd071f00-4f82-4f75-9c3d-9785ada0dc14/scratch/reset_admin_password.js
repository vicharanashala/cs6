import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import bcrypt from 'file:///d:/Projects/FAQ/backend/node_modules/bcrypt/bcrypt.js';

const MONGODB_URI = process.env.MONGODB_URI;

const resetPassword = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    const username = process.env.username;
    const email = process.env.email;
    const newPassword = process.env.password;

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
