import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { limit = 20, cursor } = req.query;

    const query = { userId: req.user.userId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const limitNum = parseInt(limit, 10) || 20;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum + 1);

    const hasMore = notifications.length > limitNum;
    if (hasMore) notifications.pop();

    const nextCursor = notifications.length > 0 ? notifications[notifications.length - 1]._id : null;

    return res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        nextCursor,
        hasMore
      }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId: req.user.userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
