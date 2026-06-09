const { pgTable, serial, varchar, boolean, timestamp } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username').notNull(),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(),
  phone: varchar('phone'),
  imageUrl: varchar('image_url'),
  role: varchar('role').default('MEMBER'),
  terms: boolean('terms'),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { users };
