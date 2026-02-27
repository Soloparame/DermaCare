import Link from "next/link";
import { ArrowRight, Activity, Calendar, FileText } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020817] text-slate-50 selection:bg-teal-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#020817]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">DermaCare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Sign In
            </Link>
            <Link href="/auth/register" className="group flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[150px]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-300 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
              Next-Generation Dermatological Care
            </div>

            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl mb-8">
              Transform Your <br />
              <span className="inline-block bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent pb-2">
                Skin Health
              </span>
            </h1>

            <p className="max-w-2xl text-lg text-slate-400 mb-10 leading-relaxed">
              Experience the future of dermatology with our advanced telemedicine platform.
              Connect with top specialists, track your progress, and get personalized care from anywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register" className="group flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-8 text-base font-semibold text-white shadow-xl shadow-teal-500/20 transition-all hover:scale-105 hover:shadow-teal-500/40">
                Book Consultation
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/auth/login" className="flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white/10">
                Patient Portal
              </Link>
            </div>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-teal-500/30 to-transparent blur-xl opacity-50" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0B1121] shadow-2xl overflow-hidden aspect-[16/9]">
              {/* Fake Window Header */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
              </div>
              <div className="flex h-full">
                {/* Fake Sidebar */}
                <div className="w-48 border-r border-white/5 bg-white/5 p-4 flex flex-col gap-3">
                  <div className="h-8 rounded-lg bg-white/10 w-full mb-4" />
                  <div className="h-6 rounded-md bg-white/10 w-3/4" />
                  <div className="h-6 rounded-md bg-teal-500/20 w-5/6" />
                  <div className="h-6 rounded-md bg-white/5 w-2/3" />
                </div>
                {/* Fake Main Content */}
                <div className="flex-1 p-6 flex flex-col gap-4">
                  <div className="h-8 rounded-lg bg-white/10 w-1/3 mb-2" />
                  <div className="flex gap-4 mb-4">
                    <div className="h-24 flex-1 rounded-xl bg-gradient-to-br from-teal-500/20 to-transparent border border-white/5" />
                    <div className="h-24 flex-1 rounded-xl bg-white/5 border border-white/5" />
                    <div className="h-24 flex-1 rounded-xl bg-white/5 border border-white/5" />
                  </div>
                  <div className="flex-1 rounded-xl bg-white/5 border border-white/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-[#020817] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Seamless Care Journey
            </h2>
            <p className="mt-4 text-slate-400">Everything you need for your dermatological health in one place.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Calendar, title: "Smart Scheduling", desc: "Book virtual or in-person visits instantly without phone calls." },
              { icon: Activity, title: "Virtual Consultations", desc: "High-quality video calls directly from your dashboard." },
              { icon: FileText, title: "Secure Records", desc: "All your prescriptions and care history safely stored." }
            ].map((feature, i) => (
              <div key={i} className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:bg-white/10">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-teal-500/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400 ring-1 ring-white/10">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
