import numpy as np
import pandas as pd
from typing import List, Dict, Any
from app.ml.features.feature_pipeline import build_feature_pipeline, FEATURE_COLUMNS
from app.ml.models.model_registry import get_model_registry

def predict_works_risk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the full ML feature extraction + multi-model ensemble fusion pipeline
    to an arbitrary DataFrame of works (e.g. real Vonter CSV dataset).
    """
    registry = get_model_registry()
    
    # 1. Feature pipeline
    featured_df = build_feature_pipeline(df)
    
    # Also update graph model with the real connections
    registry.graph_model.fit_from_dataframe(featured_df)

    X = featured_df[FEATURE_COLUMNS].values

    # 2. Predict individual signals
    xgb_probas = registry.xgb.predict_proba(X)
    if_scores = registry.iso_forest.predict_anomaly_score(X)
    lof_scores = registry.lof.predict_anomaly_score(X)

    # 3. Fuse signals row-by-row
    final_scores = []
    risk_levels = []
    risk_reasons_list = []
    sub_scores_list = []
    fraud_types = []

    for i, (_, row) in enumerate(featured_df.iterrows()):
        row_dict = row.to_dict()
        ida_name = str(row_dict.get("IDA", ""))
        graph_ida_risk = registry.graph_model.get_ida_risk(ida_name)

        score, level, reasons, sub_scores, f_type = registry.fusion_engine.fuse_signals(
            row_dict=row_dict,
            xgb_proba=float(xgb_probas[i]) if i < len(xgb_probas) else 0.1,
            if_score=float(if_scores[i]) if i < len(if_scores) else 0.1,
            lof_score=float(lof_scores[i]) if i < len(lof_scores) else 0.1,
            graph_ida_risk=graph_ida_risk
        )

        final_scores.append(score)
        risk_levels.append(level)
        risk_reasons_list.append(reasons)
        sub_scores_list.append(sub_scores)
        fraud_types.append(f_type)

    featured_df["RISK_SCORE"] = final_scores
    featured_df["RISK_LEVEL"] = risk_levels
    featured_df["RISK_REASONS"] = risk_reasons_list
    featured_df["SUB_SCORES"] = sub_scores_list
    featured_df["PREDICTED_FRAUD_TYPE"] = fraud_types

    return featured_df
