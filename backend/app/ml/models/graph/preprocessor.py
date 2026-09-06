"""
SETU — Stage 2H: Graph & Entity Relationship Preprocessor.

Constructs NetworkX heterogeneous multi-entity graph and computes:
- Degree centralities (contractor, agency, constituency)
- PageRank centralities
- Louvain community detection (clique mining)
- Bipartite (contractor-agency) and Tripartite (constituency-agency-contractor) co-occurrence
- Agency capture Herfindahl-Hirschman Index (HHI)
- Corporate collusion tie composites
- Peer-normalized Median / MAD Z-scores
"""

from typing import Dict, List, Optional, Set, Tuple
import networkx as nx
from networkx.algorithms.community import louvain_communities
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import RobustScaler

from app.ml.models.graph.config import GraphModelConfig


class GraphPreprocessor(BaseEstimator, TransformerMixin):
    """Preprocessor for heterogeneous graph and entity relationship anomaly detection."""

    def __init__(self, config: Optional[GraphModelConfig] = None):
        self.config = config or GraphModelConfig()
        self.scaler = RobustScaler()
        self.feature_names_: List[str] = []
        self.peer_stats_: Dict[str, Dict[Tuple, Dict[str, float]]] = {}
        self.global_stats_: Dict[str, Dict[str, float]] = {}
        self.project_community_map_: Dict[str, int] = {}
        self.community_sizes_: Dict[int, int] = {}
        self.is_fitted: bool = False

    def _build_graph(self, df: pd.DataFrame) -> nx.Graph:
        """Construct heterogeneous multi-entity graph in NetworkX."""
        G = nx.Graph()

        # Add nodes and edges from master table
        for _, row in df.iterrows():
            pid = "proj_" + str(row["project_id"])
            cid = "cont_" + str(row["contractor_id"])
            aid = "ag_" + str(row["agency_id"])
            conid = "const_" + str(row["constituency_id"])
            did = "dist_" + str(row["district_id"])

            G.add_edge(pid, cid, relation="AWARDED_TO")
            G.add_edge(pid, aid, relation="IMPLEMENTED_BY")
            G.add_edge(pid, conid, relation="LOCATED_IN")
            G.add_edge(conid, did, relation="IN_DISTRICT")

            # Add corporate collusion edges between contractors if shared ties exist
            has_ties = (
                row.get("contractor__shared_ownership", 0.0) > 0 or
                row.get("contractor__shared_directors", 0.0) > 0 or
                row.get("contractor__shared_address", 0.0) > 0 or
                row.get("contractor__beneficial_owner_overlap", 0.0) > 0
            )
            if has_ties:
                # Contractor connected to dummy collusion nexus
                nexus_id = f"ties_nexus_{row.get('district_id', 'global')}"
                G.add_edge(cid, nexus_id, relation="SHARED_TIES")

        return G

    def _compute_peer_mad_stats(
        self,
        df: pd.DataFrame,
        cols_to_normalize: List[str],
    ) -> None:
        """Calculate robust Median and MAD by peer group during training."""
        group_cols = self.config.peer_group_cols

        for col in cols_to_normalize:
            valid_vals = df[col].dropna()
            global_med = float(valid_vals.median()) if len(valid_vals) > 0 else 0.0
            global_mad = float((valid_vals - global_med).abs().median()) if len(valid_vals) > 0 else 1.0
            if global_mad < 1e-6:
                global_mad = 1.0
            self.global_stats_[col] = {"median": global_med, "mad": global_mad}

            self.peer_stats_[col] = {}
            if all(g in df.columns for g in group_cols):
                grouped = df.groupby(group_cols)[col]
                medians = grouped.median()
                
                for group_key, med_val in medians.items():
                    group_data = df.loc[
                        (df[group_cols[0]] == group_key[0]) & 
                        (df[group_cols[1]] == group_key[1]),
                        col
                    ].dropna()
                    mad_val = float((group_data - med_val).abs().median()) if len(group_data) > 0 else global_mad
                    if mad_val < 1e-6:
                        mad_val = global_mad
                    self.peer_stats_[col][group_key] = {"median": float(med_val), "mad": mad_val}

    def _apply_peer_mad_z(
        self,
        df: pd.DataFrame,
        col: str,
    ) -> pd.Series:
        """Apply fitted Median and MAD normalizations to produce robust Z-scores."""
        group_cols = self.config.peer_group_cols
        global_med = self.global_stats_[col]["median"]
        global_mad = self.global_stats_[col]["mad"]
        vals = df[col].fillna(global_med).to_numpy()
        z_scores = np.zeros(len(df), dtype=float)

        if all(g in df.columns for g in group_cols):
            keys = list(zip(df[group_cols[0]], df[group_cols[1]]))
            for i, k in enumerate(keys):
                stat = self.peer_stats_[col].get(k)
                if stat:
                    med, mad = stat["median"], stat["mad"]
                else:
                    med, mad = global_med, global_mad
                z_scores[i] = (vals[i] - med) / (1.4826 * mad + 1e-6)
        else:
            z_scores = (vals - global_med) / (1.4826 * global_mad + 1e-6)

        return pd.Series(np.clip(z_scores, -10.0, 10.0), index=df.index)

    def _engineer_graph_features(self, df: pd.DataFrame, G: nx.Graph) -> pd.DataFrame:
        """Extract graph structural and topological metrics per project."""
        df_out = pd.DataFrame(index=df.index)

        # 1. Degree centralities
        degrees = dict(G.degree())
        df_out["graph__contractor_degree"] = [
            degrees.get("cont_" + str(cid), 0) for cid in df["contractor_id"]
        ]
        df_out["graph__agency_degree"] = [
            degrees.get("ag_" + str(aid), 0) for aid in df["agency_id"]
        ]
        df_out["graph__constituency_degree"] = [
            degrees.get("const_" + str(conid), 0) for conid in df["constituency_id"]
        ]

        # 2. PageRank
        pr = nx.pagerank(
            G,
            alpha=self.config.pagerank_alpha,
            max_iter=self.config.pagerank_max_iter,
        )
        df_out["graph__contractor_pagerank"] = [
            pr.get("cont_" + str(cid), 0.0) for cid in df["contractor_id"]
        ]
        df_out["graph__agency_pagerank"] = [
            pr.get("ag_" + str(aid), 0.0) for aid in df["agency_id"]
        ]

        # 3. Bipartite (contractor-agency) and Tripartite (constituency-agency-contractor) co-occurrence
        pair_counts = df.groupby(["contractor_id", "agency_id"])["project_id"].transform("count")
        triad_counts = df.groupby(["constituency_id", "agency_id", "contractor_id"])["project_id"].transform("count")
        df_out["graph__pair_project_count"] = pair_counts
        df_out["graph__triad_project_count"] = triad_counts

        # 4. Agency Capture HHI (Herfindahl-Hirschman Index of agency awards to contractors)
        def _calc_hhi(group):
            shares = group.value_counts(normalize=True)
            return float((shares ** 2).sum())

        agency_hhi_map = df.groupby("agency_id")["contractor_id"].apply(_calc_hhi).to_dict()
        df_out["graph__agency_contractor_hhi"] = df["agency_id"].map(agency_hhi_map).fillna(0.0)

        # 5. Contractor Constituency HHI
        cont_hhi_map = df.groupby("contractor_id")["constituency_id"].apply(_calc_hhi).to_dict()
        df_out["graph__contractor_constituency_hhi"] = df["contractor_id"].map(cont_hhi_map).fillna(0.0)

        # 6. Corporate Ties Composite
        ties = (
            df.get("contractor__shared_ownership", pd.Series(0.0, index=df.index)).fillna(0.0) +
            df.get("contractor__shared_directors", pd.Series(0.0, index=df.index)).fillna(0.0) +
            df.get("contractor__shared_shareholders", pd.Series(0.0, index=df.index)).fillna(0.0) +
            df.get("contractor__shared_address", pd.Series(0.0, index=df.index)).fillna(0.0) +
            df.get("contractor__beneficial_owner_overlap", pd.Series(0.0, index=df.index)).fillna(0.0)
        )
        df_out["graph__corporate_ties_composite"] = ties

        # 7. Louvain Community Detection
        if not self.is_fitted:
            comms = louvain_communities(G, seed=self.config.louvain_seed)
            self.project_community_map_ = {}
            self.community_sizes_ = {}
            for cid, comm in enumerate(comms):
                self.community_sizes_[cid] = len(comm)
                for node in comm:
                    if node.startswith("proj_"):
                        proj_id = node.replace("proj_", "")
                        self.project_community_map_[proj_id] = cid

        df_out["graph__community_size"] = [
            self.community_sizes_.get(self.project_community_map_.get(str(pid), -1), 0)
            for pid in df["project_id"]
        ]

        # 8. Peer Z-score for pair count
        if self.is_fitted:
            df_out["graph__peer_pair_count_z"] = self._apply_peer_mad_z(
                df_out, "graph__pair_project_count"
            )

        return df_out

    def fit(self, X: pd.DataFrame, y=None):
        """Fit preprocessor: build graph, compute metrics, peer MAD stats, and fit scaler."""
        # 1. Build graph
        G = self._build_graph(X)

        # 2. Extract engineered graph metrics
        eng_df = self._engineer_graph_features(X, G)

        # 3. Compute peer statistics on pair counts
        self._compute_peer_mad_stats(
            pd.concat([X[self.config.peer_group_cols], eng_df[["graph__pair_project_count"]]], axis=1),
            ["graph__pair_project_count"],
        )
        eng_df["graph__peer_pair_count_z"] = self._apply_peer_mad_z(
            eng_df, "graph__pair_project_count"
        )

        # 4. Extract base features from master table
        selected_base = [c for c in self.config.base_relationship_features if c in X.columns]
        base_df = X[selected_base].copy().fillna(0.0)

        combined = pd.concat([base_df, eng_df], axis=1)
        self.feature_names_ = list(combined.columns)

        # 5. Fit robust scaler
        self.scaler.fit(combined.to_numpy())
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transform dataframe into scaled graph feature matrix."""
        if not self.is_fitted:
            raise RuntimeError("GraphPreprocessor must be fitted before calling transform().")

        G = self._build_graph(X)
        eng_df = self._engineer_graph_features(X, G)

        selected_base = [c for c in self.config.base_relationship_features if c in X.columns]
        base_df = X[selected_base].copy().fillna(0.0)

        combined = pd.concat([base_df, eng_df], axis=1)

        for col in self.feature_names_:
            if col not in combined.columns:
                combined[col] = 0.0
        combined = combined[self.feature_names_]

        return self.scaler.transform(combined.to_numpy())

    def get_feature_names(self) -> List[str]:
        """Return list of transformed feature names."""
        return list(self.feature_names_)

    def get_community_id(self, project_id: str) -> int:
        """Return Louvain community ID for given project."""
        return self.project_community_map_.get(str(project_id), 0)
