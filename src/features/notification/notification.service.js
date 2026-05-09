const { db } = require("../../config/database");
exports.getAllNotifications = async (userId) => {
    try {
        const result = await db.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        return result.rows.map(n => {
            const now = new Date();
            const diffMs = now - new Date(n.created_at);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            let time;
            if (diffMins < 1) {
                time = "Just now";
            } else if (diffMins < 60) {
                time = `${diffMins}m ago`;
            } else if (diffHours < 24) {
                time = `${diffHours}h ago`;
            } else {
                time = `${diffDays}d ago`;
            }
            return { ...n, time };
        });
    } catch (err) {
        console.error('Get all notifications failed:', err);
        throw err;
    }
}

exports.markAsRead = async (id, userId) => {
    try {
        await db.query("UPDATE notifications SET is_read = 'read' WHERE id = $1 AND user_id = $2", [id, userId]);
    } catch (err) {
        console.error('Mark as read failed:', err);
        throw err;
    }
};

exports.markAllAsRead = async (userId) => {
    try {
        await db.query("UPDATE notifications SET is_read = 'read' WHERE user_id = $1 AND is_read = 'unread'", [userId]);
    } catch (err) {
        console.error('Mark all as read failed:', err);
        throw err;
    }
};

exports.createNotification = async ({user_id, icon, message, action_url}) => {
    try {
        const queryResult = await db.query(
            `INSERT INTO notifications (user_id, icon, message, action_url)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [user_id, icon, message, action_url]
        );
        return queryResult.rows[0];
    } catch (err) {
        console.error('Create notification failed:', err);
        throw err; 
    }
}
