import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import Question from 'file:///d:/Projects/FAQ/backend/src/models/Question.js';
import Category from 'file:///d:/Projects/FAQ/backend/src/models/Category.js';

const URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

const run = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");

    // Get unique categories
    const categories = await Category.find();
    console.log(`--- Categories (${categories.length}) ---`);
    categories.forEach(c => {
      console.log(`- ${c.name} (${c._id})`);
    });

    // Get unique tags used by questions
    const questions = await Question.find({ status: { $ne: 'deleted' } }).select('tags category');
    const tagsSet = new Set();
    const catCounts = {};

    questions.forEach(q => {
      if (q.tags) {
        q.tags.forEach(t => tagsSet.add(t));
      }
      if (q.category) {
        catCounts[q.category] = (catCounts[q.category] || 0) + 1;
      }
    });

    console.log(`\n--- Unique Tags (${tagsSet.size}) ---`);
    console.log(Array.from(tagsSet).join(', '));

    console.log("\n--- Category Question Counts ---");
    categories.forEach(c => {
      console.log(`- ${c.name}: ${catCounts[c._id] || 0} questions`);
    });

  } catch (error) {
    console.error("Failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

run();
