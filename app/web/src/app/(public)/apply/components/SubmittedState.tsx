"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type SubmittedStateProps = {
  isRu: boolean;
  isUk: boolean;
  headlineClassName: string;
  editorialClassName: string;
  selectedConfigShortTitle: string;
  selectedConfigTitle: string;
  localizedApplicantType: string;
  selectedPrice: string;
};

export function SubmittedState({
  isRu: _isRu,
  isUk: _isUk,
  headlineClassName,
  editorialClassName,
  selectedConfigShortTitle,
  selectedConfigTitle,
  localizedApplicantType,
  selectedPrice,
}: SubmittedStateProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[40px] border border-slate-200 bg-[#F8FBFD] p-8 md:p-12 shadow-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D8F3DC] text-[#2D6A4F]">
          <CheckCircle2 size={28} />
        </div>
        <p className="text-center text-[10px] uppercase tracking-[0.35em] text-[#708090]">
          Application submitted
        </p>
        <h1 className={`mt-4 text-center text-4xl md:text-6xl uppercase leading-none text-slate-900 ${headlineClassName}`}>
          Thank You
        </h1>
        <p className={`mt-4 text-center text-slate-600 ${editorialClassName}`}>
          We have received your application. The IBPA team will contact you after review.
        </p>

        <div className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              Category
            </p>
            <p className="mt-1 font-semibold text-slate-900">{selectedConfigTitle}</p>
            <p className="text-xs text-slate-500">{selectedConfigShortTitle}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              Applicant type
            </p>
            <p className="mt-1 font-semibold text-slate-900">{localizedApplicantType}</p>
            <p className="text-xs text-slate-500">{selectedPrice}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"
          >
            Back to Home
          </Link>
          <Link
            href="/membership"
            className="rounded-full border border-slate-300 px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-800"
          >
            View Membership
          </Link>
        </div>
      </div>
    </div>
  );
}
