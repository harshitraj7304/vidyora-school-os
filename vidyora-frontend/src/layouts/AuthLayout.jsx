import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-0)] flex flex-col md:flex-row font-sans text-slate-100 antialiased selection:bg-cyan-500 selection:text-black relative">
      {/* Universal Page Grid Background */}
      <div className="absolute inset-0 bg-dot-grid opacity-60 pointer-events-none" />
      
      {/* Universal ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* ── Left Splash Panel ──────────────────────────────────── */}
      <div className="relative hidden md:flex md:w-[50%] lg:w-[56%] overflow-y-auto flex-col justify-between p-12 lg:p-16 border-r border-slate-800/40 bg-slate-900/10">
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-extrabold text-lg text-black select-none">V</span>
          </div>
          <div>
            <span className="font-bold text-base tracking-wide text-white">Vidyora</span>
            <span className="text-cyan-400 font-semibold ml-1 text-xs">OS</span>
          </div>
        </div>

        {/* Hero & Product Preview Area */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
              Next-Gen School ERP
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-none text-white">
              The OS that powers <span className="text-gradient">modern schools</span>.
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              Attendance tracking, fee collections, online exams, and a unified LMS — engineered from the ground up for modern educational institutions.
            </p>
          </div>

          {/* Interactive CSS Dashboard Preview widget */}
          <div className="relative group w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/25 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)]">
            {/* Browser chrome header */}
            <div className="h-9 px-4 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40 group-hover:bg-red-500 transition-colors" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40 group-hover:bg-yellow-500 transition-colors" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/40 group-hover:bg-green-500 transition-colors" />
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase select-none">
                vidyora-os.app / dashboard
              </div>
              <div className="w-10" />
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="p-4 grid grid-cols-3 gap-3 bg-slate-950/20">
              
              {/* Stat card 1: Active Users */}
              <div className="p-3 rounded-xl border border-slate-800/50 bg-slate-900/35 backdrop-blur-sm space-y-1">
                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider block">Live Users</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-extrabold text-white">1,420</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block mb-0.5 shrink-0" />
                </div>
              </div>

              {/* Stat card 2: Attendance */}
              <div className="p-3 rounded-xl border border-slate-800/50 bg-slate-900/35 backdrop-blur-sm space-y-1">
                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider block">Attendance</span>
                <span className="text-base font-extrabold text-cyan-400">96.8%</span>
              </div>

              {/* Stat card 3: Collection */}
              <div className="p-3 rounded-xl border border-slate-800/50 bg-slate-900/35 backdrop-blur-sm space-y-1">
                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider block">Syllabus Progress</span>
                <span className="text-base font-extrabold text-indigo-400">82.4%</span>
              </div>

              {/* Chart widget */}
              <div className="col-span-3 p-3.5 rounded-xl border border-slate-800/50 bg-slate-900/35 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Campus Engagement</span>
                  <span className="text-[9px] text-slate-400">This Week</span>
                </div>
                <div className="h-16 flex items-end gap-2 pt-2">
                  <div className="flex-1 bg-cyan-500/10 border border-cyan-500/25 rounded-md h-[40%] group-hover:h-[55%] transition-all duration-500" />
                  <div className="flex-1 bg-indigo-500/10 border border-indigo-500/25 rounded-md h-[70%] group-hover:h-[80%] transition-all duration-500" />
                  <div className="flex-1 bg-cyan-500/10 border border-cyan-500/25 rounded-md h-[55%] group-hover:h-[65%] transition-all duration-500" />
                  <div className="flex-1 bg-indigo-500/20 border border-indigo-500/40 rounded-md h-[85%] group-hover:h-[95%] transition-all duration-500" />
                  <div className="flex-1 bg-cyan-500/20 border border-cyan-500/40 rounded-md h-[65%] group-hover:h-[75%] transition-all duration-500" />
                  <div className="flex-1 bg-indigo-500/25 border border-indigo-500/50 rounded-md h-[95%] group-hover:h-[90%] transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Trust Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/40">
            {[
              { label: "Active Campuses", value: "5+" },
              { label: "Platform Uptime", value: "99.9%" },
              { label: "Sync Latency", value: "<50ms" },
            ].map((metric) => (
              <div key={metric.label} className="space-y-0.5 select-none hover:-translate-y-0.5 transition-transform duration-200">
                <p className="text-2xl font-extrabold text-white tracking-tight">{metric.value}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-650">
          <span>© {new Date().getFullYear()} Vidyora Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-450 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-450 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* ── Right Auth Content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 relative min-h-screen md:min-h-0 bg-slate-950/10">
        {/* Mobile logo */}
        <div className="md:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-bold text-sm text-black select-none">V</span>
          </div>
          <span className="font-bold text-sm text-white tracking-wide">Vidyora OS</span>
        </div>
 
        <div className="w-full max-w-md animate-fade-in p-7 sm:p-10 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative">
          {/* Subtle shifting border highlight */}
          <div className="absolute inset-px rounded-2xl bg-gradient-to-tr from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
