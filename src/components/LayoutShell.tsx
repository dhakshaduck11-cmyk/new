import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  Menu,
  Radar,
  X,
} from 'lucide-react';
import type { ActiveSection, SourceMode } from '../types/anomasea';

interface LayoutShellProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  sourceMode: SourceMode;
  loading: boolean;
  children: ReactNode;
}

const NAV_ITEMS: Array<{
  id: ActiveSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'risk-radar', label: 'Environmental Risk Radar', icon: Radar },
  { id: 'catalogue', label: 'Debris Catalogue', icon: BookOpen },
  { id: 'detections', label: 'Detections Log', icon: ClipboardList },
  { id: 'reports-api', label: 'Reports & Backend', icon: FileBarChart2 },
];

export function LayoutShell({
  activeSection,
  onNavigate,
  sourceMode,
  loading,
  children,
}: LayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (section: ActiveSection) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  const sourceTitle =
    sourceMode === 'live-api'
      ? 'FastAPI Backend Active'
      : sourceMode === 'imported-survey'
        ? 'Imported Survey Dataset'
        : 'Local Demonstration Mode';

  const sourceDescription =
    sourceMode === 'live-api'
      ? 'Connected to /api/risk/* endpoints.'
      : sourceMode === 'imported-survey'
        ? 'Displaying user-imported GeoJSON records.'
        : 'Synthetic survey records active while FastAPI backend is offline.';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#0B192C] text-slate-100 border-r border-slate-800">
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-sky-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v3" />
              <path d="M12 12l5-5" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            AnomaSea
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-400/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
          <div className="font-medium text-slate-200">{sourceTitle}</div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {sourceDescription}
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-[#0B192C] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
            <Radar className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-display text-base font-bold tracking-tight whitespace-nowrap">
            AnomaSea
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B192C] text-slate-100 border-b border-slate-800 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Region */}
      <div className="flex-1 min-w-0 flex flex-col">
        {sourceMode === 'demo-synthetic' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Local Demonstration Mode:</strong> Displaying clearly labelled
              synthetic marine survey records. Connect a Python FastAPI backend in{' '}
              <button
                type="button"
                onClick={() => handleNavigate('reports-api')}
                className="underline font-semibold hover:text-amber-800 cursor-pointer"
              >
                Reports &amp; Backend
              </button>{' '}
              or import GeoJSON in{' '}
              <button
                type="button"
                onClick={() => handleNavigate('detections')}
                className="underline font-semibold hover:text-amber-800 cursor-pointer"
              >
                Detections Log
              </button>
              .
            </span>
            {loading && (
              <span className="font-mono text-[11px] text-amber-800">
                Checking backend...
              </span>
            )}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
