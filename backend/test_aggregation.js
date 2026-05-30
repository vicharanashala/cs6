import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Answer = (await import('./src/models/Answer.js')).default;
  const docs = await Answer.aggregate([
        { $match: { status: 'visible' } },
        { $sort: { upvoteCount: -1 } },
        { $group: { _id: '$questionId', upvoteCount: { $first: '$upvoteCount' } } },
        { $sort: { upvoteCount: -1 } },
        { $limit: 10 }
      ]);
  console.log('Docs length:', docs.length);
  if (docs.length > 0) {
     console.log('Sample doc:', docs[0]);
  } else {
     // what if we just check ALL answers?
     const allAnswers = await Answer.countDocuments();
     console.log('Total answers in DB:', allAnswers);
     const visibleAnswers = await Answer.countDocuments({ status: 'visible' });
     console.log('Total visible answers in DB:', visibleAnswers);
  }
  process.exit(0);
};
run();
