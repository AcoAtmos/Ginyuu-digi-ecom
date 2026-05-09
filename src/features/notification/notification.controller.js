const notificationService = require('./notification.service');

exports.getAllNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationService.getAllNotifications(userId);
        res.status(200).json({ code: 200, status: "success", message: "Success", notifications });
    } catch (err) {
        console.error('Get all notifications failed:', err);
        res.status(500).json({ code: 500, status: "failed", message: "Failed to get all notifications" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await notificationService.markAsRead(id, userId);
        res.status(200).json({ code: 200, status: "success", message: "Notification marked as read" });
    } catch (err) {
        console.error('Mark as read failed:', err);
        res.status(500).json({ code: 500, status: "failed", message: "Failed to mark as read" });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await notificationService.markAllAsRead(userId);
        res.status(200).json({ code: 200, status: "success", message: "All notifications marked as read" });
    } catch (err) {
        console.error('Mark all as read failed:', err);
        res.status(500).json({ code: 500, status: "failed", message: "Failed to mark all as read" });
    }
};

