import { Link, useLocation } from 'react-router-dom';

const steps = [
  { path: '/', label: 'Overview' },
  { path: '/mission-setup', label: 'Mission Setup' },
  { path: '/safety-review', label: 'Safety Review' },
  { path: '/monitoring', label: 'Live Monitoring' },
  { path: '/review', label: 'Operation Review' },
  { path: '/demo', label: 'Demo Controls' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#1b263b] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2d6a4f] flex items-center justify-center font-bold text-lg">
            K
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Kyron Control Center</h1>
            <p className="text-xs text-white/60">Robot Operations — Simulation Mode</p>
          </div>
        </div>
        <nav className="flex gap-1">
          {steps.map((step) => (
            <Link
              key={step.path}
              to={step.path}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                location.pathname === step.path
                  ? 'bg-[#2d6a4f] text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {step.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-900">
        <strong>Simulation only.</strong> This interface must not be used to control physical hardware.
        Onboard safety systems remain independent of browser controls.
      </div>

      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">{children}</main>
    </div>
  );
}
