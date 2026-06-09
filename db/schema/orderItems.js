const { pgTable, serial, integer } = require('drizzle-orm/pg-core');
const { orders } = require('./orders');
const { product } = require('./product');

const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  price: integer('price').notNull(),
});

module.exports = { orderItems };
