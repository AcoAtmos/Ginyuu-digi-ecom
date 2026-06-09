const { pgTable, serial, integer, varchar, text, timestamp } = require('drizzle-orm/pg-core');
const { orders } = require('./orders');

const queue = pgTable('queue', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  destination: varchar('destination'),
  tipe: varchar('tipe'),
  pesan: text('pesan'),
  status: varchar('status'),
  qrisUrl: text('qris_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { queue };
