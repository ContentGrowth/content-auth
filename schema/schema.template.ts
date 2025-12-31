import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ==========================================
// @contentgrowth/content-auth - Drizzle Schema Template
// ==========================================
//
// USAGE:
// 1. Copy this file to your project's src/db/ folder
// 2. Add your application-specific tables after the auth tables
// 3. Run: npm run db:generate (to create migrations)
// 4. Run: npm run dev (to apply migrations)
//
// EXTENDING TABLES:
// You can add extra columns to any table for your business needs.
// Just ensure you keep ALL the columns defined here - they are required
// by Better Auth to function correctly.
//
// ==========================================

// ==========================================
// Core Authentication Tables
// ==========================================

/**
 * Users - Core identity table
 */
export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
    image: text("image"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * Sessions - Active user sessions
 */
export const sessions = sqliteTable("sessions", {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: text("activeOrganizationId"),
});

/**
 * Accounts - OAuth/Credential providers
 */
export const accounts = sqliteTable("accounts", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

/**
 * Verifications - Email/Token verification
 */
export const verifications = sqliteTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ==========================================
// Organizations Plugin Tables
// ==========================================

/**
 * Organizations - Multi-tenant support
 */
export const organizations = sqliteTable("organizations", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    metadata: text("metadata"), // JSON: { domain, is_verified, verification_source, etc. }
});

/**
 * Members - Organization membership
 */
export const members = sqliteTable("members", {
    id: text("id").primaryKey(),
    organizationId: text("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'owner', 'admin', 'member'
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

/**
 * Invitations - Pending org invitations
 */
export const invitations = sqliteTable("invitations", {
    id: text("id").primaryKey(),
    organizationId: text("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull(), // 'pending', 'accepted', 'rejected', 'expired'
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    inviterId: text("inviterId").notNull().references(() => users.id, { onDelete: "cascade" }),
});

// ==========================================
// Relations
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    accounts: many(accounts),
    members: many(members),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
    members: many(members),
    invitations: many(invitations),
}));

export const membersRelations = relations(members, ({ one }) => ({
    organization: one(organizations, { fields: [members.organizationId], references: [organizations.id] }),
    user: one(users, { fields: [members.userId], references: [users.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
    organization: one(organizations, { fields: [invitations.organizationId], references: [organizations.id] }),
    inviter: one(users, { fields: [invitations.inviterId], references: [users.id] }),
}));

// ==========================================
// YOUR APPLICATION TABLES GO BELOW
// ==========================================
// Example:
//
// export const myEntity = sqliteTable("my_entity", {
//     id: text("id").primaryKey(),
//     orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
//     name: text("name").notNull(),
//     createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
// });
