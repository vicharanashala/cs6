// src/config/db.js
// MongoDB connection utility using Mongoose

import mongoose from "mongoose";
import Category from "../models/Category.js";

const categoriesToSeed = [
  { name: "Admissions & Entry", description: "Information on intake, entry requirements, and application procedures." },
  { name: "Fees & Scholarships", description: "Tuition fees, payment methods, and financial support packages." },
  { name: "Academic Registry", description: "Course enrollment, curriculum schedules, and credit transfers." },
  { name: "Hostel & Housing", description: "Room allocations, campus residential life, and meal plans." },
  { name: "Internship Programs", description: "Industrial placements, application deadlines, and company partners." },
  { name: "Exams & Grading", description: "Assessment schedules, GPA calculation, and examination rules." },
  { name: "Campus Facilities", description: "Library hours, computer labs, study zones, and parking configurations." },
  { name: "Student Activities", description: "Clubs, student unions, cultural events, and sports recreation." },
  { name: "IT & Tech Support", description: "Wi-Fi login, portal passwords, email access, and software licenses." },
  { name: "Health & Wellness", description: "On-campus clinic, counseling services, and emergency healthcare help." },
  { name: "Library & E-Resources", description: "Online journal databases, textbook borrowing, and research resources." },
  { name: "Career Guidance", description: "Resume reviews, mock interviews, and career counseling services." },
  { name: "International Students", description: "Visas, exchange configurations, travel advisories, and orientations." }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Seed categories if database is empty
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log("🌱 Database categories collection is empty. Seeding 13 foundational categories...");
      await Category.insertMany(categoriesToSeed);
      console.log("🌱 Seeding completed successfully!");
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.warn(`⚠️  Server will start without database connection`);
  }
};

export default connectDB;
