const { pgTable, serial, integer, varchar, text, timestamp } = require('drizzle-orm/pg-core');
const { invoices } = require('./invoices');

const paymentGatewayTransactions = pgTable('payment_gateway_transactions', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  gateway: varchar('gateway', { length: 50 }).notNull().default('klikqris'),
  gatewayOrderId: varchar('gateway_order_id', { length: 255 }),
  signature: varchar('signature', { length: 255 }),
  qrisUrl: text('qris_url'),
  directUrl: text('direct_url'),
  amount: integer('amount').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  gatewayExpiredAt: timestamp('gateway_expired_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

module.exports = { paymentGatewayTransactions };
