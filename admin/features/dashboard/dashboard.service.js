const { db } = require("../../config/db");
const { sql } = require("drizzle-orm");

exports.getStats = async () => {
  const queries = await Promise.all([
    db.execute(sql`SELECT COUNT(*) FROM users WHERE role = 'MEMBER'`),
    db.execute(sql`SELECT COUNT(*) FROM orders`),
    db.execute(sql`SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status = 'completed'`),
    db.execute(sql`SELECT COUNT(*) FROM product`),
    db.execute(sql`SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`),
    db.execute(sql`SELECT id, username, email, created_at FROM users WHERE role = 'MEMBER' ORDER BY created_at DESC LIMIT 5`),
    db.execute(sql`SELECT status, COUNT(*) as count FROM orders GROUP BY status`),
    db.execute(sql`SELECT DATE(created_at) as day, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue FROM orders WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY day`),
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
