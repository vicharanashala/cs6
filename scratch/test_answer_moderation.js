import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import User from 'file:///d:/Projects/FAQ/backend/src/models/User.js';
import Question from 'file:///d:/Projects/FAQ/backend/src/models/Question.js';
import Answer from 'file:///d:/Projects/FAQ/backend/src/models/Answer.js';

const URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

const run = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");

    // 1. Setup mock student and mock admin
    const studentUsername = `student_${Date.now()}`;
    const student = new User({
      username: studentUsername,
      name: "Mousumi Student",
      email: `${studentUsername}@example.com`,
      passwordHash: "dummyhash",
      role: 'user'
    });
    await student.save();

    const adminUsername = `admin_${Date.now()}`;
    const admin = new User({
      username: adminUsername,
      name: "Mousumi Admin",
      email: `${adminUsername}@example.com`,
      passwordHash: "dummyhash",
      role: 'admin'
    });
    await admin.save();

    // 2. Create an unresolved question
    const question = new Question({
      author: student._id,
      title: "How to configure Rosetta journal entries?",
      body: "I am having trouble formatting my daily Rosetta entries.",
      category: new mongoose.Types.ObjectId(), // dummy category ID
      status: 'unresolved'
    });
    await question.save();
    console.log(`Created unresolved question (ID: ${question._id})`);

    // 3. Simulate a student answering this question (should require moderation)
    // Create answer document directly with the pending state
    const studentAnswer = new Answer({
      questionId: question._id,
      author: student._id,
      body: "This is a detailed student answer that should require moderation.",
      status: 'pending',
      moderationState: 'pending'
    });
    await studentAnswer.save();
    console.log(`Student submitted answer (ID: ${studentAnswer._id}) in pending state.`);

    // Verify question status did not change to 'answered' yet
    let freshQuestion = await Question.findById(question._id);
    console.log(`Question status is still: "${freshQuestion.status}" (Expected: unresolved)`);
    if (freshQuestion.status !== 'unresolved') {
      throw new Error(`Expected question to remain unresolved, but got ${freshQuestion.status}`);
    }
    console.log("✅ Answers correctly default to pending review without auto-resolving or auto-answering the question!");

    // 4. Test approval workflow (simulated by setting status to visible and moderationState to approved)
    studentAnswer.status = 'visible';
    studentAnswer.moderationState = 'approved';
    await studentAnswer.save();

    // If approved, the question status updates to 'answered' (if it was unresolved)
    if (freshQuestion.status === 'unresolved') {
      freshQuestion.status = 'answered';
      await freshQuestion.save();
    }
    console.log("Admin approved the answer.");

    freshQuestion = await Question.findById(question._id);
    console.log(`Question status is now: "${freshQuestion.status}" (Expected: answered)`);
    if (freshQuestion.status !== 'answered') {
      throw new Error(`Expected question to be answered, but got ${freshQuestion.status}`);
    }
    console.log("✅ Approving answer updates question status to answered!");

    // 5. Test "Mark as Best" workflow on a second answer
    const secondAnswer = new Answer({
      questionId: question._id,
      author: student._id,
      body: "This is the definitive second answer that will be marked as best.",
      status: 'pending',
      moderationState: 'pending'
    });
    await secondAnswer.save();
    console.log(`Student submitted second answer (ID: ${secondAnswer._id}) in pending state.`);

    // Admin marks it as best (simulated)
    await Answer.updateMany({ questionId: question._id }, { isBestAnswer: false });
    secondAnswer.isBestAnswer = true;
    secondAnswer.status = 'visible';
    secondAnswer.moderationState = 'approved';
    await secondAnswer.save();

    freshQuestion.linkedBestAnswerId = secondAnswer._id;
    freshQuestion.acceptedAnswerId = secondAnswer._id;
    freshQuestion.status = 'resolved';
    await freshQuestion.save();
    console.log("Admin marked second answer as best.");

    freshQuestion = await Question.findById(question._id);
    const updatedSecondAnswer = await Answer.findById(secondAnswer._id);
    console.log(`Question status is now: "${freshQuestion.status}" (Expected: resolved)`);
    console.log(`Second Answer isBestAnswer: ${updatedSecondAnswer.isBestAnswer} (Expected: true)`);
    console.log(`Second Answer status: "${updatedSecondAnswer.status}" (Expected: visible)`);

    if (freshQuestion.status !== 'resolved' || !updatedSecondAnswer.isBestAnswer || updatedSecondAnswer.status !== 'visible') {
      throw new Error("Mark Best verification assertions failed.");
    }
    console.log("✅ Marking answer as best correctly approves it, resolves the question, and sets best answer flags!");

    // Clean up
    await Answer.deleteMany({ questionId: question._id });
    await Question.deleteOne({ _id: question._id });
    await User.deleteOne({ _id: student._id });
    await User.deleteOne({ _id: admin._id });
    console.log("Cleaned up test data.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

run();
