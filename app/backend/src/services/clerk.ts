import { createClerkClient, clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

export const clerkClient = createClerkClient({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const clerkOptions = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
};

// Re-export clerk methods so routes can import from this centralized service
export { clerkMiddleware, requireAuth, getAuth };
