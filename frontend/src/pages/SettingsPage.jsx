import React from "react";
import axiosClient from "../api/axiosClient";
import PageHeader from "../components/PageHeader";

// Read the operating-system "reduce motion" setting once, for display only.
const systemPrefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function SettingsPage({ particlesEnabled, onParticlesEnabledChange }) {
  return (
    <div>
      <PageHeader
        eyebrow="Tools / Preferences"
        title="Settings"
        description="Preferences are saved in this browser only."
      />

      <div className="card divide-y divide-line max-w-2xl">
        <div className="flex items-start justify-between gap-6 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-parchment">Floating particles</p>
            <p className="text-sm text-muted mt-1">
              Slow-moving dots drawn behind every page. Turn them off if you find them distracting.
            </p>
            {systemPrefersReducedMotion && particlesEnabled && (
              <p className="text-xs text-sky mt-2">
                Your system asks for reduced motion, so the particles are shown still instead of
                moving.
              </p>
            )}
          </div>

          {/* An on/off switch built from a button, so keyboards and screen readers can use it */}
          <button
            role="switch"
            aria-checked={particlesEnabled}
            aria-label="Floating particles"
            onClick={() => onParticlesEnabledChange(!particlesEnabled)}
            className={`relative w-11 h-6 rounded-full shrink-0 border transition-colors ${
              particlesEnabled ? "bg-gold border-gold" : "bg-surface-raised border-line"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ink transition-transform ${
                particlesEnabled ? "translate-x-5" : "translate-x-0 !bg-muted"
              }`}
            />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-parchment">Backend API address</p>
          <p className="text-sm font-mono text-gold-glow mt-1.5 break-all">
            {axiosClient.defaults.baseURL}
          </p>
          <p className="text-sm text-muted mt-2">
            To change it, set <span className="font-mono">VITE_API_URL</span> in a{" "}
            <span className="font-mono">.env</span> file (copy{" "}
            <span className="font-mono">.env.example</span>) and restart{" "}
            <span className="font-mono">npm run dev</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
