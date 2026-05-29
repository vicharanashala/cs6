export const getFAQs = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Public: Fetched all official FAQ entries successfully",
      data: []
    });
  } catch (error) {
    next(error);
  }
};

export const searchQuestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    return res.status(200).json({
      success: true,
      message: `Public: Performed text index search for query: "${q || ''}"`,
      data: []
    });
  } catch (error) {
    next(error);
  }
};

export const promoteQuestionToFAQ = async (req, res, next) => {
  try {
    const { questionId, linkedBestAnswerId } = req.body;
    return res.status(200).json({
      success: true,
      message: `Admin: Promoted question ${questionId} to official FAQ with answer ${linkedBestAnswerId} successfully`
    });
  } catch (error) {
    next(error);
  }
};
