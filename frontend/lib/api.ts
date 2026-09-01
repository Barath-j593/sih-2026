import { DashboardData, WorkItem, WorkDetail, CaseItem, AlertItem, ModelMetricsData, UserRole } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchDashboard(role: UserRole, jurisdiction?: string): Promise<DashboardData> {
  const url = new URL(`${API_BASE}/dashboard`);
  url.searchParams.append("role", role);
  if (jurisdiction && jurisdiction !== "National") {
    url.searchParams.append("jurisdiction", jurisdiction);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export async function fetchWorks(params: Record<string, any> = {}): Promise<{
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: WorkItem[];
}> {
  const url = new URL(`${API_BASE}/works`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.append(k, String(v));
    }
  });
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch works");
  return res.json();
}

export async function fetchWorkDetail(workId: string): Promise<WorkDetail> {
  const res = await fetch(`${API_BASE}/works/${workId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch work ${workId}`);
  return res.json();
}

export async function fetchFilters(): Promise<{
  states: string[];
  categories: string[];
  statuses: string[];
  fraud_types: string[];
  risk_levels: string[];
}> {
  const res = await fetch(`${API_BASE}/works/filters`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch filters");
  return res.json();
}

export async function fetchStateChoropleth(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/geo/states-choropleth`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch choropleth data");
  return res.json();
}

export async function fetchDistrictDrilldown(state: string = "Bihar"): Promise<any[]> {
  const res = await fetch(`${API_BASE}/geo/district-drilldown?state=${encodeURIComponent(state)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch district drilldown");
  return res.json();
}

export async function fetchConstituencyPins(constituency?: string, mpName?: string): Promise<any[]> {
  const url = new URL(`${API_BASE}/geo/pins`);
  if (constituency) url.searchParams.append("constituency", constituency);
  if (mpName) url.searchParams.append("mp_name", mpName);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch constituency pins");
  return res.json();
}

export async function fetchNetworkGraph(maxNodes: number = 100, minRisk: number = 0): Promise<{ nodes: any[]; links: any[] }> {
  const res = await fetch(`${API_BASE}/graph/network?max_nodes=${maxNodes}&min_risk=${minRisk}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch network graph");
  return res.json();
}

export async function fetchCases(status?: string, priority?: string): Promise<CaseItem[]> {
  const url = new URL(`${API_BASE}/cases`);
  if (status) url.searchParams.append("status", status);
  if (priority) url.searchParams.append("priority", priority);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function updateCaseStatus(caseId: string, status: string, note?: string): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note, author: "Investigating Officer" }),
  });
  if (!res.ok) throw new Error("Failed to update case status");
  return res.json();
}

export async function addCaseNote(caseId: string, text: string): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, author: "Investigating Officer" }),
  });
  if (!res.ok) throw new Error("Failed to add case note");
  return res.json();
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const res = await fetch(`${API_BASE}/alerts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function markAlertAsRead(alertId: string): Promise<AlertItem> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark alert as read");
  return res.json();
}

export async function fetchModelMetrics(): Promise<ModelMetricsData> {
  const res = await fetch(`${API_BASE}/model-metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch model metrics");
  return res.json();
}
