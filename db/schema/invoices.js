const { pgTable, serial, integer, varchar, timestamp } = require('drizzle-orm/pg-core');
const { orders } = require('./orders');

const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  discountAmount: integer('discount_amount').notNull().default(0),
  total: integer('total').notNull().default(0),
  expiresAt: timestamp('expires_at').notNull(),
  uniqueNum: integer('unique_num').notNull().default(0),
  statusPayment: varchar('status_payment', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { invoices };
