import { seedScans } from "../data/mock";
import { levelFromScore } from "../components/ui";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const cap = (value = "") => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
const saferAlternatives = {
  READ_CONTACTS: "Use the system contact picker so the user selects a single contact instead of granting access to the whole address book.",
  WRITE_CONTACTS: "Open the system contact editor for a user-confirmed change instead of writing to contacts directly.",
  RECORD_AUDIO: "Use an existing audio file or request microphone access only while the user is actively recording.",
  CAMERA: "Use the Android photo picker or camera capture intent when the app only needs a user-selected image.",
  READ_SMS: "Use the SMS Retriever or SMS User Consent API for verification codes instead of reading the inbox.",
  SEND_SMS: "Open the SMS composer with a prefilled message so the user reviews and sends it.",
  ACCESS_FINE_LOCATION: "Request approximate location or let the user choose a location manually when precise GPS is unnecessary.",
  ACCESS_COARSE_LOCATION: "Let the user enter or select a location manually if location access is not essential.",
  ACCESS_BACKGROUND_LOCATION: "Request location only while the app is in use, or use a user-started foreground session.",
  READ_CALL_LOG: "Use a dialer intent or ask the user to select call details instead of reading the full call log.",
  READ_PHONE_STATE: "Use an app-scoped identifier and avoid collecting device or telephony identifiers where possible.",
  MANAGE_EXTERNAL_STORAGE: "Use the Android Storage Access Framework or system file picker for user-selected files.",
  READ_EXTERNAL_STORAGE: "Use scoped storage and the system photo or file picker for selected items.",
  READ_MEDIA_IMAGES: "Use the Android Photo Picker to access only images the user selects.",
  READ_MEDIA_VIDEO: "Use the Android Photo Picker to access only videos the user selects.",
  READ_CALENDAR: "Use a calendar intent or ask the user to select specific events instead of reading the full calendar.",
  WRITE_CALENDAR: "Open a prefilled calendar event intent so the user confirms before adding the event.",
  BODY_SENSORS: "Use Health Connect with the smallest required data scope, or allow manual entry when sensor data is optional.",
  SYSTEM_ALERT_WINDOW: "Use in-app screens, dialogs, or notifications instead of drawing over other apps.",
  REQUEST_INSTALL_PACKAGES: "Direct users to a trusted app store for installation rather than requesting package installation access.",
  QUERY_ALL_PACKAGES: "Declare visibility only for the specific packages the app needs to interact with.",
};

export async function checkHealth() {
  try { return (await fetch(BASE + "/api/v1/health")).ok; }
  catch { return false; }
}

function normalize(raw, meta = {}) {
  const findings = raw.findings || [];
  const permissions = raw.permissions_found || findings.map((item) => item.permission).filter(Boolean);
  const score = Math.round(raw.risk_score ?? raw.score ?? 0);
  return {
    id: raw.scan_id || raw.id || crypto.randomUUID(),
    appName: raw.app_name || meta.appName || "Unknown application",
    category: raw.category || meta.category || "Other",
    purpose: raw.purpose ?? meta.purpose ?? "",
    date: raw.created_at || raw.date || new Date().toISOString(),
    score,
    level: cap(raw.risk_level || levelFromScore(score)),
    checked: raw.permissions_checked ?? raw.permissions_checked_count ?? permissions.length,
    permissions: permissions.map((name) => {
      const finding = findings.find((item) => item.permission === name);
      return {
        name, severity: cap(finding?.severity || "low"), necessary: finding?.necessary ?? !finding,
        reason: finding?.reason || "No specific risk rule was triggered for this permission.",
        evidence: finding?.evidence || name + " was declared by the application.",
        recommendation: finding?.recommendation || "Review whether this permission is needed for the app's features.",
        alternative: finding?.alternative || saferAlternatives[name] || "No direct substitute is identified; request this permission only when the related feature is needed.",
      };
    }),
    combos: (raw.suspicious_combinations || []).map((combo) => ({
      title: combo.title || (combo.permissions || []).join(" + "),
      permissions: combo.permissions || [], reason: combo.reason || combo.description || "",
    })),
    limitations: raw.limitations || [],
  };
}

function demoScan(meta) {
  const match = seedScans.find((scan) => meta.appName.toLowerCase().includes(scan.appName.toLowerCase().split(" ")[0]));
  const sample = match || seedScans[meta.appName.length % seedScans.length];
  return { ...sample, ...meta, id: crypto.randomUUID(), date: new Date().toISOString(), demo: true };
}

async function request(url, options, meta) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = "Server error (" + response.status + ")";
    try { const body = await response.json(); message = body.detail || message; } catch {}
    throw new Error(message);
  }
  return normalize(await response.json(), meta);
}

export async function getScans() {
  const response = await fetch(BASE + "/api/v1/scans");
  if (!response.ok) throw new Error("Could not load scan history (" + response.status + ").");
  const result = await response.json();
  return (result.scans || []).map((scan) => normalize(scan));
}

export async function getScan(id) {
  const response = await fetch(BASE + "/api/v1/scans/" + encodeURIComponent(id));
  if (!response.ok) throw new Error("Could not load scan details (" + response.status + ").");
  return normalize(await response.json());
}

export function scanManifest({ file, appName, category, purpose }) {
  const form = new FormData();
  form.append("file", file);
  form.append("app_name", appName);
  form.append("category", category);
  form.append("purpose", purpose);
  return request(BASE + "/api/v1/scans", { method: "POST", body: form }, { appName, category, purpose });
}

export function scanReport({ report, appName, category, purpose }) {
  return request(BASE + "/api/v1/scans/report", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...report, app_name: appName, category, purpose }),
  }, { appName, category, purpose });
}

export function scanReportFile({ file, appName, category, purpose }) {
  const form = new FormData();
  form.append("file", file);
  form.append("app_name", appName);
  form.append("category", category);
  form.append("purpose", purpose);
  return request(BASE + "/api/v1/scans/report/file", { method: "POST", body: form }, { appName, category, purpose });
}

export function scanApk({ file, appName, category, purpose }) {
  const form = new FormData();
  form.append("file", file);
  form.append("app_name", appName);
  form.append("category", category);
  form.append("purpose", purpose);
  return request(BASE + "/api/v1/scans/apk", { method: "POST", body: form }, { appName, category, purpose });
}

export { demoScan };
