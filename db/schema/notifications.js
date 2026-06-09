const { pgTable, serial, integer, varchar, text, boolean, timestamp } = require('drizzle-orm/pg-core');
const { users } = require('./users');

const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  icon: varchar('icon', { length: 10 }).default('🔔'),
  message: text('message').notNull(),
  actionUrl: varchar('action_url', { length: 255 }),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { notifications };
