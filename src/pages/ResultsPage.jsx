import { useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Link2,
  FileSearch,
  Info,
  Lightbulb,
} from "lucide-react";
import {
  Card,
  CardHeader,
  PageHeader,
  RiskBadge,
  ScoreRing,
  EmptyState,
  Spinner,
  levelStyles,
  fmtDate,
} from "../components/ui";

const order = { High: 0, Medium: 1, Low: 2 };

const Detail = ({ label, text, mono }) => (
  <div>
    <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </div>
    <div className={`text-slate-700 ${mono ? "font-mono text-xs" : ""}`}>
      {text || "—"}
    </div>
  </div>
);

function PermissionCard({ p, purpose }) {
  const [open, setOpen] = useState(false);
  const s = levelStyles[p.severity] || levelStyles.Low;
  return (
    <div
      className={`rounded-xl border ${open ? s.soft : "border-slate-200 bg-white"} transition`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm font-semibold text-slate-800">
            {p.name}
          </div>
          <div className="text-xs text-slate-500">
            {p.necessary
              ? "Matches declared purpose"
              : "Not expected for this app"}
          </div>
        </div>
        <RiskBadge level={p.severity} />
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-slate-200/70 px-4 py-4 text-sm sm:grid-cols-2">
          <Detail label="Why it's flagged" text={p.reason} />
          <Detail label="Evidence" text={p.evidence} mono />
          <Detail
            label="Purpose comparison"
            text={
              p.necessary
                ? `Reasonable for “${purpose || "the declared purpose"}”.`
                : `Not typically required for “${purpose || "the declared purpose"}”.`
            }
          />
          <Detail label="Recommended action" text={p.recommendation} />
          <div className="rounded-lg bg-white/80 p-3 sm:col-span-2">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-teal-700">
              <Lightbulb className="h-3.5 w-3.5" /> Safer alternative
            </div>
            <div className="text-slate-700">{p.alternative || "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage({ scan, loading = false, loadError = "", onNavigate }) {
  if (loading)
    return (
      <>
        <PageHeader title="Loading saved results" />
        <Card><Spinner label="Loading the complete scan report…" /></Card>
      </>
    );

  if (!scan)
    return (
      <>
        <PageHeader title="Scan results" />
        <Card>
          <EmptyState
            icon={FileSearch}
            title="No scan selected"
            text="Run a new scan or open one from your history."
            action={
              <button
                onClick={() => onNavigate("scan")}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Scan an app
              </button>
            }
          />
        </Card>
      </>
    );

  const sorted = [...(scan.permissions || [])].sort(
    (a, b) => order[a.severity] - order[b.severity],
  );
  const flagged = sorted.filter((p) => !p.necessary || p.severity !== "Low");
  const expected = sorted.filter((p) => p.necessary && p.severity === "Low");

  return (
    <>
      <PageHeader
        title={scan.appName}
        subtitle={`${scan.category} · scanned ${fmtDate(scan.date)}`}
      >
        <button
          onClick={() => onNavigate("reports")}
          className="rounded-xl border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
        >
          View full report
        </button>
      </PageHeader>

      {scan.demo && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Info className="h-4 w-4" /> Showing demo analysis data (backend not
          connected).
        </div>
      )}

      {loadError && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The saved scan details could not be refreshed from the backend: {loadError}
        </div>
      )}

      {/* Summary */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center gap-8">
          <ScoreRing score={scan.score} />
          <div className="min-w-[220px] flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <RiskBadge level={scan.level} />
              <span className="text-sm text-slate-500">
                Declared purpose: {scan.purpose || "—"}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {scan.level === "High" &&
                "This app requests many permissions that do not fit its purpose. Review and revoke before use."}
              {scan.level === "Medium" &&
                "Some permissions go beyond what the app needs. Restrict them where possible."}
              {scan.level === "Low" &&
                "Permissions are consistent with the declared purpose."}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["Checked", scan.checked ?? scan.permissions.length],
                ["Flagged", flagged.length],
                ["Combos", scan.combos?.length || 0],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/80 p-3 text-center">
                  <div className="text-xl font-bold text-slate-800">{v}</div>
                  <div className="text-xs text-slate-500">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Findings */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Permission analysis"
            subtitle="Risky findings are separated from permissions expected for this app"
          />
          <div className="space-y-2.5 p-5">
            {flagged.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No risky permissions found"
                text="The scanned permissions match the declared app purpose."
              />
            ) : (
              flagged.map((p) => (
                <PermissionCard key={p.name} p={p} purpose={scan.purpose} />
              ))
            )}
            {expected.length > 0 && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <h4 className="mb-2 text-sm font-semibold text-emerald-800">Expected for this app’s purpose</h4>
                <div className="flex flex-wrap gap-2">
                  {expected.map((permission) => (
                    <span key={permission.name} title={permission.reason} className="rounded-lg bg-white px-2.5 py-1.5 font-mono text-xs text-emerald-800 ring-1 ring-emerald-200">
                      {permission.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Combos + limitations */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Suspicious combinations"
              subtitle="Indicators for review, not proof of malice"
            />
            <div className="space-y-3 p-5">
              {!scan.combos?.length ? (
                <p className="text-sm text-slate-500">
                  No risky combinations detected.
                </p>
              ) : (
                scan.combos.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                      <Link2 className="h-4 w-4" /> {c.title}
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {c.permissions.map((p) => (
                        <span
                          key={p}
                          className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-amber-900/80">{c.reason}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Limitations
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
              <li>Static analysis of declared permissions only.</li>
              <li>Cannot see runtime behaviour or actual data use.</li>
              <li>Flags are indicators, not proof of malicious intent.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
