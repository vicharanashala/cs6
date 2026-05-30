import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Answer = (await import('./src/models/Answer.js')).default;
  const Question = (await import('./src/models/Question.js')).default;
  const docs = await Answer.aggregate([
        { $match: { status: 'visible' } },
        { $sort: { upvoteCount: -1 } },
        { $group: { _id: '$questionId', upvoteCount: { $first: '$upvoteCount' } } },
        { $sort: { upvoteCount: -1 } },
        { $limit: 10 }
      ]);
  const questionIds = docs.map(a => a._id);
  const qs = await Question.find({ _id: { $in: questionIds } });
  console.log('Question statuses:');
  qs.forEach(q => console.log(q.status));
  process.exit(0);
};
run();
