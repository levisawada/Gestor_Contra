import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Table: users
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID v4
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ---------------------------------------------------------------------------
// Table: passwords
// ---------------------------------------------------------------------------
export const passwords = sqliteTable("passwords", {
  id: text("id").primaryKey(), // UUID v4
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  siteUrl: text("site_url"), // optional
  username: text("username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  iv: text("iv").notNull(),         // AES-GCM initialization vector
  authTag: text("auth_tag").notNull(), // AES-GCM authentication tag
  notes: text("notes"),             // optional
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ---------------------------------------------------------------------------
// Inferred types (useful for controllers)
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type PasswordEntry = typeof passwords.$inferSelect;
export type NewPasswordEntry = typeof passwords.$inferInsert;
