const { pgTable, serial, varchar, integer, decimal, text, timestamp } = require('drizzle-orm/pg-core');

const product = pgTable('product', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  slug: varchar('slug').notNull().unique(),
  price: integer('price').notNull(),
  discount: decimal('discount'),
  category: varchar('category'),
  preview: varchar('preview'),
  description: text('description'),
  salesCount: integer('sales_count').default(0),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { product };
