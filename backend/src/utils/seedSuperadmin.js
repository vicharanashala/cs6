import User from '../models/User.js';
import bcrypt from 'bcrypt';

export const seedSuperadmin = async () => {
  try {
    const email = 'coordinator@example.com';
    const password = 'AdminPassword123';
    const username = 'coordinator';

    let superadmin = await User.findOne({ email });

    if (!superadmin) {
      console.log(`[Seeder] Creating superadmin account (${email})...`);
      const passwordHash = await bcrypt.hash(password, 10);
      superadmin = new User({
        email,
        username,
        name: 'Coordinator',
        passwordHash,
        role: 'superadmin'
      });
      await superadmin.save();
      console.log(`[Seeder] Superadmin account created successfully.`);
    } else if (superadmin.role !== 'superadmin') {
      console.log(`[Seeder] Promoting existing user (${email}) to superadmin...`);
      superadmin.role = 'superadmin';
      await superadmin.save();
      console.log(`[Seeder] Promotion successful.`);
    } else {
      console.log(`[Seeder] Superadmin account (${email}) verified.`);
    }
  } catch (error) {
    console.error(`[Seeder] Error checking/creating superadmin:`, error.message);
  }
};
