const { pgTable, serial, integer, timestamp, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { product } = require('./product');

const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique().on(table.userId, table.productId),
}));

module.exports = { cartItems };
