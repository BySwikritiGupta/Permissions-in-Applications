import { useState } from "react";
import { FileText, Printer, AlertTriangle } from "lucide-react";
import {
  Card,
  PageHeader,
  RiskBadge,
  ScoreRing,
  EmptyState,
  fmtDate,
} from "../components/ui";

export default function ReportsPage({ scans, initialId }) {
  const [id, setId] = useState(initialId || scans[0]?.id);
  const scan = scans.find((s) => s.id === id) || scans[0];

  if (!scan)
    return (
      <>
        <PageHeader title="Reports" />
        <Card>
          <EmptyState
            icon={FileText}
            title="No reports yet"
            text="Scan an app to generate a report."
          />
        </Card>
      </>
    );

  const flagged = scan.permissions.filter(
    (p) => !p.necessary || p.severity !== "Low",
  );

  return (
    <>
      <PageHeader
        title="Reports"
      >
        <div className="no-print flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="no-print h-fit p-2 lg:col-span-1">
          {scans.map((s) => (
            <button
              key={s.id}
              onClick={() => setId(s.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                s.id === scan.id ? "bg-teal-600 text-white" : "hover:bg-white"
              }`}
            >
              <span className="truncate font-medium">{s.appName}</span>
              <span className="ml-2 text-xs opacity-80">{s.score}</span>
            </button>
          ))}
        </Card>

        <Card className="p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 pb-5">
            <ScoreRing score={scan.score} size={110} />
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {scan.appName}
              </h2>
              <p className="text-sm text-slate-500">
                {scan.category} · {fmtDate(scan.date)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Purpose: {scan.purpose || "—"}
              </p>
              <div className="mt-2">
                <RiskBadge level={scan.level} />
              </div>
            </div>
          </div>

          <h3 className="mb-3 mt-5 font-semibold text-slate-800">
            Findings & recommendations
          </h3>
          {flagged.length === 0 ? (
            <p className="text-sm text-slate-500">No issues found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-2">Permission</th>
                    <th className="pb-2">Severity</th>
                    <th className="pb-2">Recommendation</th>
                    <th className="pb-2">Safer alternative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flagged.map((p) => (
                    <tr key={p.name}>
                      <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-slate-700">
                        {p.name}
                      </td>
                      <td className="py-2.5 pr-3">
                        <RiskBadge level={p.severity} />
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {p.recommendation}
                      </td>
                      <td className="py-2.5 pl-3 text-slate-600">
                        {p.alternative || "No direct substitute identified; review whether this permission is needed."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {scan.combos?.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 font-semibold text-slate-800">
                Suspicious combinations
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {scan.combos.map((c, i) => (
                  <li key={i}>
                    <b>{c.title}</b> — {c.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
