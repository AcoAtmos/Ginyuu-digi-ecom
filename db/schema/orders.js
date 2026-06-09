const { pgTable, serial, integer, varchar, timestamp } = require('drizzle-orm/pg-core');
const { users } = require('./users');

const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  subtotal: integer('subtotal').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  uniqueNum: integer('unique_num').notNull().default(0),
  total: integer('total').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { orders };
