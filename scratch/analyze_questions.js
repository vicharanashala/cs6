import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import Question from 'file:///d:/Projects/FAQ/backend/src/models/Question.js';

const URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

const run = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");

    const total = await Question.countDocuments({ status: { $ne: 'deleted' } });
    console.log(`Total questions: ${total}`);

    // Fetch 30 questions to inspect their title, body, and tags
    const sampleQuestions = await Question.find({ status: { $ne: 'deleted' } })
      .select('title body tags lifecycleBucket')
      .limit(30);

    console.log("\n--- Sample Questions ---");
    sampleQuestions.forEach((q, idx) => {
      console.log(`[${idx+1}] Title: "${q.title}"`);
      console.log(`    Tags: [${q.tags?.join(', ')}]`);
      console.log(`    Current Bucket: ${q.lifecycleBucket}`);
    });

  } catch (error) {
    console.error("Analysis failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

run();
