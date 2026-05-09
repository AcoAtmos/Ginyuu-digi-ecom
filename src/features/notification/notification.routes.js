const router = require('express').Router();
const controller = require('./notification.controller');
const {  authMiddleware } = require('../../shared/middleware/auth.middleware'); 

router.get('/', authMiddleware, controller.getAllNotification);
router.patch('/read-all', authMiddleware, controller.markAllAsRead);
router.patch('/:id/read', authMiddleware, controller.markAsRead);

module.exports = { router, prefix: "/notifications" };