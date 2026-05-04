import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { LockKeyhole, ChevronRight } from "lucide-react";
import { getDashboardUrl, getLandingOrigin } from "@/lib/public-urls";

export default function SignInPage() {
  const landingUrl = getLandingOrigin();
  const dashboardUrl = getDashboardUrl("/dashboard") || "/dashboard";

  return (
    <div className="min-h-screen bg-[#F1F3F5] px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col-reverse gap-8 lg:grid lg:grid-cols-[minmax(0,1.05fr)_440px]">
        <section className="rounded-[40px] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#eef4f8_100%)] p-8 shadow-xl md:p-12">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-black text-white shadow-lg">
            <LockKeyhole size={28} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#708090]">
            Member Access
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl uppercase leading-none text-slate-900 md:text-6xl">
            Sign in to your IBPA dashboard
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            This access is intended for approved applicants and active members. If your application
            was approved and your payment is complete, sign in here to open your dashboard,
            certificates, notifications, and membership details.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                Already approved
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Use the same email that received your approval and payment instructions.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                Not approved yet
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Submit your application first. Dashboard access is unlocked only after approval.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${landingUrl}/apply`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-transform hover:scale-[1.02]"
            >
              Apply now <ChevronRight size={16} />
            </Link>
            <Link
              href={landingUrl}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-slate-300 hover:text-black"
            >
              Back to landing
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-[#B9D9EB]/20 bg-white p-0 shadow-2xl sm:rounded-[40px] sm:p-2">
          <SignIn
            routing="hash"
            fallbackRedirectUrl={dashboardUrl}
            forceRedirectUrl={dashboardUrl}
            signUpFallbackRedirectUrl={dashboardUrl}
            signUpUrl={`${landingUrl}/membership`}
            appearance={{
              options: {
                unsafe_disableDevelopmentModeWarnings: true,
              },
            }}
          />
        </section>
      </div>
    </div>
  );
}
