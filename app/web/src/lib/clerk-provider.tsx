import { ClerkProvider } from "@clerk/nextjs";

/**
 * Shared Clerk provider used only by the route groups that render Clerk UI on
 * the client (dashboard, sign-in, checkout success). Keeping it out of the
 * root layout keeps clerk-js off the public landing pages and the admin area.
 */
export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signInForceRedirectUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
