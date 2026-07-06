export default function MembersLoading() {
  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl space-y-4">
          <div className="h-3 w-40 animate-pulse rounded-full bg-[#D4E0F0]" />
          <div className="h-14 w-3/4 animate-pulse rounded-2xl bg-[#D4E0F0]" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-[#E4ECF7]" />
        </div>

        <div className="mt-12 h-16 animate-pulse rounded-[28px] border border-[#D4E0F0] bg-white/70" />

        <div className="mt-9 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-[28px] border border-[#D4E0F0] bg-white/70 px-5 py-7"
            >
              <div className="size-20 animate-pulse rounded-full bg-[#D4E0F0]" />
              <div className="mt-4 h-4 w-24 animate-pulse rounded-full bg-[#D4E0F0]" />
              <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-[#E4ECF7]" />
              <div className="mt-4 h-5 w-20 animate-pulse rounded-full bg-[#E4ECF7]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
