import Question from '../models/Question.js';
import User from '../models/User.js';
import { getLifecycleBucket } from '../controllers/cohort.controller.js';

export const migrateCohort = async () => {
  try {
    console.log('[Migration] Starting cohort lifecycle backfill...');
    
    // Find all questions that don't have a lifecycleBucket set yet
    const questions = await Question.find({ lifecycleBucket: { $eq: null } });
    console.log(`[Migration] Found ${questions.length} questions to migrate.`);
    
    let successCount = 0;
    
    for (const question of questions) {
      // Find the author
      const author = await User.findById(question.author);
      if (!author) {
        // Fallback: Use question creation date as onboarding if author is missing
        const bucket = getLifecycleBucket(0); // Day 0 -> Onboarding
        question.lifecycleBucket = bucket;
        await question.save();
        successCount++;
        continue;
      }
      
      const startDate = author.internshipStartDate ? new Date(author.internshipStartDate) : new Date(author.createdAt);
      const questionDate = new Date(question.createdAt);
      
      // Calculate days elapsed since author onboarding at the time question was asked
      const diffTime = Math.max(0, questionDate - startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const bucket = getLifecycleBucket(diffDays);
      question.lifecycleBucket = bucket;
      await question.save();
      successCount++;
    }
    
    console.log(`[Migration] Successfully migrated ${successCount}/${questions.length} questions.`);
  } catch (err) {
    console.error('[Migration] Cohort migration failed:', err.message);
  }
};
