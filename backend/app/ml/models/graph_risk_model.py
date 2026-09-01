import networkx as np_nx
import networkx as nx
import pandas as pd
import numpy as np

class MPIDAGraphRiskModel:
    def __init__(self):
        self.graph = nx.Graph()
        self.mp_risk_scores = {}
        self.ida_risk_scores = {}
        self.edge_risk_scores = {}

    def fit_from_dataframe(self, df: pd.DataFrame):
        self.graph = nx.Graph()
        
        # Aggregate MP -> IDA edges
        edges = df.groupby(["MP_NAME", "IDA"]).agg(
            work_count=("ALLOCATION_AMOUNT", "count"),
            total_amount=("ALLOCATION_AMOUNT", "sum"),
            avg_amount=("ALLOCATION_AMOUNT", "mean")
        ).reset_index()

        mp_totals = df.groupby("MP_NAME")["ALLOCATION_AMOUNT"].sum().to_dict()
        mp_work_totals = df.groupby("MP_NAME")["ALLOCATION_AMOUNT"].count().to_dict()
        ida_totals = df.groupby("IDA")["ALLOCATION_AMOUNT"].sum().to_dict()
        ida_work_totals = df.groupby("IDA")["ALLOCATION_AMOUNT"].count().to_dict()

        for _, row in edges.iterrows():
            mp = f"MP_{row['MP_NAME']}"
            ida = f"IDA_{row['IDA']}"
            w_count = int(row["work_count"])
            tot_amt = float(row["total_amount"])

            # MP node
            if not self.graph.has_node(mp):
                self.graph.add_node(
                    mp,
                    node_type="mp",
                    name=row["MP_NAME"],
                    total_amount=float(mp_totals.get(row["MP_NAME"], 0)),
                    total_works=int(mp_work_totals.get(row["MP_NAME"], 0))
                )

            # IDA node
            if not self.graph.has_node(ida):
                self.graph.add_node(
                    ida,
                    node_type="ida",
                    name=row["IDA"],
                    total_amount=float(ida_totals.get(row["IDA"], 0)),
                    total_works=int(ida_work_totals.get(row["IDA"], 0))
                )

            # Edge concentration metric
            mp_tot = mp_totals.get(row["MP_NAME"], 1.0)
            share = tot_amt / mp_tot if mp_tot > 0 else 0.0

            self.graph.add_edge(
                mp,
                ida,
                work_count=w_count,
                total_amount=tot_amt,
                share=float(share)
            )

        # Compute PageRank and Centralities
        try:
            pagerank = nx.pagerank(self.graph, weight="total_amount")
        except Exception:
            pagerank = {n: 0.01 for n in self.graph.nodes()}

        degree_cent = nx.degree_centrality(self.graph)

        # Assign risk scores
        for node in self.graph.nodes():
            n_data = self.graph.nodes[node]
            n_type = n_data.get("node_type", "unknown")
            deg = degree_cent.get(node, 0.0)
            pr = pagerank.get(node, 0.0)

            if n_type == "ida":
                # High risk if IDA receives high share from few MPs (vendor capture)
                neighbors = list(self.graph.neighbors(node))
                shares = [self.graph[node][nbr].get("share", 0.0) for nbr in neighbors]
                max_share = max(shares) if shares else 0.0
                risk = (max_share * 0.6) + (min(pr * 50, 0.4))
                self.ida_risk_scores[n_data["name"]] = float(np.clip(risk, 0.0, 1.0))
            else:
                # MP risk: if MP concentrates high percentage to 1 IDA
                neighbors = list(self.graph.neighbors(node))
                shares = [self.graph[node][nbr].get("share", 0.0) for nbr in neighbors]
                max_share = max(shares) if shares else 0.0
                risk = max_share * 0.8
                self.mp_risk_scores[n_data["name"]] = float(np.clip(risk, 0.0, 1.0))

        return self

    def get_ida_risk(self, ida_name: str) -> float:
        return self.ida_risk_scores.get(ida_name, 0.1)

    def get_mp_risk(self, mp_name: str) -> float:
        return self.mp_risk_scores.get(mp_name, 0.1)

    def get_network_graph_payload(self, max_nodes: int = 250, min_risk_only: bool = False) -> dict:
        """
        Returns JSON-friendly node/link list for react-force-graph in frontend.
        """
        nodes = []
        links = []

        # Sort nodes by total amount
        sorted_nodes = sorted(
            self.graph.nodes(data=True),
            key=lambda x: x[1].get("total_amount", 0),
            reverse=True
        )[:max_nodes]

        node_ids = set([n[0] for n in sorted_nodes])

        for n_id, data in sorted_nodes:
            n_type = data.get("node_type", "mp")
            raw_name = data.get("name", n_id)
            risk = self.mp_risk_scores.get(raw_name, 0.1) if n_type == "mp" else self.ida_risk_scores.get(raw_name, 0.1)
            
            nodes.append({
                "id": n_id,
                "name": raw_name,
                "type": n_type,
                "total_amount": data.get("total_amount", 0),
                "total_works": data.get("total_works", 0),
                "risk_score": round(risk * 100, 1),
                "val": max(5, np.log1p(data.get("total_amount", 100000)) * 1.5)
            })

        for u, v, data in self.graph.edges(data=True):
            if u in node_ids and v in node_ids:
                share = data.get("share", 0.0)
                links.append({
                    "source": u,
                    "target": v,
                    "work_count": data.get("work_count", 1),
                    "total_amount": data.get("total_amount", 0),
                    "share": round(share, 3),
                    "is_high_risk": share > 0.65,
                    "value": max(1, int(data.get("work_count", 1)))
                })

        return {"nodes": nodes, "links": links}
