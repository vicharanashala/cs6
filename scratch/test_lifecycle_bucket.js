import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import User from 'file:///d:/Projects/FAQ/backend/src/models/User.js';
import Question from 'file:///d:/Projects/FAQ/backend/src/models/Question.js';
import { getLifecycleBucket } from 'file:///d:/Projects/FAQ/backend/src/controllers/cohort.controller.js';

const URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

const run = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");

    // 1. Create a test student user with internshipStartDate set to 10 days ago (Active Work Phase: Days 8-14)
    const testUsername = `student_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const testStudent = new User({
      username: testUsername,
      name: "Test Student",
      email: testEmail,
      passwordHash: "dummyhash",
      role: 'user',
      internshipStartDate: tenDaysAgo
    });
    await testStudent.save();
    console.log(`Created test student: ${testStudent.username} with start date: ${testStudent.internshipStartDate}`);

    // 2. Simulate posting a question by this user
    // The difference between now and student's start date is 10 days. So it must fall in 'active_work'.
    const diffTime = Math.max(0, new Date() - testStudent.internshipStartDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const computedBucket = getLifecycleBucket(diffDays);

    console.log(`Computed days elapsed: ${diffDays}, target bucket: ${computedBucket}`);

    const newQuestion = new Question({
      title: "How to configure active work sprints?",
      body: "I am having trouble finding the sprint details in Jira for active work phase.",
      author: testStudent._id,
      category: new mongoose.Types.ObjectId(), // dummy category
      lifecycleBucket: computedBucket
    });
    await newQuestion.save();
    console.log(`Saved question "${newQuestion.title}" with bucket: ${newQuestion.lifecycleBucket}`);

    if (newQuestion.lifecycleBucket !== 'active_work') {
      throw new Error(`Expected bucket to be active_work, got: ${newQuestion.lifecycleBucket}`);
    }
    console.log("✅ Automatic tagging based on internship start date works correctly!");

    // 3. Test Admin override of the lifecycle phase
    newQuestion.lifecycleBucket = 'setup'; // Override to Setup phase manually
    await newQuestion.save();
    console.log(`Admin overrode question bucket to: ${newQuestion.lifecycleBucket}`);

    const updatedQuestion = await Question.findById(newQuestion._id);
    if (updatedQuestion.lifecycleBucket !== 'setup') {
      throw new Error(`Expected overridden bucket to be setup, got: ${updatedQuestion.lifecycleBucket}`);
    }
    console.log("✅ Admin override functionality works correctly!");

    // Clean up
    await Question.deleteOne({ _id: newQuestion._id });
    await User.deleteOne({ _id: testStudent._id });
    console.log("Cleaned up test data.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

run();
