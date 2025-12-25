-- Drop tables to ensure fresh setup
DROP TABLE IF EXISTS "invitation";
DROP TABLE IF EXISTS "member";
DROP TABLE IF EXISTS "account";
DROP TABLE IF EXISTS "session";
DROP TABLE IF EXISTS "verification";
DROP TABLE IF EXISTS "organization";
DROP TABLE IF EXISTS "user";

-- User table
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);

-- Session table
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" integer NOT NULL,
	"token" text NOT NULL UNIQUE,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- Account table
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" integer,
	"refreshTokenExpiresAt" integer,
	"scope" text,
	"password" text,
	"createdAt" integer NOT NULL,
	"updatedAt" integer NOT NULL
);

-- Verification table
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" integer NOT NULL,
	"createdAt" integer,
	"updatedAt" integer
);

-- Organization table
CREATE TABLE IF NOT EXISTS "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text UNIQUE,
	"logo" text,
	"createdAt" integer NOT NULL,
	"metadata" text
);

-- Member table
CREATE TABLE IF NOT EXISTS "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
	"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"role" text NOT NULL,
	"createdAt" integer NOT NULL
);

-- Invitation table
CREATE TABLE IF NOT EXISTS "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" integer NOT NULL,
	"inviterId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
