"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp, useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { getDashboardUrl } from "@/lib/public-urls";
import { useI18n } from "@/lib/i18n";

function SuccessContent() {
  const { isLoaded, isSignedIn } = useUser();
  const { locale } = useI18n();
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const editorialClassName = useEnglishTypography
    ? "font-sans italic"
    : `${cyrillicEditorial.className} italic`;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const stripeSessionId = searchParams.get("session_id");
  const dashboardUrl = getDashboardUrl("/dashboard") || "/dashboard";
  const dashboardSignInUrl = getDashboardUrl("/sign-in") || "/sign-in";
  const [status, setStatus] = useState<"loading" | "paid" | "error">(token ? "loading" : "error");
  const [errorReason, setErrorReason] = useState<"missing_token" | "not_found" | "backend_unavailable" | "verify_failed" | null>(
    token ? null : "missing_token",
  );
  const [orderData, setOrderData] = useState<{ email: string; name: string } | null>(null);
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const copy = {
    invalidTitle: isRu ? "Проверка ссылки не удалась" : isUk ? "Перевірка посилання не вдалася" : "Payment link check failed",
    invalidBody:
      errorReason === "missing_token"
        ? isRu
          ? "В ссылке не хватает токена. Откройте письмо с самой последней платежной ссылкой."
          : isUk
            ? "У посиланні бракує токена. Відкрийте лист із найновішим посиланням на оплату."
            : "The link is missing its token. Please open the latest payment email."
        : errorReason === "not_found"
          ? isRu
            ? "Мы не нашли этот токен в базе. Скорее всего, это старая ссылка или ссылка была открыта не полностью."
            : isUk
              ? "Ми не знайшли цей токен у базі. Ймовірно, це старе посилання або посилання відкрили не повністю."
              : "We couldn't find this token in the database. It is likely an older link or the URL was copied incompletely."
          : errorReason === "backend_unavailable"
            ? isRu
              ? "Сервис проверки временно недоступен. Пожалуйста, попробуйте снова через минуту."
              : isUk
                ? "Сервіс перевірки тимчасово недоступний. Будь ласка, спробуйте ще раз через хвилину."
                : "The verification service is temporarily unavailable. Please try again in a minute."
            : isRu
              ? "Мы не смогли подтвердить оплату. Пожалуйста, свяжитесь с поддержкой или попробуйте снова."
              : isUk
                ? "Ми не змогли підтвердити оплату. Будь ласка, зв’яжіться з підтримкою або спробуйте ще раз."
                : "We couldn't verify your payment. Please contact support or try again.",
    backHome: isRu ? "Вернуться на главную" : isUk ? "Повернутися на головну" : "Back to Home",
    paidTitlePrefix: isRu ? "Оплата" : isUk ? "Оплату" : "Payment",
    paidTitleAccent: isRu ? "успешно" : isUk ? "успішно завершено" : "Successful!",
    paidBody: isRu
      ? `Спасибо, ${orderData?.name}. Ваша заявка оплачена, и сертификат уже подготавливается. Теперь завершите регистрацию, чтобы получить доступ к личному кабинету.`
      : isUk
        ? `Дякуємо, ${orderData?.name}. Вашу заявку оплачено, і сертифікат уже готується. Тепер завершіть реєстрацію, щоб отримати доступ до особистого кабінету.`
        : `Thank you, ${orderData?.name}. Your application has been paid and your certificate is being prepared. Now, please complete your registration to access your personal dashboard.`,
    completeRegistration: isRu ? "Завершите регистрацию" : isUk ? "Завершіть реєстрацію" : "Complete Registration",
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const verifyToken = async () => {
      try {
        const query = stripeSessionId ? `?session_id=${encodeURIComponent(stripeSessionId)}` : "";

        for (let attempt = 0; attempt < 10; attempt += 1) {
          const resp = await fetch(`/api/orders/verify/${encodeURIComponent(token)}${query}`, {
            cache: "no-store",
          });

          if (cancelled) {
            return;
          }

          if (resp.ok) {
            const data = await resp.json();
            if (data.status === "paid") {
              setStatus("paid");
              setOrderData({ email: data.email, name: data.name });
              return;
            }

            if (data.status === "approved" && attempt < 9) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }

            setErrorReason("verify_failed");
            setStatus("error");
            return;
          }

          setErrorReason(resp.status === 404 ? "not_found" : "verify_failed");
          setStatus("error");
          return;
        }
      } catch (err) {
        console.error(err);
        setErrorReason("backend_unavailable");
        setStatus("error");
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token, stripeSessionId]);

  if (status === "loading" || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F8FF]">
        <Loader2 className="w-10 h-10 text-[#B9D9EB] animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    const fallbackTitle = isRu
      ? "Оплата принята"
      : isUk
        ? "Оплату прийнято"
        : "Payment received";
    const fallbackBody =
      errorReason === "missing_token"
        ? isRu
          ? "Похоже, ссылка открыта без токена. Если оплата уже прошла, просто войдите в личный кабинет с тем же email, который использовали в заявке."
          : isUk
            ? "Схоже, посилання відкрито без токена. Якщо оплату вже завершено, просто увійдіть до особистого кабінету з тим самим email, який використовували в заявці."
            : "This link is missing its token. If your payment is already complete, simply sign in to your dashboard with the same email used for your application."
        : errorReason === "not_found"
          ? isRu
            ? "Похоже, ссылка устарела или открыта не полностью. Если оплата уже прошла, просто войдите в личный кабинет с тем же email, который использовали в заявке."
            : isUk
              ? "Схоже, посилання застаріло або відкрито не повністю. Якщо оплату вже завершено, просто увійдіть до особистого кабінету з тим самим email, який використовували в заявці."
              : "This link looks outdated or incomplete. If your payment is already complete, simply sign in to your dashboard with the same email used for your application."
          : errorReason === "backend_unavailable"
            ? isRu
              ? "Сервис проверки временно недоступен. Если оплата уже прошла, войдите в личный кабинет с тем же email и продолжите оттуда."
              : isUk
                ? "Сервіс перевірки тимчасово недоступний. Якщо оплату вже завершено, увійдіть до особистого кабінету з тим самим email і продовжуйте звідти."
                : "The verification service is temporarily unavailable. If your payment is already complete, sign in to your dashboard with the same email and continue from there."
            : isRu
              ? "Если оплата уже прошла, войдите в личный кабинет с тем же email, который использовали в заявке."
              : isUk
                ? "Якщо оплату вже завершено, увійдіть до особистого кабінету з тим самим email, який використовували в заявці."
                : "If your payment is already complete, sign in to your dashboard with the same email used for your application.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F3F5] px-4">
        <div className="max-w-3xl w-full rounded-[40px] border border-slate-100 bg-white p-10 shadow-2xl md:p-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-green-100 text-green-600">
            <CheckCircle size={44} />
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.38em] text-[#708090]">
            {isRu ? "Доступ к кабинету" : isUk ? "Доступ до кабінету" : "Dashboard access"}
          </p>
          <h1 className={`mt-4 text-4xl uppercase text-slate-900 md:text-6xl ${headlineClassName}`}>{fallbackTitle}</h1>
          <p className={`mt-6 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg ${bodyClassName}`}>{fallbackBody}</p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#708090]">
                {isRu ? "Следующий шаг" : isUk ? "Наступний крок" : "Next step"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {isRu
                  ? "Войдите в личный кабинет с тем же email, который использовали в заявке и оплате."
                  : isUk
                    ? "Увійдіть до особистого кабінету з тим самим email, який використовували в заявці та оплаті."
                    : "Sign in to your dashboard with the same email address used for your application and payment."}
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#708090]">
                {isRu ? "Нужна помощь?" : isUk ? "Потрібна допомога?" : "Need help?"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {isRu
                  ? "Если кабинет не открывается после входа, свяжитесь с командой IBPA для ручной проверки оплаты."
                  : isUk
                    ? "Якщо кабінет не відкривається після входу, зв’яжіться з командою IBPA для ручної перевірки оплати."
                    : "If dashboard access still does not open after sign-in, contact the IBPA team for a manual payment check."}
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className={`inline-flex items-center justify-center rounded-full border border-slate-200 px-8 py-4 text-sm uppercase text-slate-700 transition-colors hover:border-slate-300 hover:text-black ${bodyClassName}`}>
              {copy.backHome}
            </Link>
            <Link href={dashboardSignInUrl} className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-black px-8 py-[0.92rem] text-[12px] uppercase text-white transition-colors hover:bg-[#B9D9EB] shadow-xl ${bodyClassName}`}>
              {isRu ? "Войти в кабинет" : isUk ? "Увійти до кабінету" : "Member Login"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F8FF] px-4 py-10 md:px-6 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 md:items-center lg:grid-cols-[minmax(0,1.1fr)_440px]">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8 rounded-[40px] border border-white/70 bg-[linear-gradient(140deg,#ffffff_0%,#eef5fb_100%)] p-8 shadow-xl md:p-12"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 text-green-600">
            <CheckCircle size={48} />
          </div>
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#708090]">
              {isRu ? "Доступ к кабинету" : isUk ? "Доступ до кабінету" : "Dashboard access"}
            </p>
            <h1 className={`text-5xl uppercase leading-none md:text-7xl ${headlineClassName}`}>
            {copy.paidTitlePrefix} <span className="text-[#B9D9EB]">{copy.paidTitleAccent}</span>
            </h1>
          </div>
          <p className={`text-lg leading-relaxed text-slate-500 md:text-xl ${editorialClassName}`}>
            {copy.paidBody}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/75 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#708090]">
                {isRu ? "Следующий шаг" : isUk ? "Наступний крок" : "Next step"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {isRu
                  ? "Завершите регистрацию или войдите с уже существующим доступом, чтобы открыть личный кабинет."
                  : isUk
                    ? "Завершіть реєстрацію або увійдіть з уже наявним доступом, щоб відкрити особистий кабінет."
                    : "Complete registration or sign in with your existing access to open your personal dashboard."}
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/75 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#708090]">
                {isRu ? "Email для доступа" : isUk ? "Email для доступу" : "Access email"}
              </p>
              <p className="mt-3 break-all text-sm leading-relaxed text-slate-600">
                {orderData?.email}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-4 text-sm uppercase text-[#708090] ${bodyClassName}`}>
            <span className="w-12 h-[2px] bg-[#B9D9EB]" />
            {copy.completeRegistration}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={dashboardUrl}
              className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-black px-8 py-4 text-[12px] uppercase text-white transition-colors hover:bg-[#B9D9EB] shadow-xl ${bodyClassName}`}
            >
              {isRu ? "Открыть кабинет" : isUk ? "Відкрити кабінет" : "Go to Dashboard"} <ArrowRight size={16} />
            </Link>
            <Link
              href={dashboardSignInUrl}
              className={`inline-flex items-center justify-center rounded-full border border-slate-200 px-8 py-4 text-[12px] uppercase text-slate-700 transition-colors hover:border-slate-300 hover:text-black ${bodyClassName}`}
            >
              {isRu ? "Войти" : isUk ? "Увійти" : "Sign In"}
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md justify-self-center pt-10 md:pt-14 lg:max-w-none lg:pt-32"
        >
          <div className="overflow-hidden rounded-[40px] border border-[#B9D9EB]/20 bg-white p-2 shadow-2xl">
            {isSignedIn ? (
              <div className="p-8 text-center md:p-10">
                <p className="text-[10px] uppercase tracking-[0.26em] text-[#708090]">
                  {isRu ? "Аккаунт готов" : isUk ? "Акаунт готовий" : "Account ready"}
                </p>
                <h2 className={`mt-4 text-3xl uppercase leading-none text-slate-900 ${headlineClassName}`}>
                  {isRu ? "Кабинет доступен" : isUk ? "Кабінет доступний" : "Dashboard access active"}
                </h2>
                <p className={`mt-4 text-sm leading-relaxed text-slate-600 ${bodyClassName}`}>
                  {isRu
                    ? "Вы уже вошли в аккаунт. Нажмите кнопку ниже, чтобы открыть личный кабинет."
                    : isUk
                      ? "Ви вже увійшли в акаунт. Натисніть кнопку нижче, щоб відкрити особистий кабінет."
                      : "You are already signed in. Use the button below to open your personal dashboard."}
                </p>
                <Link
                  href={dashboardUrl}
                  className={`mt-8 inline-flex items-center justify-center gap-2.5 rounded-full bg-black px-8 py-4 text-[12px] uppercase text-white transition-colors hover:bg-[#B9D9EB] shadow-xl ${bodyClassName}`}
                >
                  {isRu ? "Открыть кабинет" : isUk ? "Відкрити кабінет" : "Open Dashboard"} <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <SignUp
                routing="hash"
                initialValues={{ emailAddress: orderData?.email }}
                forceRedirectUrl={dashboardUrl}
                fallbackRedirectUrl={dashboardUrl}
                signInFallbackRedirectUrl={dashboardUrl}
                signInUrl={dashboardSignInUrl}
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F8FF]">
      <Loader2 className="w-10 h-10 text-[#B9D9EB] animate-spin" />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
