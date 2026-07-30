import { SignUp } from "@clerk/nextjs";
import { BadgeCheck, Users } from "lucide-react";

type TeamInvitePageProps = {
  searchParams: Promise<{ email?: string | string[] }>;
};

export default async function TeamInvitePage({
  searchParams,
}: TeamInvitePageProps) {
  const params = await searchParams;
  const emailValue = Array.isArray(params.email) ? params.email[0] : params.email;
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  return (
    <main className="min-h-screen bg-[#F1F3F5] px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="rounded-[40px] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#eef4f8_100%)] p-8 shadow-xl md:p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#10203B] text-white shadow-lg">
            <Users size={28} />
          </div>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#708090]">
            Team member access
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold uppercase leading-none text-slate-900 md:text-6xl">
            Set up your IBPA account
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            Create an account with the email address that received the
            invitation. IBPA will connect it to your team seat and activate your
            individual certificate number when you enter the dashboard.
          </p>

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white/80 p-5">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#4C7D9D]" />
              <div>
                <p className="text-sm font-semibold text-[#10203B]">
                  Use the invited email
                </p>
                <p className="mt-1 break-all text-sm text-slate-600">
                  {email ||
                    "Open the original invitation email again so your invited address is filled automatically."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-[#B9D9EB]/20 bg-white p-0 shadow-2xl sm:rounded-[40px] sm:p-2">
          <SignUp
            routing="hash"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            signInUrl="/sign-in"
            initialValues={email ? { emailAddress: email } : undefined}
            appearance={{
              options: {
                unsafe_disableDevelopmentModeWarnings: true,
              },
            }}
          />
        </section>
      </div>
    </main>
  );
}
