from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.ml.models.model_registry import get_model_registry

def get_network_graph_data(
    db: Session,
    max_nodes: int = 150,
    min_risk: float = 0.0,
    state: Optional[str] = None,
    mp_name: Optional[str] = None
) -> Dict[str, Any]:
    registry = get_model_registry()
    payload = registry.graph_model.get_network_graph_payload(max_nodes=max_nodes)
    
    # Filter nodes if needed
    nodes = payload.get("nodes", [])
    links = payload.get("links", [])

    if min_risk > 0:
        filtered_nodes = [n for n in nodes if n.get("risk_score", 0) >= min_risk]
        node_ids = set([n["id"] for n in filtered_nodes])
        filtered_links = [l for l in links if l["source"] in node_ids and l["target"] in node_ids]
        return {"nodes": filtered_nodes, "links": filtered_links}

    return {"nodes": nodes, "links": links}
