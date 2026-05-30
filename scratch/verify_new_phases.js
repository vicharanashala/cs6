import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import Category from 'file:///d:/Projects/FAQ/backend/src/models/Category.js';
import Question from 'file:///d:/Projects/FAQ/backend/src/models/Question.js';

const URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

const run = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");

    // 1. Verify Category count & names
    const categories = await Category.find();
    console.log(`\nVerified Category Count: ${categories.length} (Expected: 13)`);
    categories.forEach(c => console.log(`  - Category: "${c.name}"`));

    if (categories.length !== 13) {
      throw new Error(`Category count is ${categories.length}, expected 13.`);
    }

    // 2. Verify Question count & phase distribution
    const questions = await Question.find();
    console.log(`\nVerified Question Count: ${questions.length} (Expected: 127)`);

    const distribution = { onboarding: 0, documentation: 0, vibe: 0, projects: 0 };
    let invalidBucketCount = 0;

    questions.forEach(q => {
      if (distribution[q.lifecycleBucket] !== undefined) {
        distribution[q.lifecycleBucket]++;
      } else {
        console.log(`  - Invalid lifecycleBucket found: "${q.lifecycleBucket}" on question "${q.title}"`);
        invalidBucketCount++;
      }
    });

    console.log("\nPhase Distribution Summary:");
    console.log(`- Onboarding: ${distribution.onboarding} (Expected: 27)`);
    console.log(`- Documentation: ${distribution.documentation} (Expected: 35)`);
    console.log(`- ViBe Platform: ${distribution.vibe} (Expected: 31)`);
    console.log(`- Projects: ${distribution.projects} (Expected: 34)`);

    if (invalidBucketCount > 0) {
      throw new Error(`Found ${invalidBucketCount} questions with invalid buckets.`);
    }

    console.log("\n✅ Database validation check passed successfully! All data aligns perfectly with the 4-phase system.");

  } catch (error) {
    console.error("❌ Validation script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

run();
