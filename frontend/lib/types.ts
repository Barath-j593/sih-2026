export type UserRole = "ministry" | "state" | "district" | "mp";

export interface SummaryCards {
  total_works: number;
  total_allocation: number;
  flagged_works_count: number;
  amount_at_risk: number;
  avg_risk_score: number;
  critical_cases_count: number;
  resolved_cases_count: number;
  active_alerts_count: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface FraudTypeBreakdownItem {
  fraud_type: string;
  label: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface GeoRiskSummaryItem {
  name: string;
  code?: string;
  total_works: number;
  total_allocation: number;
  avg_risk_score: number;
  flagged_works_count: number;
  amount_at_risk: number;
  risk_level: string;
}

export interface TopFlaggedWorkItem {
  id: string;
  work: string;
  mp_name: string;
  ida: string;
  state: string;
  constituency: string;
  allocation_amount: number;
  status: string;
  risk_score: number;
  risk_level: string;
  predicted_fraud_type?: string;
  risk_reasons: string[];
}

export interface MonthlyTrendItem {
  month: string;
  total_sanctions: number;
  flagged_amount: number;
  flagged_count: number;
}

export interface DashboardData {
  role: UserRole;
  jurisdiction: string;
  summary: SummaryCards;
  risk_distribution: RiskDistribution;
  fraud_breakdown: FraudTypeBreakdownItem[];
  geo_breakdown: GeoRiskSummaryItem[];
  top_flagged_works: TopFlaggedWorkItem[];
  recent_alerts: AlertItem[];
  monthly_trends: MonthlyTrendItem[];
  extra_insights: Record<string, any>;
}

export interface WorkItem {
  id: string;
  mp_name: string;
  work: string;
  category: string;
  state: string;
  constituency: string;
  ida: string;
  city?: string;
  ward?: string;
  block?: string;
  village?: string;
  recommended_date?: string;
  allocation_amount: number;
  ida_approval: string;
  status: string;
  house: string;
  risk_score: number;
  risk_level: string;
  risk_reasons: string[];
  sub_scores: Record<string, number>;
  predicted_fraud_type?: string;
  days_since_recommended?: number;
}

export interface WorkDetail extends WorkItem {
  explanation?: {
    work_id: string;
    risk_score: number;
    risk_level: string;
    predicted_fraud_type: string;
    reasons: string[];
    sub_scores: Record<string, number>;
    radar_breakdown: Array<{ signal: string; score: number; fullMark: number }>;
  };
}

export interface CaseNote {
  author: string;
  text: string;
  timestamp: string;
  status_change?: string;
}

export interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: "flagged" | "under_review" | "resolved";
  priority: "critical" | "high" | "medium" | "low";
  work_id?: string;
  mp_name?: string;
  state?: string;
  district?: string;
  ida?: string;
  risk_score: number;
  fraud_type?: string;
  assigned_to?: string;
  notes: CaseNote[];
  created_at: string;
  updated_at: string;
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  work_id?: string;
  mp_name?: string;
  state?: string;
  district?: string;
  ida?: string;
  fraud_type?: string;
  risk_score: number;
  is_read: boolean;
  created_at: string;
}

export interface ModelMetricsData {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  feature_importance: Array<{ feature: string; importance: number }>;
  pr_curve: Array<{ threshold: number; precision: number; recall: number }>;
  roc_curve: Array<{ threshold: number; fpr: number; tpr: number }>;
  training_sample_size: number;
  fraud_rate: number;
  timestamp: string;
  disclosure: string;
}
