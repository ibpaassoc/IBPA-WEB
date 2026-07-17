import { ClerkProvider } from "@clerk/nextjs";

/**
 * Shared Clerk provider used by the route groups that need clerk-js on the
 * client (dashboard, sign-in, checkout success, admin). Keeping it out of the
 * root layout keeps clerk-js off the public landing pages. The admin area
 * must load it: clerk-js is what keeps the short-lived session cookie fresh,
 * and admin API mutations start failing with 401 without it.
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
