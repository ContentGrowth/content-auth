import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Helper to create users table with custom name
export const createUsersTable = (tableName = "users", fields?: Record<string, string>) => sqliteTable(tableName, {
    [fields?.id || "id"]: text(fields?.id || "id").primaryKey(),
    name: text(fields?.name || "name").notNull(),
    [fields?.email || "email"]: text(fields?.email || "email").notNull().unique(),
    [fields?.emailVerified || "emailVerified"]: integer(fields?.emailVerified || "emailVerified", { mode: "boolean" }).notNull(),
    image: text(fields?.image || "image"),
    [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
    [fields?.updatedAt || "updatedAt"]: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }).notNull(),
});

// Helper to create sessions table with custom name and users reference
export const createSessionsTable = (tableName = "sessions", usersTableOrFn: any = users, fields?: Record<string, string>, userPkField = "id") => {
    // resolve users table if lazy
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        [fields?.id || "id"]: text(fields?.id || "id").primaryKey(),
        expiresAt: integer(fields?.expiresAt || "expiresAt", { mode: "timestamp" }).notNull(),
        token: text(fields?.token || "token").notNull().unique(),
        createdAt: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
        updatedAt: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }).notNull(),
        ipAddress: text(fields?.ipAddress || "ipAddress"),
        userAgent: text(fields?.userAgent || "userAgent"),
        userId: text(fields?.userId || "userId").notNull().references(() => usersTable[userPkField], { onDelete: 'cascade' }),
        activeOrganizationId: text(fields?.activeOrganizationId || "activeOrganizationId"),
    });
};

// Helper to create accounts table
export const createAccountsTable = (tableName = "accounts", usersTableOrFn: any = users, fields?: Record<string, string>, userPkField = "id") => {
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        [fields?.id || "id"]: text(fields?.id || "id").primaryKey(),
        accountId: text(fields?.accountId || "accountId").notNull(),
        providerId: text(fields?.providerId || "providerId").notNull(),
        userId: text(fields?.userId || "userId").notNull().references(() => usersTable[userPkField], { onDelete: 'cascade' }),
        accessToken: text(fields?.accessToken || "accessToken"),
        refreshToken: text(fields?.refreshToken || "refreshToken"),
        idToken: text(fields?.idToken || "idToken"),
        accessTokenExpiresAt: integer(fields?.accessTokenExpiresAt || "accessTokenExpiresAt", { mode: "timestamp" }),
        refreshTokenExpiresAt: integer(fields?.refreshTokenExpiresAt || "refreshTokenExpiresAt", { mode: "timestamp" }),
        scope: text(fields?.scope || "scope"),
        password: text(fields?.password || "password"),
        createdAt: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
        updatedAt: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }).notNull(),
    });
};

// Helper to create verifications table
export const createVerificationsTable = (tableName = "verifications", fields?: Record<string, string>) => sqliteTable(tableName, {
    [fields?.id || "id"]: text(fields?.id || "id").primaryKey(),
    identifier: text(fields?.identifier || "identifier").notNull(),
    value: text(fields?.value || "value").notNull(),
    expiresAt: integer(fields?.expiresAt || "expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }),
    updatedAt: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }),
});

// Helper to create organizations table
export const createOrganizationsTable = (tableName = "organizations", fields?: Record<string, string>) => sqliteTable(tableName, {
    [fields?.id || "id"]: text(fields?.id || "id").primaryKey(),
    name: text(fields?.name || "name").notNull(),
    slug: text(fields?.slug || "slug").unique(),
    logo: text(fields?.logo || "logo"),
    createdAt: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
    metadata: text(fields?.metadata || "metadata"),
});

// Helper to create members table
export const createMembersTable = (tableName = "members", organizationsTableOrFn: any = organizations, usersTableOrFn: any = users, fields?: Record<string, string>, userPkField = "id") => {
    const organizationsTable = typeof organizationsTableOrFn === 'function' ? organizationsTableOrFn() : organizationsTableOrFn;
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        [fields?.id || "id"]: text(fields?.id || "id").primaryKey(),
        organizationId: text(fields?.organizationId || "organizationId").notNull().references(() => organizationsTable[fields?.organizationId || "id"] || organizationsTable.id, { onDelete: 'cascade' }), // Partial fix for org FK too?
        userId: text(fields?.userId || "userId").notNull().references(() => usersTable[userPkField], { onDelete: 'cascade' }),
        role: text(fields?.role || "role").notNull(),
        createdAt: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
    });
};

// Helper to create invitations table
export const createInvitationsTable = (tableName = "invitations", organizationsTableOrFn: any = organizations, usersTableOrFn: any = users, fields?: Record<string, string>, userPkField = "id") => {
    const organizationsTable = typeof organizationsTableOrFn === 'function' ? organizationsTableOrFn() : organizationsTableOrFn;
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        [fields?.id || "id"]: text(fields?.id || "id").primaryKey(),
        organizationId: text(fields?.organizationId || "organizationId").notNull().references(() => organizationsTable[fields?.organizationId || "id"] || organizationsTable.id, { onDelete: 'cascade' }),
        email: text(fields?.email || "email").notNull(),
        role: text(fields?.role || "role"),
        status: text(fields?.status || "status").notNull(),
        expiresAt: integer(fields?.expiresAt || "expiresAt", { mode: "timestamp" }).notNull(),
        inviterId: text(fields?.inviterId || "inviterId").notNull().references(() => usersTable[userPkField], { onDelete: 'cascade' }),
        createdAt: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
    });
};

// Default tables (backward compatibility)
// We need to initialize them in order of dependency for defaults
export const users = createUsersTable();
export const organizations = createOrganizationsTable();
export const sessions = createSessionsTable("sessions", users);
export const accounts = createAccountsTable("accounts", users);
export const verifications = createVerificationsTable();
export const members = createMembersTable("members", organizations, users);
export const invitations = createInvitationsTable("invitations", organizations, users);
