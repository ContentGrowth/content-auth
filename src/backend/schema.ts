import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Helper to map additional fields to Drizzle columns
const createAdditionalColumns = (additionalFields?: Record<string, any>) => {
    if (!additionalFields) return {};

    const columns: Record<string, any> = {};

    Object.entries(additionalFields).forEach(([key, config]) => {
        const type = typeof config === 'string' ? config : config.type;
        const isRequired = typeof config === 'object' && config.required;

        let col;
        if (type === 'string') {
            col = text(key);
        } else if (type === 'number') {
            col = integer(key);
        } else if (type === 'boolean') {
            col = integer(key, { mode: "boolean" });
        } else if (type === 'date') {
            col = integer(key, { mode: "timestamp" });
        } else {
            // Default to text for unknown types
            col = text(key);
        }

        if (isRequired && col) {
            col = col.notNull();
        }

        if (col) {
            columns[key] = col;
        }
    });

    return columns;
};

// Helper to create users table with custom name
export const createUsersTable = (tableName = "users", fields?: Record<string, string>, additionalFields?: Record<string, any>) => sqliteTable(tableName, {
    id: text(fields?.id || "id").primaryKey(),
    [fields?.name || "name"]: text(fields?.name || "name").notNull(),
    [fields?.email || "email"]: text(fields?.email || "email").notNull().unique(),
    [fields?.emailVerified || "emailVerified"]: integer(fields?.emailVerified || "emailVerified", { mode: "boolean" }).notNull(),
    [fields?.image || "image"]: text(fields?.image || "image"),
    [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
    [fields?.updatedAt || "updatedAt"]: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }).notNull(),
    ...createAdditionalColumns(additionalFields)
});

// Helper to create sessions table with custom name and users reference
export const createSessionsTable = (tableName = "sessions", usersTableOrFn: any = users, fields?: Record<string, string>, additionalFields?: Record<string, any>) => {
    // resolve users table if lazy
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        id: text(fields?.id || "id").primaryKey(),
        [fields?.expiresAt || "expiresAt"]: integer(fields?.expiresAt || "expiresAt", { mode: "timestamp" }).notNull(),
        [fields?.token || "token"]: text(fields?.token || "token").notNull().unique(),
        [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
        [fields?.updatedAt || "updatedAt"]: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }).notNull(),
        [fields?.ipAddress || "ipAddress"]: text(fields?.ipAddress || "ipAddress"),
        [fields?.userAgent || "userAgent"]: text(fields?.userAgent || "userAgent"),
        [fields?.userId || "userId"]: text(fields?.userId || "userId").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
        [fields?.activeOrganizationId || "activeOrganizationId"]: text(fields?.activeOrganizationId || "activeOrganizationId"),
        ...createAdditionalColumns(additionalFields)
    });
};

// Helper to create accounts table
export const createAccountsTable = (tableName = "accounts", usersTableOrFn: any = users, fields?: Record<string, string>, additionalFields?: Record<string, any>) => {
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        id: text(fields?.id || "id").primaryKey(),
        [fields?.accountId || "accountId"]: text(fields?.accountId || "accountId").notNull(),
        [fields?.providerId || "providerId"]: text(fields?.providerId || "providerId").notNull(),
        [fields?.userId || "userId"]: text(fields?.userId || "userId").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
        [fields?.accessToken || "accessToken"]: text(fields?.accessToken || "accessToken"),
        [fields?.refreshToken || "refreshToken"]: text(fields?.refreshToken || "refreshToken"),
        [fields?.idToken || "idToken"]: text(fields?.idToken || "idToken"),
        [fields?.accessTokenExpiresAt || "accessTokenExpiresAt"]: integer(fields?.accessTokenExpiresAt || "accessTokenExpiresAt", { mode: "timestamp" }),
        [fields?.refreshTokenExpiresAt || "refreshTokenExpiresAt"]: integer(fields?.refreshTokenExpiresAt || "refreshTokenExpiresAt", { mode: "timestamp" }),
        [fields?.scope || "scope"]: text(fields?.scope || "scope"),
        [fields?.password || "password"]: text(fields?.password || "password"),
        [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
        [fields?.updatedAt || "updatedAt"]: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }).notNull(),
        ...createAdditionalColumns(additionalFields)
    });
};

// Helper to create verifications table
export const createVerificationsTable = (tableName = "verifications", fields?: Record<string, string>, additionalFields?: Record<string, any>) => sqliteTable(tableName, {
    id: text(fields?.id || "id").primaryKey(),
    [fields?.identifier || "identifier"]: text(fields?.identifier || "identifier").notNull(),
    [fields?.value || "value"]: text(fields?.value || "value").notNull(),
    [fields?.expiresAt || "expiresAt"]: integer(fields?.expiresAt || "expiresAt", { mode: "timestamp" }).notNull(),
    [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }),
    [fields?.updatedAt || "updatedAt"]: integer(fields?.updatedAt || "updatedAt", { mode: "timestamp" }),
    ...createAdditionalColumns(additionalFields)
});

// Helper to create organizations table
export const createOrganizationsTable = (tableName = "organizations", fields?: Record<string, string>, additionalFields?: Record<string, any>) => sqliteTable(tableName, {
    id: text(fields?.id || "id").primaryKey(),
    [fields?.name || "name"]: text(fields?.name || "name").notNull(),
    [fields?.slug || "slug"]: text(fields?.slug || "slug").unique(),
    [fields?.logo || "logo"]: text(fields?.logo || "logo"),
    [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
    [fields?.metadata || "metadata"]: text(fields?.metadata || "metadata"),
    ...createAdditionalColumns(additionalFields)
});

// Helper to create members table
export const createMembersTable = (tableName = "members", organizationsTableOrFn: any = organizations, usersTableOrFn: any = users, fields?: Record<string, string>, additionalFields?: Record<string, any>) => {
    const organizationsTable = typeof organizationsTableOrFn === 'function' ? organizationsTableOrFn() : organizationsTableOrFn;
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        id: text(fields?.id || "id").primaryKey(),
        [fields?.organizationId || "organizationId"]: text(fields?.organizationId || "organizationId").notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
        [fields?.userId || "userId"]: text(fields?.userId || "userId").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
        [fields?.role || "role"]: text(fields?.role || "role").notNull(),
        [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
        ...createAdditionalColumns(additionalFields)
    });
};

// Helper to create invitations table
export const createInvitationsTable = (tableName = "invitations", organizationsTableOrFn: any = organizations, usersTableOrFn: any = users, fields?: Record<string, string>, additionalFields?: Record<string, any>) => {
    const organizationsTable = typeof organizationsTableOrFn === 'function' ? organizationsTableOrFn() : organizationsTableOrFn;
    const usersTable = typeof usersTableOrFn === 'function' ? usersTableOrFn() : usersTableOrFn;

    return sqliteTable(tableName, {
        id: text(fields?.id || "id").primaryKey(),
        [fields?.organizationId || "organizationId"]: text(fields?.organizationId || "organizationId").notNull().references(() => organizationsTable.id, { onDelete: 'cascade' }),
        [fields?.email || "email"]: text(fields?.email || "email").notNull(),
        [fields?.role || "role"]: text(fields?.role || "role"),
        [fields?.status || "status"]: text(fields?.status || "status").notNull(),
        [fields?.expiresAt || "expiresAt"]: integer(fields?.expiresAt || "expiresAt", { mode: "timestamp" }).notNull(),
        [fields?.inviterId || "inviterId"]: text(fields?.inviterId || "inviterId").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
        [fields?.createdAt || "createdAt"]: integer(fields?.createdAt || "createdAt", { mode: "timestamp" }).notNull(),
        ...createAdditionalColumns(additionalFields)
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
