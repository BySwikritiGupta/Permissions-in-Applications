import {
  Upload,
  ScanSearch,
  ShieldAlert,
  Activity,
  AppWindow,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  PageHeader,
  RiskBadge,
  EmptyState,
  levelStyles,
  fmtDate,
} from "../components/ui";

export default function Dashboard({ scans, onNavigate, onOpen }) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  scans.forEach((s) => counts[s.level]++);
  const highRisk = scans
    .filter((s) => s.level === "High")
    .sort((a, b) => b.score - a.score);
  const avg = scans.length
    ? Math.round(scans.reduce((a, s) => a + s.score, 0) / scans.length)
    : 0;

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      scans: scans.filter(
        (s) => new Date(s.date).toDateString() === d.toDateString(),
      ).length,
    };
  });
  const pie = Object.entries(counts).map(([name, value]) => ({ name, value }));

  const stats = [
    {
      label: "Total scans",
      value: scans.length,
      icon: Activity,
      tint: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "High-risk apps",
      value: counts.High,
      icon: ShieldAlert,
      tint: "bg-rose-100 text-rose-600",
    },
    {
      label: "Medium risk",
      value: counts.Medium,
      icon: AppWindow,
      tint: "bg-amber-100 text-amber-600",
    },
    {
      label: "Avg. risk score",
      value: avg,
      icon: ScanSearch,
      tint: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
      />

      {/* Upload banner */}
      <button
        onClick={() => onNavigate("scan")}
        className="group mb-6 flex w-full flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 px-6 py-10 text-white shadow-lg shadow-cyan-600/25 transition hover:shadow-xl"
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/40 transition group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <div className="text-lg font-semibold">Scan a new app</div>
        <div className="text-sm text-cyan-50">
          Upload an AndroidManifest.xml or a JSON permission report
        </div>
      </button>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <Card key={label} className="p-4">
            <div
              className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tint}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Total scans */}
        <Card className="lg:col-span-2">
          <CardHeader title="Total scans" subtitle="Last 7 days" />
          <div className="h-52 px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mx-5 my-4 border-t border-slate-200" />
          <div className="flex flex-wrap items-center gap-6 px-5 pb-6">
            <div className="h-36 w-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pie}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pie.map((p) => (
                      <Cell key={p.name} fill={levelStyles[p.name].color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              <div className="mb-2 text-sm font-semibold text-slate-700">
                Risk distribution
              </div>
              <div className="space-y-2">
                {pie.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${levelStyles[p.name].dot}`}
                      />{" "}
                      {p.name}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {p.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Recent scans"
              action={
                <button
                  onClick={() => onNavigate("history")}
                  className="text-xs font-medium text-teal-700 hover:underline"
                >
                  View all
                </button>
              }
            />
            <div className="p-3">
              {scans.length === 0 ? (
                <EmptyState
                  icon={ScanSearch}
                  title="No scans yet"
                  text="Run your first scan to see it here."
                />
              ) : (
                scans.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onOpen(s)}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left hover:bg-white"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">
                        {s.appName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {fmtDate(s.date)}
                      </div>
                    </div>
                    <RiskBadge level={s.level} />
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="High-risk apps"
              subtitle="Need attention first"
            />
            <div className="p-3">
              {highRisk.length === 0 ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="All clear"
                  text="No high-risk apps found."
                />
              ) : (
                highRisk.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onOpen(s)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-white"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-100 text-sm font-bold text-rose-600">
                      {s.score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-800">
                        {s.appName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {s.permissions.filter((p) => !p.necessary).length}{" "}
                        excessive permissions
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
