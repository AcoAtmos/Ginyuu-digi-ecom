const { db } = require("../../config/db");

exports.getStats = async () => {
  const queries = await Promise.all([
    db.query(`SELECT COUNT(*) FROM users WHERE role = 'MEMBER'`),
    db.query(`SELECT COUNT(*) FROM orders`),
    db.query(`SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status = 'completed'`),
    db.query(`SELECT COUNT(*) FROM product`),
    db.query(`SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`),
    db.query(`SELECT id, username, email, created_at FROM users WHERE role = 'MEMBER' ORDER BY created_at DESC LIMIT 5`),
    db.query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`),
    db.query(`SELECT DATE(created_at) as day, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue FROM orders WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY day`),
  ]);

  const [users, orders, revenue, products, recentOrders, recentUsers, orderStatus, dailyStats] = queries;

  return {
    stats: {
      totalUsers: parseInt(users.rows[0].count),
      totalOrders: parseInt(orders.rows[0].count),
      totalRevenue: parseInt(revenue.rows[0].revenue),
      totalProducts: parseInt(products.rows[0].count),
    },
    recentOrders: recentOrders.rows,
    recentUsers: recentUsers.rows,
    orderStatus: orderStatus.rows,
    dailyStats: dailyStats.rows,
  };
};
