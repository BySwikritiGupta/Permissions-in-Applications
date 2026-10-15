import { LayoutDashboard, ScanSearch, FileSearch, History, FileText, ShieldCheck } from 'lucide-react'

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scan', label: 'Scan App', icon: ScanSearch },
  { id: 'results', label: 'Results', icon: FileSearch },
  { id: 'history', label: 'History', icon: History },
  { id: 'reports', label: 'Reports', icon: FileText },
]

export default function Sidebar({ page, onNavigate }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-300/50 bg-white/40 p-5 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight tracking-tight text-slate-800">
              App <span className="text-teal-600">Guard</span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map(({ id, label, icon: Icon }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-300/50 bg-white/85 px-2 py-2 backdrop-blur md:hidden">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] font-medium ${
              page === id ? 'text-teal-700' : 'text-slate-500'
            }`}
          >
            <Icon className="h-5 w-5" /> {label}
          </button>
        ))}
      </nav>
    </>
  )
}
