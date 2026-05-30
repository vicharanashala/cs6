import User from '../models/User.js';
import Question from '../models/Question.js';

const PHASES = {
  onboarding: {
    key: 'onboarding',
    name: 'Onboarding Phase',
    minDays: 0,
    maxDays: 3,
    description: 'About the internship, timings and dates, NOC, and Yaksha chat setup.'
  },
  documentation: {
    key: 'documentation',
    name: 'Documentation Phase',
    minDays: 4,
    maxDays: 7,
    description: 'Rosetta journaling setup, offer letter acceptance, and selection confirmations.'
  },
  vibe: {
    key: 'vibe',
    name: 'ViBe Platform Phase',
    minDays: 8,
    maxDays: 14,
    description: 'Coursework on the ViBe platform, Vibe LMS troubleshooting, and Phase 1 coursework.'
  },
  projects: {
    key: 'projects',
    name: 'Projects Phase',
    minDays: 15,
    maxDays: 999,
    description: 'Team formation, project assignment, developer setup, and active work with mentors.'
  }
};

export const getLifecycleBucket = (days) => {
  if (days <= 3) return 'onboarding';
  if (days <= 7) return 'documentation';
  if (days <= 14) return 'vibe';
  return 'projects';
};

export const getCohortPulse = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    // Determine start date: fallback from internshipStartDate to user createdAt
    const startDate = user.internshipStartDate ? new Date(user.internshipStartDate) : new Date(user.createdAt);
    const now = new Date();
    
    // Calculate days elapsed (inclusive of day 0)
    const diffTime = Math.max(0, now - startDate);
    let daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Handle day simulation override
    const { simulateDay } = req.query;
    if (simulateDay !== undefined && simulateDay !== null && simulateDay !== '') {
      const parsedDay = parseInt(simulateDay, 10);
      if (!isNaN(parsedDay) && parsedDay >= 0) {
        daysElapsed = parsedDay;
      }
    }

    const bucketKey = getLifecycleBucket(daysElapsed);
    const phaseInfo = {
      ...PHASES[bucketKey],
      currentDay: daysElapsed
    };

    // Query questions matching user's bucket
    const questions = await Question.find({
      lifecycleBucket: bucketKey,
      status: { $ne: 'deleted' }
    })
    .populate('author', 'username name avatar role badgeLevel')
    .populate('category', 'name')
    .sort({ createdAt: -1 });

    // Categorize
    const trendingFAQs = questions.filter(q => q.isFAQ === true).sort((a, b) => (b.views || 0) - (a.views || 0));
    const risingIssues = questions.filter(q => q.isFAQ !== true && q.status !== 'resolved').sort((a, b) => (b.helpfulVotesCount || 0) - (a.helpfulVotesCount || 0));
    const resolvedNotices = questions.filter(q => q.status === 'resolved').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({
      success: true,
      data: {
        phaseInfo,
        trendingFAQs,
        risingIssues,
        resolvedNotices
      }
    });
  } catch (error) {
    next(error);
  }
};
