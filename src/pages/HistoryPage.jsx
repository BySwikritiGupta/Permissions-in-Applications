import { useState } from "react";
import { Search, History } from "lucide-react";
import {
  Card,
  PageHeader,
  RiskBadge,
  EmptyState,
  fmtDate,
  levelStyles,
} from "../components/ui";

export default function HistoryPage({ scans, onOpen }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");

  const rows = scans.filter(
    (s) =>
      (filter === "All" || s.level === filter) &&
      s.appName.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Scan history"
        subtitle=""
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/70 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
            />
          </div>
          <div className="flex gap-1.5">
            {["All", "High", "Medium", "Low"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No scans found"
            text="Try a different search or filter."
          />
        ) : (
          <div className="divide-y divide-slate-200/70">
            {rows.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpen(s)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/80"
              >
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                  style={{ background: levelStyles[s.level].color }}
                >
                  {s.score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-800">
                    {s.appName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {s.category} · {fmtDate(s.date)}
                  </div>
                </div>
                <RiskBadge level={s.level} />
              </button>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
