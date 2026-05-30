import fs from 'fs';
import path from 'path';
import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import User from 'file:///d:/Projects/FAQ/backend/src/models/User.js';
import Category from 'file:///d:/Projects/FAQ/backend/src/models/Category.js';
import Question from 'file:///d:/Projects/FAQ/backend/src/models/Question.js';
import Answer from 'file:///d:/Projects/FAQ/backend/src/models/Answer.js';
import Report from 'file:///d:/Projects/FAQ/backend/src/models/Report.js';

const URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

// Map section titles to lifecycle buckets
const getSectionBucket = (title) => {
  const t = title.toLowerCase().trim();
  
  // 1. onboarding : about the internship, timings and dates, NOC, yaksha, code of conduct, interviews
  if (
    t.includes("about the internship") ||
    t.includes("timing and dates") ||
    t.includes("noc") ||
    t.includes("yaksha") ||
    t.includes("code of conduct") ||
    t.includes("interviews")
  ) {
    return "onboarding";
  }

  // 2. Documentation: Rosetta, Offer letter, selection, certificate
  if (
    t.includes("rosetta") ||
    t.includes("selection, offer letter") ||
    t.includes("certificate")
  ) {
    return "documentation";
  }

  // 3. ViBe: Vibe, Phase 1 coursework
  if (
    t.includes("vibe platform") ||
    t.includes("phase 1")
  ) {
    return "vibe";
  }

  // 4. Projects: Work, mentorship, projects, team formation
  if (
    t.includes("work, mentorship") ||
    t.includes("team formation")
  ) {
    return "projects";
  }

  return "onboarding"; // default fallback
};

const run = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");

    // 1. Find the superadmin user to act as author
    let admin = await User.findOne({ role: 'superadmin' });
    if (!admin) {
      admin = await User.findOne({ role: 'admin' });
    }
    if (!admin) {
      console.log("No admin/superadmin user found in database. Please run seedSuperadmin first.");
      return;
    }
    console.log(`Using user ${admin.username} (${admin._id}) as author for FAQ questions.`);

    // 2. Clear old Q&A data
    console.log("Cleaning database collections: Category, Question, Answer, Report...");
    await Category.deleteMany({});
    await Question.deleteMany({});
    await Answer.deleteMany({});
    await Report.deleteMany({});
    console.log("Cleanup complete.");

    // 3. Read samagama_faq.json
    const faqFilePath = 'd:/Projects/FAQ/samagama_faq.json';
    const faqData = JSON.parse(fs.readFileSync(faqFilePath, 'utf8'));

    let categoriesCount = 0;
    let questionsCount = 0;
    const bucketCounts = { onboarding: 0, documentation: 0, vibe: 0, projects: 0 };

    // 4. Iterate over sections and questions
    for (const section of faqData.sections) {
      console.log(`Creating category: "${section.title}"`);
      
      const newCategory = new Category({
        name: section.title,
        description: `Official FAQs for the section: ${section.title}`,
        isApproved: true
      });
      await newCategory.save();
      categoriesCount++;

      const bucket = getSectionBucket(section.title);

      for (const q of section.questions) {
        // Pad the question title / body to satisfy minlength requirements
        const titleText = q.question;
        const bodyText = titleText.length >= 20 
          ? titleText 
          : `Official FAQ query: ${titleText}`;

        // Create question in pending status initially or approved
        const questionDoc = new Question({
          author: admin._id,
          title: titleText,
          body: bodyText,
          tags: [bucket, section.title.replace(/\s+/g, '_').toLowerCase()],
          category: newCategory._id,
          status: 'resolved',
          isFAQ: true,
          lifecycleBucket: bucket,
          moderationStatus: 'approved'
        });
        await questionDoc.save();

        // Create corresponding best answer
        const answerDoc = new Answer({
          questionId: questionDoc._id,
          author: admin._id,
          body: q.answer,
          status: 'visible',
          moderationState: 'approved',
          isBestAnswer: true
        });
        await answerDoc.save();

        // Link the best answer to the question
        questionDoc.linkedBestAnswerId = answerDoc._id;
        await questionDoc.save();

        questionsCount++;
        bucketCounts[bucket]++;
      }
    }

    console.log("\n--- Seeding Successful ---");
    console.log(`- Categories Seeded: ${categoriesCount}`);
    console.log(`- Questions Seeded: ${questionsCount}`);
    console.log("- Phase Distribution:");
    console.log(`  - Onboarding: ${bucketCounts.onboarding}`);
    console.log(`  - Documentation: ${bucketCounts.documentation}`);
    console.log(`  - ViBe: ${bucketCounts.vibe}`);
    console.log(`  - Projects: ${bucketCounts.projects}`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

run();
