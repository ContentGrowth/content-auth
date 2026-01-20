// Astro components - these are .astro files and should be imported directly
// This file exports the client for use in Astro projects

export * from './clients/astro-client';

// Note: Astro components cannot be re-exported from TypeScript files.
// Import components directly in your Astro pages:
//
// import AuthForm from '@contentgrowth/content-auth/frontend/components/astro/AuthForm.astro';
// import ForgotPasswordForm from '@contentgrowth/content-auth/frontend/components/astro/ForgotPasswordForm.astro';
// import ResetPasswordForm from '@contentgrowth/content-auth/frontend/components/astro/ResetPasswordForm.astro';
// import PasswordChanger from '@contentgrowth/content-auth/frontend/components/astro/PasswordChanger.astro';
// import ProfileEditor from '@contentgrowth/content-auth/frontend/components/astro/ProfileEditor.astro';
// import Organization from '@contentgrowth/content-auth/frontend/components/astro/Organization.astro';
