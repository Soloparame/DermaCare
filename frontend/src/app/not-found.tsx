import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#020817] text-slate-50 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-slate-300 mb-2">404</h1>
        <p className="text-slate-400 mb-6">This page could not be found.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition"
        >
          Back to DermaCare
        </Link>
      </div>
    </main>
  );
}
