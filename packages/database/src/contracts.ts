// The API contracts moved to the platform-neutral shared-types package so the
// future mobile app can import them without pulling in Prisma. This shim keeps
// existing `./contracts` imports working inside the database package.
export * from '@signal-or-noise/shared-types';
