const { pgTable, serial, varchar, decimal, integer, boolean, timestamp } = require('drizzle-orm/pg-core');

const promoCodes = pgTable('promo_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountPct: decimal('discount_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  maxUsage: integer('max_usage'),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { promoCodes };
