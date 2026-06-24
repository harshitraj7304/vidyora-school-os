import { useState } from "react";

import DashboardPage from "./pages/DashboardPage";
import SchoolsPage from "./pages/SchoolsPage";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5">
        <h2 className="text-2xl font-bold text-cyan-400 mb-8">
          Vidyora OS
        </h2>

        <nav className="space-y-4">

          <div
            onClick={() => setCurrentPage("dashboard")}
            className={`cursor-pointer p-2 rounded ${
              currentPage === "dashboard"
                ? "bg-cyan-500 text-black font-bold"
                : "hover:text-cyan-400"
            }`}
          >
            📊 Dashboard
          </div>

          <div
            onClick={() => setCurrentPage("schools")}
            className={`cursor-pointer p-2 rounded ${
              currentPage === "schools"
                ? "bg-cyan-500 text-black font-bold"
                : "hover:text-cyan-400"
            }`}
          >
            🏫 Schools
          </div>

          <div className="cursor-pointer hover:text-cyan-400">
            👨‍💼 Users
          </div>

          <div className="cursor-pointer hover:text-cyan-400">
            🎓 Students
          </div>

          <div className="cursor-pointer hover:text-cyan-400">
            👨‍🏫 Teachers
          </div>

          <div className="cursor-pointer hover:text-cyan-400">
            📚 Classes
          </div>

          <div className="cursor-pointer hover:text-cyan-400">
            📅 Attendance
          </div>

          <div className="cursor-pointer hover:text-cyan-400">
            💰 Fees
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {currentPage === "dashboard" && <DashboardPage />}
        {currentPage === "schools" && <SchoolsPage />}
      </main>
    </div>
  );
}

export default App;