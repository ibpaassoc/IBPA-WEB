"use client";

export default function ApiHome() {
  return (
    <div className="min-h-screen bg-black text-lime-400 font-mono flex items-center justify-center p-8">
      <div className="max-w-md w-full border border-lime-900 bg-black/50 p-6 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.1)]">
        <h1 className="text-xl mb-4 border-b border-lime-900 pb-2 flex items-center gap-2">
          <span className="animate-pulse">●</span> Beauty Project API
        </h1>
        <div className="space-y-4 text-sm text-lime-500/80">
          <p>Status: <span className="text-lime-400">ONLINE</span></p>
          <p>Port: <span className="text-lime-400">3003</span></p>
          <div className="pt-4 border-t border-lime-900">
            <p className="mb-2 uppercase text-xs font-bold text-lime-600">Active Endpoints:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>GET /api/cards</li>
              <li>POST /api/cards</li>
              <li>PATCH /api/cards/[id]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
