import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBackendUrl } from "@/lib/backend-url";

type PaymentLinkPageProps =
  | { params: Promise<{ token: string }> }
  | { params: { token: string } };

function isAllowedStripeCheckoutUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const allowedHosts = new Set(["checkout.stripe.com", "pay.stripe.com"]);
    return parsed.protocol === "https:" && allowedHosts.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export default async function PaymentLinkPage({ params }: PaymentLinkPageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const token = resolvedParams.token;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F0F8FF] px-4">
        <div className="max-w-md rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Payment link</p>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Link is missing</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            The payment token is missing or invalid. Please use the latest email we sent you.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  let title = "Payment link unavailable";
  let message = "We couldn't generate a fresh payment link.";

  try {
    const backendUrl = getServerBackendUrl();

    if (!backendUrl) {
      throw new Error("Backend URL is not configured");
    }

    const resp = await fetch(`${backendUrl}/api/orders/payment-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));

    if (resp.ok && isAllowedStripeCheckoutUrl(data?.checkoutUrl)) {
      redirect(data.checkoutUrl);
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      message = data.error;
    }
  } catch (error) {
    console.error("[Payment Link] Failed to regenerate checkout session", error);
    title = "Something went wrong";
    message = "Please try opening the latest email again, or contact the IBPA team for a fresh payment link.";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0F8FF] px-4">
      <div className="max-w-md rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Payment link</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
