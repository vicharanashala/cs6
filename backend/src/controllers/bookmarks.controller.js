import Bookmark from '../models/Bookmark.js';
import Question from '../models/Question.js';

export const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const bookmarks = await Bookmark.find({ userId })
      .populate({
        path: 'questionId',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 });

    // Return the populated questions, filtering out any nulls in case question was deleted
    const bookmarkedQuestions = bookmarks
      .map(b => b.questionId)
      .filter(q => q !== null && q.status !== 'deleted');

    return res.status(200).json({
      success: true,
      data: bookmarkedQuestions
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBookmark = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'questionId is required' }
      });
    }

    const question = await Question.findById(questionId);
    if (!question || question.status === 'deleted') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Question not found' }
      });
    }

    const existingBookmark = await Bookmark.findOne({ userId, questionId });
    if (existingBookmark) {
      await Bookmark.deleteOne({ _id: existingBookmark._id });
      return res.status(200).json({
        success: true,
        message: 'FAQ removed from saved list.',
        isBookmarked: false
      });
    } else {
      await Bookmark.create({ userId, questionId });
      return res.status(200).json({
        success: true,
        message: 'FAQ bookmarked successfully!',
        isBookmarked: true
      });
    }
  } catch (error) {
    next(error);
  }
};
