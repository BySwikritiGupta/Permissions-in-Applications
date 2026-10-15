import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ScanPage from "./pages/ScanPage";
import ResultsPage from "./pages/ResultsPage";
import HistoryPage from "./pages/HistoryPage";
import ReportsPage from "./pages/ReportsPage";
import { seedScans } from "./data/mock";
import { getScans, getScan } from "./lib/api";

const STORAGE_KEY = "cybercup.scans";
const load = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored?.length ? stored : seedScans;
  } catch { return seedScans; }
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [scans, setScans] = useState(load);
  const [current, setCurrent] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultLoadError, setResultLoadError] = useState("");

  useEffect(() => {
    let active = true;
    getScans().then((remote) => {
      if (active) setScans(remote);
    }).catch(() => {
      // Keep cached scans visible if the backend is temporarily unavailable.
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  }, [scans]);

  const open = async (scan) => {
    setCurrent(null);
    setPage("results");
    setResultLoadError("");
    setResultLoading(true);
    try {
      const fullScan = scan.demo ? scan : await getScan(scan.id);
      setCurrent(fullScan);
      setScans((previous) => previous.map((item) => item.id === fullScan.id ? fullScan : item));
    } catch (error) {
      setCurrent(scan);
      setResultLoadError(error.message || "Could not load the saved scan details.");
    } finally {
      setResultLoading(false);
    }
  };

  const addScan = (scan) => {
    setScans((previous) => [scan, ...previous.filter((item) => item.id !== scan.id)]);
    setCurrent(scan);
    setPage("results");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-cyan-50 to-sky-100 text-slate-800">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="pb-24 md:pb-8 md:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          {page === "dashboard" && <Dashboard scans={scans} onNavigate={setPage} onOpen={open} />}
          {page === "scan" && <ScanPage onResult={addScan} />}
          {page === "results" && <ResultsPage scan={current} loading={resultLoading} loadError={resultLoadError} onNavigate={setPage} />}
          {page === "history" && <HistoryPage scans={scans} onOpen={open} />}
          {page === "reports" && <ReportsPage scans={scans} initialId={current?.id} />}
        </div>
      </main>
    </div>
  );
}
