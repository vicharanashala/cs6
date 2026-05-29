import Category from '../models/Category.js';
import Question from '../models/Question.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: 'category',
          as: 'questions'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          questionCount: {
            $size: {
              $filter: {
                input: '$questions',
                as: 'q',
                cond: { $ne: ['$$q.status', 'deleted'] }
              }
            }
          }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    const questions = await Question.find({ category: id, status: { $ne: 'deleted' } })
      .populate('author', 'username name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        category,
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name already exists'
        }
      });
    }

    const newCategory = new Category({ name, description });
    await newCategory.save();

    return res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
};

export const editCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    if (name && name !== category.name) {
      const existingName = await Category.findOne({ name });
      if (existingName) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Category name already exists'
          }
        });
      }
      category.name = name;
    }

    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has questions associated with it
    const activeQuestions = await Question.countDocuments({ category: id, status: { $ne: 'deleted' } });
    if (activeQuestions > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete category containing active questions'
        }
      });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
