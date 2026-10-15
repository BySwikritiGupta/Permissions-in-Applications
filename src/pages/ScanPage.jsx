import { useState } from "react";
import {
  FileCode2,
  Braces,
  Smartphone,
  UploadCloud,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { scanManifest, scanReport, scanReportFile, scanApk } from "../lib/api";
import { sampleJson } from "../data/mock";

const tabs = [
  { id: "xml", label: "Manifest XML", icon: FileCode2 },
  { id: "json", label: "JSON report", icon: Braces },
  { id: "apk", label: "APK", icon: Smartphone },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15";

export default function ScanPage({ onResult }) {
  const [tab, setTab] = useState("xml");
  const [appName, setAppName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [file, setFile] = useState(null);
  const [json, setJson] = useState("");
  const [jsonFile, setJsonFile] = useState(null);
  const [apkFile, setApkFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!appName.trim()) return setError("Please enter the app name.");
    const meta = { appName: appName.trim(), category: "Other", purpose: purpose.trim() };
    try {
      setLoading(true);
      let scan;
      if (tab === "xml") {
        if (!file)
          throw new Error("Please choose an AndroidManifest.xml file.");
        scan = await scanManifest({ ...meta, file });
      } else if (tab === "json") {
        if (jsonFile) {
          scan = await scanReportFile({ ...meta, file: jsonFile });
          onResult(scan);
          return;
        }
        let report;
        try {
          report = JSON.parse(json);
        } catch {
          throw new Error("That JSON is not valid.");
        }
        scan = await scanReport({ ...meta, report });
      } else if (tab === "apk") {
        if (!apkFile) throw new Error("Please choose an APK file.");
        scan = await scanApk({ ...meta, file: apkFile });
      }
      onResult(scan);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <>
      <PageHeader
        title="Scan application"
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-5">
        {/* App details */}
        <Card className="space-y-4 p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-800">App details</h3>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              App name *
            </label>
            <input
              className={inputCls}
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Declared purpose
            </label>
            <textarea
              rows={4}
              className={inputCls}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        </Card>

        {/* Input */}
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === id
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {tab === "xml" && (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
                drag
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-300 bg-white/60 hover:border-teal-400"
              }`}
            >
              <UploadCloud className="mb-3 h-10 w-10 text-teal-600" />
              {file ? (
                <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800">
                  {file.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="font-medium text-slate-700">
                    Drop AndroidManifest.xml here
                  </div>
                  <div className="text-sm text-slate-500">
                    or click to browse
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".xml"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          )}

          {tab === "json" && (
            <div>
              <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600 hover:border-teal-400">
                <UploadCloud className="h-5 w-5 text-teal-600" />
                <span className="flex-1">{jsonFile ? jsonFile.name : "Choose a JSON report file"}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                />
                {jsonFile && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setJsonFile(null); }} aria-label="Remove JSON file">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              <p className="mb-2 text-xs text-slate-500">Or paste a report below. JSON must include a non-empty permissions array.</p>
              <textarea
                rows={11}
                value={json}
                disabled={Boolean(jsonFile)}
                onChange={(e) => setJson(e.target.value)}
                placeholder='{"permissions": ["android.permission.INTERNET"]}'
                className={`${inputCls} font-mono text-xs`}
              />
              <button
                type="button"
                onClick={() => setJson(sampleJson)}
                className="mt-2 text-xs font-medium text-teal-700 hover:underline"
              >
                Fill with sample report
              </button>
            </div>
          )}

          {tab === "apk" && (
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center transition hover:border-teal-400">
                <Smartphone className="mb-3 h-10 w-10 text-teal-600" />
                <span className="font-medium text-slate-700">{apkFile ? apkFile.name : "Choose an Android APK file"}</span>
                <span className="mt-1 text-sm text-slate-500">Maximum file size: 100 MB</span>
                <input
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  className="sr-only"
                  onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                />
              </label>
              {apkFile && (
                <button type="button" onClick={() => setApkFile(null)} className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600">
                  <X className="h-3.5 w-3.5" /> Remove APK
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analysing…
              </>
            ) : (
              "Analyse permissions"
            )}
          </button>
        </Card>
      </form>
    </>
  );
}
