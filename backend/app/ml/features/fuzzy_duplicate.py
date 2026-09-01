import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def detect_fuzzy_duplicates(df: pd.DataFrame, sample_limit: int = 5000) -> pd.DataFrame:
    """
    Computes TF-IDF based cosine similarity within the same MP_NAME to detect
    reworded/near-duplicate work recommendations.
    """
    df = df.copy()
    if "FUZZY_SIMILARITY_SCORE" in df.columns:
        return df

    df["FUZZY_SIMILARITY_SCORE"] = 0.0
    
    # We compute similarity grouped by MP_NAME
    # For efficiency on large dataframes, we process MP groups
    mp_groups = df.groupby("MP_NAME")
    
    fuzzy_scores = pd.Series(0.0, index=df.index)
    
    for mp_name, group in mp_groups:
        if len(group) < 2:
            continue
        
        texts = group["WORK"].fillna("").tolist()
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=500)
            tfidf_matrix = vectorizer.fit_transform(texts)
            sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
            np.fill_diagonal(sim_matrix, 0.0)
            
            # Max similarity with any other work by same MP with same approx amount (+- 20%)
            amounts = group["ALLOCATION_AMOUNT"].values
            n = len(group)
            max_sims = np.zeros(n)
            
            for i in range(n):
                for j in range(n):
                    if i != j:
                        # If text is similar (>0.70) and amounts are within 25% or identical
                        amt_ratio = min(amounts[i], amounts[j]) / max(amounts[i], amounts[j]) if max(amounts[i], amounts[j]) > 0 else 1.0
                        if sim_matrix[i, j] > 0.70 and amt_ratio > 0.75:
                            max_sims[i] = max(max_sims[i], sim_matrix[i, j])
                            
            fuzzy_scores.loc[group.index] = max_sims
        except Exception:
            pass
            
    df["FUZZY_SIMILARITY_SCORE"] = fuzzy_scores.clip(0.0, 1.0)
    return df
