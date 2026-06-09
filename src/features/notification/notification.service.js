const { db } = require("../../../db");
const { notifications } = require("../../../db/schema");
const { eq, and, desc } = require("drizzle-orm");
exports.getAllNotifications = async (userId) => {
    try {
        const result = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
        return result.map(n => {
            const now = new Date();
            const diffMs = now - new Date(n.createdAt);
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
        await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    } catch (err) {
        console.error('Mark as read failed:', err);
        throw err;
    }
};

exports.markAllAsRead = async (userId) => {
    try {
        await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    } catch (err) {
        console.error('Mark all as read failed:', err);
        throw err;
    }
};

exports.createNotification = async ({user_id, icon, message, action_url}) => {
    try {
        const [queryResult] = await db.insert(notifications).values({ userId: user_id, icon, message, actionUrl: action_url }).returning({ id: notifications.id });
        return queryResult;
    } catch (err) {
        console.error('Create notification failed:', err);
        throw err; 
    }
}
