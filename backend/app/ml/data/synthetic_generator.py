"""
synthetic_generator.py

Generates a synthetic MPLADS works dataset in the same schema as the real
public dataset (github.com/Vonter/india-mplads-works), with two extra
ground-truth columns not present in real data: `is_fraud` and `fraud_type`.

Used ONLY for training/validating ML models. Never presented to end users
as real data — see section 2 above for the full train-on-synthetic /
apply-to-real data flow.

Usage:
    python synthetic_generator.py --n_rows 20000 --out synthetic_mplads.csv
"""

import argparse
import random
import string
import uuid
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Reference vocabularies (modeled on real dataset distributions)
# ---------------------------------------------------------------------------

STATES = [
    "Uttar Pradesh", "Maharashtra", "Bihar", "West Bengal", "Madhya Pradesh",
    "Tamil Nadu", "Rajasthan", "Karnataka", "Gujarat", "Andhra Pradesh",
    "Odisha", "Telangana", "Kerala", "Jharkhand", "Assam", "Punjab",
    "Chhattisgarh", "Haryana", "Delhi", "Uttarakhand",
]

WORK_TYPES = [
    "installation of street lights",
    "construction of community hall",
    "repair of internal roads",
    "installation of hand pumps and borewells",
    "construction of drainage system",
    "renovation of government school building",
    "installation of solar street lights",
    "construction of public toilet complex",
    "repair and renovation of anganwadi center",
    "installation of RO water purification unit",
    "construction of boundary wall for school",
    "development of public park",
    "construction of cremation ground shed",
    "repair of drinking water supply pipeline",
    "installation of CCTV surveillance system",
]

# Rough fair-price ranges per work type (INR), used to generate realistic
# "normal" allocations and to inflate for the overpricing fraud type.
WORK_TYPE_FAIR_PRICE = {
    "installation of street lights": (80_000, 300_000),
    "construction of community hall": (1_500_000, 4_000_000),
    "repair of internal roads": (500_000, 2_500_000),
    "installation of hand pumps and borewells": (60_000, 200_000),
    "construction of drainage system": (400_000, 1_800_000),
    "renovation of government school building": (600_000, 2_200_000),
    "installation of solar street lights": (150_000, 500_000),
    "construction of public toilet complex": (300_000, 900_000),
    "repair and renovation of anganwadi center": (200_000, 700_000),
    "installation of RO water purification unit": (100_000, 350_000),
    "construction of boundary wall for school": (250_000, 900_000),
    "development of public park": (500_000, 2_000_000),
    "construction of cremation ground shed": (200_000, 600_000),
    "repair of drinking water supply pipeline": (300_000, 1_200_000),
    "installation of CCTV surveillance system": (150_000, 600_000),
}

STATUSES = ["Unsanctioned", "Sanctioned", "Ongoing", "Completed"]
STATUS_WEIGHTS = [0.60, 0.20, 0.10, 0.10]
IDA_APPROVALS = ["Action Pending", "Approved by IDA", "Rejected by IDA"]
IDA_APPROVAL_WEIGHTS = [0.55, 0.40, 0.05]
HOUSES = ["Lok Sabha", "Rajya Sabha"]

FRAUD_TYPES = ["overpricing", "duplicate", "ghost_project", "vendor_capture", "structuring"]
FRAUD_RATES = {
    "overpricing": 0.04,
    "duplicate": 0.03,
    "ghost_project": 0.03,
    "vendor_capture": 0.025,
    "structuring": 0.025,
}
# Total fraud rate ~= 0.155 -> remaining ~0.845 normal


def _random_name(prefix: str, n: int) -> list:
    return [f"{prefix} {i:04d}" for i in range(n)]


def _random_date(start: datetime, end: datetime) -> datetime:
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))


class SyntheticMPLADSGenerator:
    def __init__(self, n_rows: int = 20000, n_mps: int = 300, n_idas: int = 400, seed: int = 42):
        self.n_rows = n_rows
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)

        self.mps = _random_name("MP", n_mps)
        self.idas = _random_name("IDA", n_idas)
        self.mp_state = {mp: random.choice(STATES) for mp in self.mps}
        self.mp_constituency = {mp: f"{self.mp_state[mp]} Constituency {i}" for i, mp in enumerate(self.mps)}
        self.date_start = datetime(2023, 4, 1)
        self.date_end = datetime(2024, 3, 31)

        # Pick a small set of IDAs to be "captured" vendors (used for vendor_capture fraud)
        self.captured_idas = random.sample(self.idas, k=max(5, n_idas // 40))

    # ------------------------------------------------------------------
    # Row generators per type
    # ------------------------------------------------------------------

    def _base_row(self) -> dict:
        mp = random.choice(self.mps)
        state = self.mp_state[mp]
        work_type = random.choice(WORK_TYPES)
        low, high = WORK_TYPE_FAIR_PRICE[work_type]
        amount = int(np.random.uniform(low, high))
        ida = random.choice(self.idas)
        status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
        approval = random.choices(IDA_APPROVALS, weights=IDA_APPROVAL_WEIGHTS)[0]

        return {
            "MP_NAME": mp,
            "WORK": f"NA - {work_type}",
            "CATEGORY": "Normal/Others",
            "STATE": state,
            "CONSTITUENCY": self.mp_constituency[mp],
            "IDA": ida,
            "CITY": "",
            "WARD": f"Ward {random.randint(1, 30)}" if random.random() < 0.3 else "",
            "BLOCK": f"Block {random.randint(1, 15)}" if random.random() < 0.5 else "",
            "VILLAGE": f"Village {random.randint(1, 100)}" if random.random() < 0.4 else "",
            "RECOMMENDED_DATE": _random_date(self.date_start, self.date_end).strftime("%Y-%m-%d"),
            "ALLOCATION_AMOUNT": amount,
            "IDA_APPROVAL": approval,
            "STATUS": status,
            "HOUSE": random.choices(HOUSES, weights=[0.75, 0.25])[0],
            "_work_type": work_type,
            "is_fraud": 0,
            "fraud_type": None,
        }

    def _make_overpricing(self) -> dict:
        row = self._base_row()
        low, high = WORK_TYPE_FAIR_PRICE[row["_work_type"]]
        multiplier = np.random.uniform(2.5, 5.0)
        row["ALLOCATION_AMOUNT"] = int(high * multiplier)
        row["is_fraud"] = 1
        row["fraud_type"] = "overpricing"
        return row

    def _make_duplicate_pair(self) -> list:
        """Returns 2-4 near-identical rows (same MP/IDA/amount/work, or reworded work text)."""
        base = self._base_row()
        n_dupes = random.randint(2, 4)
        rows = []
        for i in range(n_dupes):
            r = dict(base)
            if random.random() < 0.5:
                # exact duplicate
                r["WORK"] = base["WORK"]
            else:
                # reworded near-duplicate
                r["WORK"] = base["WORK"].replace(" - ", " – ") + f" (Phase {i+1})"
            r["RECOMMENDED_DATE"] = _random_date(self.date_start, self.date_end).strftime("%Y-%m-%d")
            r["is_fraud"] = 1
            r["fraud_type"] = "duplicate"
            rows.append(r)
        return rows

    def _make_ghost_project(self) -> dict:
        row = self._base_row()
        # Sanctioned or ongoing long ago, but never progresses -> old recommended date, stuck status
        old_date = _random_date(self.date_start, self.date_start + timedelta(days=60))
        row["RECOMMENDED_DATE"] = old_date.strftime("%Y-%m-%d")
        row["STATUS"] = random.choice(["Sanctioned", "Ongoing"])
        row["IDA_APPROVAL"] = "Approved by IDA"
        row["is_fraud"] = 1
        row["fraud_type"] = "ghost_project"
        return row

    def _make_vendor_capture(self) -> dict:
        row = self._base_row()
        row["IDA"] = random.choice(self.captured_idas)
        row["is_fraud"] = 1
        row["fraud_type"] = "vendor_capture"
        return row

    def _make_structuring(self) -> dict:
        row = self._base_row()
        # Cluster amount just under common approval thresholds
        threshold = random.choice([500_000, 1_000_000, 2_500_000])
        row["ALLOCATION_AMOUNT"] = int(threshold * np.random.uniform(0.95, 0.995))
        row["is_fraud"] = 1
        row["fraud_type"] = "structuring"
        return row

    # ------------------------------------------------------------------
    # Main generation loop
    # ------------------------------------------------------------------

    def generate(self) -> pd.DataFrame:
        rows = []
        n_normal = int(self.n_rows * (1 - sum(FRAUD_RATES.values())))
        n_overpricing = int(self.n_rows * FRAUD_RATES["overpricing"])
        n_duplicate_groups = int(self.n_rows * FRAUD_RATES["duplicate"] / 3)  # ~3 rows per group
        n_ghost = int(self.n_rows * FRAUD_RATES["ghost_project"])
        n_vendor_capture = int(self.n_rows * FRAUD_RATES["vendor_capture"])
        n_structuring = int(self.n_rows * FRAUD_RATES["structuring"])

        for _ in range(n_normal):
            rows.append(self._base_row())
        for _ in range(n_overpricing):
            rows.append(self._make_overpricing())
        for _ in range(n_duplicate_groups):
            rows.extend(self._make_duplicate_pair())
        for _ in range(n_ghost):
            rows.append(self._make_ghost_project())
        for _ in range(n_vendor_capture):
            rows.append(self._make_vendor_capture())
        for _ in range(n_structuring):
            rows.append(self._make_structuring())

        random.shuffle(rows)
        df = pd.DataFrame(rows)
        if "_work_type" in df.columns:
            df.drop(columns=["_work_type"], inplace=True)
        df.insert(0, "WORK_ID", [str(uuid.uuid4())[:8] for _ in range(len(df))])
        return df


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic labeled MPLADS dataset")
    parser.add_argument("--n_rows", type=int, default=20000, help="Approx. number of base rows to generate")
    parser.add_argument("--n_mps", type=int, default=300)
    parser.add_argument("--n_idas", type=int, default=400)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=str, default="synthetic_mplads.csv")
    args = parser.parse_args()

    gen = SyntheticMPLADSGenerator(n_rows=args.n_rows, n_mps=args.n_mps, n_idas=args.n_idas, seed=args.seed)
    df = gen.generate()
    df.to_csv(args.out, index=False)

    print(f"Generated {len(df)} rows -> {args.out}")
    print(f"Fraud rate: {df['is_fraud'].mean():.3f}")
    print(df["fraud_type"].value_counts(dropna=False))


if __name__ == "__main__":
    main()
