import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';
import Question from 'file:///d:/Projects/FAQ/backend/src/models/Question.js';
import Category from 'file:///d:/Projects/FAQ/backend/src/models/Category.js';

const URI = 'mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq';

const mapCategoryToBucket = (categoryName, questionTitle = "", questionTags = []) => {
  const name = categoryName.toLowerCase();
  const title = questionTitle.toLowerCase();
  const tags = (questionTags || []).map(t => t.toLowerCase());

  // 1. Placements, jobs, certificates, completion -> completion
  if (
    tags.includes('placement') || 
    tags.includes('jobs') || 
    tags.includes('certificate') || 
    tags.includes('interviews_rela') ||
    name.includes('certificate') ||
    name.includes('interviews') ||
    title.includes('placement') ||
    title.includes('job') ||
    title.includes('certificate')
  ) {
    return 'completion';
  }

  // 2. Mid-term review, exams, journal, feedback -> review
  if (
    tags.includes('rosetta___your_') || 
    tags.includes('exam') || 
    tags.includes('academic') ||
    name.includes('rosetta') || 
    title.includes('journal') || 
    title.includes('feedback') ||
    title.includes('evaluation') ||
    title.includes('mid-term')
  ) {
    return 'review';
  }

  // 3. Work, projects, deployment, daily, sprints, code -> active_work
  if (
    tags.includes('work__mentorshi') || 
    tags.includes('deployment') || 
    tags.includes('aws') || 
    tags.includes('mern') || 
    tags.includes('deploy') || 
    tags.includes('heroku') ||
    name.includes('work, mentorship') ||
    name.includes('minimax') ||
    name.includes('spurti') ||
    title.includes('sprint') ||
    title.includes('task') ||
    title.includes('jira') ||
    title.includes('mentor')
  ) {
    return 'active_work';
  }

  // 4. Setup, team formation, configuration, environment, platform setup -> setup
  if (
    tags.includes('team_formation') || 
    tags.includes('vibe_platform') || 
    tags.includes('yaksha_chat_rel') ||
    name.includes('team formation') ||
    name.includes('vibe platform') ||
    name.includes('yaksha chat') ||
    name.includes('conduct') ||
    title.includes('setup') ||
    title.includes('install') ||
    title.includes('team') ||
    title.includes('slack') ||
    title.includes('channel')
  ) {
    return 'setup';
  }

  // 5. General onboarding, timing, NOC, offer letters -> onboarding
  if (
    tags.includes('noc') || 
    tags.includes('timings and dates') || 
    tags.includes('selection__offe') || 
    tags.includes('noc__no_objecti') ||
    name.includes('noc') ||
    name.includes('timing') ||
    name.includes('selection, offer') ||
    name.includes('about this internship') ||
    title.includes('onboard') ||
    title.includes('noc') ||
    title.includes('timing') ||
    title.includes('start') ||
    title.includes('offer letter')
  ) {
    return 'onboarding';
  }

  return 'onboarding'; 
};

const run = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");

    const questions = await Question.find({ status: { $ne: 'deleted' } }).populate('category');
    
    const counts = {
      onboarding: 0,
      setup: 0,
      active_work: 0,
      review: 0,
      completion: 0
    };

    questions.forEach(q => {
      const catName = q.category?.name || "";
      const bucket = mapCategoryToBucket(catName, q.title, q.tags);
      counts[bucket]++;
    });

    console.log("\n--- Projected Segregation Distribution ---");
    console.log(`- Onboarding: ${counts.onboarding}`);
    console.log(`- Setup: ${counts.setup}`);
    console.log(`- Active Work: ${counts.active_work}`);
    console.log(`- Review: ${counts.review}`);
    console.log(`- Completion: ${counts.completion}`);
    console.log(`Total processed: ${questions.length}`);

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

run();
