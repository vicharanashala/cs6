import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import PasswordResetOTP from './src/models/PasswordResetOTP.js';
import User from './src/models/User.js';
import bcrypt from 'bcrypt';

const runTest = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const email = 'banerjeeahana4@gmail.com';
    
    // Check if user exists, if not, create a dummy one for testing
    let user = await User.findOne({ email });
    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: email,
        passwordHash: await bcrypt.hash('Password@123', 10),
      });
    }

    console.log('--- Test Step 1: Request OTP ---');
    const res1 = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data1 = await res1.json();
    console.log('Forgot Password Response:', data1);

    // Wait a bit for DB to save OTP
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get OTP from DB
    const otpRecord = await PasswordResetOTP.findOne({ email: email, used: false });
    if (!otpRecord) {
      console.error('OTP record not found in DB!');
      process.exit(1);
    }
    console.log('Found OTP record in DB (hashed). Check your email for the actual code.');
    console.log('Run the following to manually test Step 2 and 3 if needed.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
