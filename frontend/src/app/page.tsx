import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-900/90 to-slate-900 px-4 pt-16 pb-24 sm:px-8 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-4 py-1.5 text-sm font-medium text-teal-300 ring-1 ring-teal-400/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                </span>
                Online Dermatology · Ethiopia-ready
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Skin care,
                <span className="block bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  simplified
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-300">
                One platform for patients, dermatologists, and staff. Book visits, run virtual
                consultations, and keep all dermatology records secure in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:bg-teal-400 hover:shadow-teal-500/40"
                >
                  Create account
                  <span className="text-lg">→</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center rounded-xl border-2 border-slate-500 bg-slate-800/50 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:border-teal-500/50 hover:bg-slate-700/50"
                >
                  Sign in
                </Link>
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <div className="rounded-2xl border border-slate-600/50 bg-slate-800/40 p-6 backdrop-blur sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                  Today at a glance
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-teal-500/20 p-4 ring-1 ring-teal-400/20">
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-sm text-teal-200">Available slots today</p>
                  </div>
                  <div className="rounded-xl bg-slate-700/50 p-4 ring-1 ring-slate-600/50">
                    <p className="text-2xl font-bold text-white">5</p>
                    <p className="text-sm text-slate-300">New appointments</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-slate-700/30 p-4">
                  <p className="text-xs text-slate-400">Virtual consultations via Google Meet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-100 px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-bold text-white">
                1
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Register & book</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Create an account, choose a dermatologist, and pick an available slot.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-bold text-white">
                2
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Consult in-person or online</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Join via Google Meet or visit the clinic. Doctors have full access to your records.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-bold text-white">
                3
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Follow-ups & records</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Prescriptions and notes are saved. Get reminders for follow-up visits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-slate-200 bg-white px-4 py-12 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <h3 className="font-semibold text-slate-900">Ready to get started?</h3>
            <p className="text-sm text-slate-600">Create your account in under a minute.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/auth/register"
              className="rounded-xl bg-teal-600 px-6 py-2.5 font-semibold text-white transition hover:bg-teal-700"
            >
              Create account
            </Link>
            <Link
              href="/auth/login"
              className="rounded-xl border border-slate-200 px-6 py-2.5 font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
