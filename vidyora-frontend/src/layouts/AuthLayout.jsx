import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* Decorative Splash Side */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 overflow-hidden flex-col justify-between p-12 border-r border-slate-800/80">
        
        {/* Abstract Background Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none"></div>

        {/* Logo and Tagline */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-extrabold text-xl text-black">V</span>
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide text-white">Vidyora</span>
            <span className="text-cyan-400 font-medium ml-1">OS</span>
          </div>
        </div>

        {/* Key Selling Message / Interactive Quote */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            ⚡ Version 2.0 Available
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Transforming School Operations with <span className="text-gradient">Next-Gen SaaS</span>.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Manage attendance, grade assessments, track fee structures, and power online learning modules inside a single, unified enterprise dashboard.
          </p>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Vidyora Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Auth Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:w-1/2 lg:w-2/5 relative">
        {/* Small screen top header */}
        <div className="md:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center">
            <span className="font-bold text-md text-black">V</span>
          </div>
          <span className="font-bold text-md text-white">Vidyora OS</span>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
