const { db } = require("../../config/db");
const { eq, sql } = require("drizzle-orm");
const { users, orders } = require("../../../db/schema");
const bcrypt = require('bcrypt');

exports.getList = async ({ search, sort, page, limit }) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    const orderDir = sort === 'asc' ? 'ASC' : 'DESC';
    const searchPattern = search && search.trim() ? `%${search.trim()}%` : null;

    const searchCondition = searchPattern
        ? sql`username ILIKE ${searchPattern} OR email ILIKE ${searchPattern} OR phone ILIKE ${searchPattern}`
        : sql`TRUE`;

    const countResult = await db.execute(sql`
        SELECT COUNT(*) FROM users
        WHERE ${searchCondition}
    `);
    const total = parseInt(countResult.rows[0].count);

    const result = await db.execute(sql`
        SELECT id, username, email, phone, image_url, role, status, created_at
        FROM users
        WHERE ${searchCondition}
        ORDER BY created_at ${sql.raw(orderDir)}
        LIMIT ${limitNum} OFFSET ${offset}
    `);

    return {
        success: true,
        data: result.rows,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

exports.getDetail = async (id) => {
    const [user] = await db.select({
        id: users.id, username: users.username, email: users.email,
        phone: users.phone, image_url: users.imageUrl, role: users.role,
        status: users.status, created_at: users.createdAt
    }).from(users).where(eq(users.id, id));
    if (!user) return null;

    const orderCountResult = await db.execute(sql`SELECT COUNT(*) as total_orders FROM orders WHERE user_id = ${id}`);
    const totalOrders = parseInt(orderCountResult.rows[0].total_orders);

    return {
        ...user,
        total_orders: totalOrders
    };
};

exports.create = async ({ username, email, password, phone }) => {
    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
        username,
        email,
        password: hashed,
        phone: phone || null,
        role: 'MEMBER',
        status: 'active',
    }).returning({
        id: users.id, username: users.username, email: users.email,
        phone: users.phone, role: users.role, created_at: users.createdAt
    });
    return user;
};

exports.update = async (id, fields) => {
    const allowed = ['username', 'email', 'phone', 'image_url', 'role'];
    const setItems = [];

    for (const key of allowed) {
        if (fields[key] !== undefined) {
            setItems.push(sql`${sql.raw(key)} = ${fields[key]}`);
        }
    }

    if (setItems.length === 0) {
        const [user] = await db.select({
            id: users.id, username: users.username, email: users.email,
            phone: users.phone, image_url: users.imageUrl, role: users.role,
            created_at: users.createdAt
        }).from(users).where(eq(users.id, id));
        return user || null;
    }

    const [user] = (await db.execute(sql`UPDATE users SET ${sql.join(setItems, sql`, `)} WHERE id = ${id} RETURNING id, username, email, phone, image_url, role, created_at`)).rows;
    return user || null;
};

exports.remove = async (id) => {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
    if (!user) return false;
    await db.delete(users).where(eq(users.id, id));
    return true;
};

exports.resetPassword = async (id, newPassword) => {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
    if (!user) return null;

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, id));
    return user;
};
