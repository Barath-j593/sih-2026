from typing import List, Dict, Tuple, Any
import numpy as np
import pandas as pd

class RiskFusionEngine:
    def __init__(self):
        pass

    def fuse_signals(
        self,
        row_dict: dict,
        xgb_proba: float,
        if_score: float,
        lof_score: float,
        graph_ida_risk: float
    ) -> Tuple[float, str, List[str], Dict[str, float], str]:
        """
        Fuses ML signals and rule traces for a single work row.
        Returns:
            (risk_score_0_100, risk_level, reason_strings, sub_scores, predicted_fraud_type)
        """
        reasons = []
        sub_scores = {}

        # 1. Cost Anomaly Signal
        z_state = float(row_dict.get("ALLOC_ZSCORE_STATE", 0.0) or 0.0)
        z_wt = float(row_dict.get("ALLOC_ZSCORE_WORKTYPE", 0.0) or 0.0)
        max_z = max(z_state, z_wt)
        cost_signal = np.clip(max_z / 3.0, 0.0, 1.0) if max_z > 1.2 else 0.0
        sub_scores["cost_anomaly"] = round(float(cost_signal) * 100, 1)

        if max_z >= 2.5:
            alloc = row_dict.get("ALLOCATION_AMOUNT", 0.0)
            work_type = row_dict.get("WORK_TYPE", "similar works")
            reasons.append(f"Peer cost is significantly higher (+{max_z:.1f}σ) than peer benchmark for {work_type} (₹{alloc:,.0f})")
        elif max_z >= 1.5:
            reasons.append(f"Cost is moderately above the regional peer baseline (+{max_z:.1f}σ)")

        # 2. Duplicate Signal
        dupe_count = int(row_dict.get("DUPLICATE_COUNT", 1) or 1)
        fuzzy_sim = float(row_dict.get("FUZZY_SIMILARITY_SCORE", 0.0) or 0.0)
        
        dupe_signal = 0.0
        if dupe_count >= 5:
            dupe_signal = 0.95
            reasons.append(f"High-density duplicate cluster: {dupe_count} identical works recommended by the same MP")
        elif dupe_count >= 2:
            dupe_signal = 0.70
            reasons.append(f"Potential duplicate recommendation: {dupe_count} identical entries found with matching amount")
        elif fuzzy_sim >= 0.75:
            dupe_signal = 0.65
            reasons.append(f"Near-duplicate work description detected ({fuzzy_sim*100:.0f}% lexical similarity with existing work)")
        sub_scores["duplicate_risk"] = round(float(dupe_signal) * 100, 1)

        # 3. Structuring Signal
        struct_score = float(row_dict.get("STRUCTURING_SCORE", 0.0) or 0.0)
        sub_scores["structuring_risk"] = round(float(struct_score) * 100, 1)
        if struct_score >= 0.70:
            alloc = row_dict.get("ALLOCATION_AMOUNT", 0.0)
            reasons.append(f"Allocation amount ₹{alloc:,.0f} sits immediately below standard statutory approval threshold")

        # 4. Vendor / IDA Concentration Signal
        ida_share = float(row_dict.get("IDA_MP_WORK_SHARE", 0.0) or 0.0)
        ida_risk_signal = max(ida_share, graph_ida_risk)
        sub_scores["vendor_concentration"] = round(float(ida_risk_signal) * 100, 1)
        if ida_share >= 0.70:
            ida_name = row_dict.get("IDA", "Assigned IDA")
            reasons.append(f"Implementing Agency '{ida_name}' captures {ida_share*100:.0f}% of all works recommended by this MP")

        # 5. Stall / Ghost Signal
        stall_score = float(row_dict.get("STALL_RISK_SCORE", 0.0) or 0.0)
        days = int(row_dict.get("DAYS_SINCE_RECOMMENDED", 0) or 0)
        sub_scores["stall_risk"] = round(float(stall_score) * 100, 1)
        if stall_score >= 0.60:
            status = row_dict.get("STATUS", "Unsanctioned")
            reasons.append(f"Stalled project: Stagnant for {days} days in '{status}' status without execution progress")

        # 6. ML Ensemble Scores
        sub_scores["ml_fraud_probability"] = round(float(xgb_proba) * 100, 1)
        sub_scores["unsupervised_anomaly"] = round(float(if_score * 0.6 + lof_score * 0.4) * 100, 1)

        # Multi-signal weighted fusion
        weighted_score = (
            xgb_proba * 0.35 +
            cost_signal * 0.18 +
            dupe_signal * 0.15 +
            struct_score * 0.10 +
            ida_risk_signal * 0.10 +
            stall_score * 0.07 +
            (if_score * 0.6 + lof_score * 0.4) * 0.05
        )

        # Base scale to 0-100
        final_score = np.clip(weighted_score * 100.0, 0.0, 99.5)

        # If any single strong critical trigger exists, boost floor
        if dupe_count >= 10:
            final_score = max(final_score, 82.0)
        if max_z >= 4.0:
            final_score = max(final_score, 80.0)
        if struct_score >= 0.90 and max_z >= 1.0:
            final_score = max(final_score, 75.0)

        final_score = round(float(final_score), 1)

        # Classify Level
        if final_score >= 80.0:
            risk_level = "Critical"
        elif final_score >= 60.0:
            risk_level = "High"
        elif final_score >= 35.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Determine most prominent fraud type
        fraud_type_signals = {
            "overpricing": cost_signal,
            "duplicate": dupe_signal,
            "structuring": struct_score,
            "vendor_capture": ida_risk_signal,
            "ghost_project": stall_score
        }
        max_type = max(fraud_type_signals, key=fraud_type_signals.get)
        if fraud_type_signals[max_type] > 0.45 or final_score >= 60.0:
            predicted_fraud_type = max_type
        else:
            predicted_fraud_type = "none"

        # If no specific reason triggered but score is medium/high
        if not reasons and final_score >= 40.0:
            reasons.append("Multi-variate statistical anomaly detected across allocation timing and agency metrics")
        elif not reasons:
            reasons.append("Normal allocation profile adhering to standard MPLADS norms")

        return final_score, risk_level, reasons, sub_scores, predicted_fraud_type
