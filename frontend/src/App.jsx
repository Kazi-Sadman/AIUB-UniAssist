import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import AnimatedParticleBackground from "./components/AnimatedParticleBackground";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DepartmentsPage from "./pages/DepartmentsPage";
import StudentsPage from "./pages/StudentsPage";
import CoursesPage from "./pages/CoursesPage";
import EnrollmentsPage from "./pages/EnrollmentsPage";
import UniAssist from "./pages/UniAssist";
import GlobalSearchPage from "./pages/GlobalSearchPage";
import SystemHealthPage from "./pages/SystemHealthPage";
import SettingsPage from "./pages/SettingsPage";

const PARTICLES_STORAGE_KEY = "uniassist.particlesEnabled";

// Particles are on by default. Only an explicit "false" turns them off.
function readSavedParticlePreference() {
  try {
    return localStorage.getItem(PARTICLES_STORAGE_KEY) !== "false";
  } catch {
    return true; // storage can be blocked in private browsing
  }
}

export default function App() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // only matters on small screens
  const [particlesEnabled, setParticlesEnabled] = useState(readSavedParticlePreference);

  // Close the mobile menu whenever the person opens another page.
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleParticlesEnabledChange = (isEnabled) => {
    setParticlesEnabled(isEnabled);
    try {
      localStorage.setItem(PARTICLES_STORAGE_KEY, String(isEnabled));
    } catch {
      // Ignore: the setting still works for this session.
    }
  };

  return (
    <>
      <AnimatedParticleBackground enabled={particlesEnabled} />

      {/* z-10 keeps all real content above the particle canvas */}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar with a menu button, shown on phones and tablets only */}
          <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 h-14 px-4 border-b border-line bg-ink-soft/90 backdrop-blur">
            <button
              className="icon-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <p className="font-display font-semibold text-parchment">AIUB UniAssist</p>
          </header>

          <main className="flex-1 w-full max-w-[1400px] px-4 sm:px-8 py-6 sm:py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/enrollments" element={<EnrollmentsPage />} />
              <Route path="/uni-assist" element={<UniAssist />} />
              <Route path="/search" element={<GlobalSearchPage />} />
              <Route path="/system-health" element={<SystemHealthPage />} />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    particlesEnabled={particlesEnabled}
                    onParticlesEnabledChange={handleParticlesEnabledChange}
                  />
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}
