"""
MPLADS Detection Engine v2 — Financial Anomalies & Compliance
----------------------------------------------------------------
Part: Detection Engine (Financial Anomalies)
Owner: Bhargava BM
Built against: SIH26102_Architecture_Rules_Roadmap.pdf (Shreya, v1.0, 29 Aug 2026)

Implements from the architecture doc:
  - Section 4.1  SC/ST Allocation           -> rules SC_001, ST_001
  - Section 4.2  Timeline Rules              -> rules TIME-01, TIME-02, TIME-03
  - Section 4.3  Ineligible/Prohibited-Use   -> rules INC-01 .. INC-10
  - Section 5.2  Financial anomaly (cost)    -> rule FIN-001 (z-score / IQR, our own addition)
  - Section 4.4  Rule-Engine Output Contract -> every flag has all 10 required fields

Input:  a CSV matching the Minimum Project Data Contract (section 3.1):
    project_id, mp_id, constituency, state, district, project_description,
    project_category, sanctioned_amount, released_amount, expenditure,
    recommendation_date, sanction_date, expected_completion_date,
    actual_completion_date, status, implementing_agency,
    beneficiary_group (SC/ST/General — needed for SC_001/ST_001; not in the
    official minimum contract but required until a better source field exists
    — confirm with Data team),
    mp_demit_date (needed for TIME-03; optional, only checked if present)

Output: flags.csv — one row per triggered rule, in the exact Output Contract
    shape from section 4.4:
    rule_id, project_id, triggered, severity, observed_value, threshold,
    exception_applied, explanation, source_version, timestamp

Run:
    python detection_engine.py --input clean_dataset.csv --output flags.csv
    python detection_engine.py                # runs on synthetic demo data
"""

import argparse
from datetime import datetime, timezone

import numpy as np
import pandas as pd

SOURCE_VERSION = "SIH26102_Architecture_Rules_Roadmap_v1.0_2026-08-29"


# ---------------------------------------------------------------------
# 0. SYNTHETIC PLACEHOLDER DATA (used only if no real dataset is passed)
# ---------------------------------------------------------------------
def make_synthetic_data(n=120, seed=42):
    rng = np.random.default_rng(seed)
    categories = {
        "Roads": 1_200_000,
        "Health": 800_000,
        "Education": 600_000,
        "Sanitation": 400_000,
        "Electrification": 300_000,
    }
    districts = ["Amritsar", "Ludhiana", "Varanasi", "Lucknow", "Rajkot", "Surat", "Nagpur", "Bhopal"]
    states = {"Amritsar": "Punjab", "Ludhiana": "Punjab", "Varanasi": "Uttar Pradesh",
              "Lucknow": "Uttar Pradesh", "Rajkot": "Gujarat", "Surat": "Gujarat",
              "Nagpur": "Maharashtra", "Bhopal": "Madhya Pradesh"}
    mps = [f"MP{i}" for i in range(1, 9)]
    beneficiary_groups = ["General", "SC", "ST"]
    agencies = [f"Agency-{c}" for c in "ABCDE"]

    base_date = pd.Timestamp("2024-01-01")
    rows = []
    for i in range(n):
        cat = rng.choice(list(categories.keys()))
        base_cost = categories[cat]
        if rng.random() < 0.08:
            cost = base_cost * rng.uniform(3.5, 7)
        else:
            cost = base_cost * rng.normal(1.0, 0.18)
        cost = max(cost, 50_000)

        district = rng.choice(districts)
        rec_date = base_date + pd.Timedelta(days=int(rng.integers(0, 500)))
        sanction_delay_days = int(rng.integers(5, 40)) if rng.random() > 0.1 else int(rng.integers(46, 120))
        sanction_date = rec_date + pd.Timedelta(days=sanction_delay_days)
        expected_completion = sanction_date + pd.Timedelta(days=365)
        status = rng.choice(["Completed", "In Progress", "Stalled"], p=[0.55, 0.30, 0.15])
        if status == "Completed":
            actual_completion = expected_completion + pd.Timedelta(days=int(rng.integers(-60, 90)))
        else:
            actual_completion = pd.NaT

        released = cost * rng.uniform(0.8, 1.0)
        expenditure = released * rng.uniform(0.0, 1.0) if status != "Completed" else released * rng.uniform(0.85, 1.0)

        rows.append({
            "project_id": f"P{1000 + i}",
            "mp_id": rng.choice(mps),
            "constituency": f"{district} Constituency",
            "state": states[district],
            "district": district,
            "project_description": f"{cat} work number {i}",
            "project_category": cat,
            "sanctioned_amount": round(cost, 2),
            "released_amount": round(released, 2),
            "expenditure": round(expenditure, 2),
            "recommendation_date": rec_date,
            "sanction_date": sanction_date,
            "expected_completion_date": expected_completion,
            "actual_completion_date": actual_completion,
            "status": status,
            "implementing_agency": rng.choice(agencies),
            "beneficiary_group": rng.choice(beneficiary_groups, p=[0.65, 0.20, 0.15]),
        })

    df = pd.DataFrame(rows)
    df.loc[df.index[0], "project_description"] = "Temple renovation and repainting work"
    df.loc[df.index[1], "project_description"] = "Routine maintenance of community hall"
    df.loc[df.index[2], "project_description"] = "Purchase of land for future project use"
    return df


# ---------------------------------------------------------------------
# 0b. ADAPTER — maps Jyothi's actual delivered CSV format to our
#     internal schema. Her columns differ from the doc's minimum
#     contract (different names, no recommendation_date/expenditure
#     column). This adapter is the ONLY place that needs updating if
#     her format changes again — the rule functions below never see
#     her raw column names.
# ---------------------------------------------------------------------
JYOTHI_COLUMN_MAP = {
    "Project ID": "project_id",
    "MP Name": "mp_id",
    "State": "state",
    "District": "district",
    "Project Name": "project_description",
    "Category": "project_category",
    "Cost (INR)": "sanctioned_amount",
    "Funds Released (INR)": "released_amount",
    "Sanction Date": "sanction_date",
    "Completion Status": "status",
    "Implementing Agency": "implementing_agency",
    "Vendor Name": "vendor_name",
    "Target Beneficiary": "beneficiary_raw",
    "Latitude": "latitude",
    "Longitude": "longitude",
}

BENEFICIARY_MAP = {
    "Scheduled Caste (SC)": "SC",
    "Scheduled Tribe (ST)": "ST",
    "General": "General",
}

STATUS_MAP = {
    "Completed": "Completed",
    "In Progress": "In Progress",
    "Sanctioned but not started": "In Progress",
}


def adapt_dataframe(df):
    """
    Detects Jyothi's delivered format (by checking for a known column
    name) and converts it to our internal schema. If the dataset
    already uses the internal schema (e.g. synthetic data, or a future
    delivery that matches the doc's contract exactly), it's passed
    through unchanged.
    """
    if "Project ID" not in df.columns:
        return df  # already in internal schema

    df = df.rename(columns=JYOTHI_COLUMN_MAP)

    df["beneficiary_group"] = df["beneficiary_raw"].map(BENEFICIARY_MAP).fillna("General")
    df["status"] = df["status"].map(STATUS_MAP).fillna(df["status"])

    df["sanction_date"] = pd.to_datetime(df["sanction_date"])
    # not delivered in this dataset — recommendation_date and
    # actual/expected completion dates are unknown, so TIME-01 (45-day
    # sanction delay) and TIME-02/03 completion-delay checks are
    # effectively skipped (no dates to compare against). Flag this gap
    # to Jyothi/Shreya rather than fabricating dates.
    df["recommendation_date"] = pd.NaT
    df["expected_completion_date"] = pd.NaT
    df["actual_completion_date"] = df["sanction_date"].where(df["status"] == "Completed", pd.NaT)

    # expenditure not delivered directly — approximate as
    # released_amount * physical completion %, since actual spend
    # tracking isn't in this dataset. This is a stand-in, not a real
    # financial figure — flag to Jyothi if a true expenditure field
    # exists elsewhere.
    if "Physical Completion (%)" in df.columns:
        df["expenditure"] = df["released_amount"] * (df["Physical Completion (%)"] / 100)
    else:
        df["expenditure"] = df["released_amount"]

    df["constituency"] = df["district"] + " Constituency"  # not delivered; best-effort placeholder

    return df



def make_flag(rule_id, project_id, severity, observed_value, threshold,
              exception_applied, explanation):
    return {
        "rule_id": rule_id,
        "project_id": project_id,
        "triggered": True,
        "severity": severity,
        "observed_value": observed_value,
        "threshold": threshold,
        "exception_applied": exception_applied,
        "explanation": explanation,
        "source_version": SOURCE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


# ---------------------------------------------------------------------
# 1. SC_001 / ST_001 — SC/ST Allocation (section 4.1)
# ---------------------------------------------------------------------
def check_sc_st_allocation(df, sc_threshold=0.15, st_threshold=0.075):
    """
    NOTE: "applicable_entitlement" and documented exceptions are not
    modeled — we use total sanctioned funds as a stand-in denominator
    and always report exception_applied=False. Doc explicitly warns:
    "database must capture the applicable exception/context before
    marking non-compliant" — this must be corrected once Data/
    Architecture confirm the real fields.
    """
    flags = []
    for mp_id, group in df.groupby("mp_id"):
        total = group["sanctioned_amount"].sum()
        sc_total = group.loc[group["beneficiary_group"] == "SC", "sanctioned_amount"].sum()
        st_total = group.loc[group["beneficiary_group"] == "ST", "sanctioned_amount"].sum()
        sc_pct = sc_total / total if total > 0 else 0
        st_pct = st_total / total if total > 0 else 0

        if sc_pct < sc_threshold:
            flags.append(make_flag(
                rule_id="SC_001", project_id=f"MP_YEAR:{mp_id}",
                severity="high", observed_value=round(sc_pct, 4),
                threshold=sc_threshold, exception_applied=False,
                explanation=(
                    f"SC allocation {sc_pct*100:.1f}% of sanctioned funds is below the "
                    f"15% threshold. No documented exception on file — needs manual "
                    f"exception check before treating as confirmed non-compliance."
                ),
            ))
        if st_pct < st_threshold:
            flags.append(make_flag(
                rule_id="ST_001", project_id=f"MP_YEAR:{mp_id}",
                severity="high", observed_value=round(st_pct, 4),
                threshold=st_threshold, exception_applied=False,
                explanation=(
                    f"ST allocation {st_pct*100:.1f}% of sanctioned funds is below the "
                    f"7.5% threshold. No documented exception on file — needs manual "
                    f"exception check before treating as confirmed non-compliance."
                ),
            ))
    return flags


# ---------------------------------------------------------------------
# 2. TIME-01 / TIME-02 / TIME-03 — Timeline Rules (section 4.2)
# ---------------------------------------------------------------------
def check_timeline_rules(df, today=None):
    today = pd.Timestamp(today or datetime.now(timezone.utc).date())
    flags = []

    for _, row in df.iterrows():
        pid = row["project_id"]

        # TIME-01: recommendation -> sanction/rejection exceeds 45 days
        if pd.notna(row.get("recommendation_date")) and pd.notna(row.get("sanction_date")):
            delay_days = (row["sanction_date"] - row["recommendation_date"]).days
            if delay_days > 45:
                flags.append(make_flag(
                    rule_id="TIME-01", project_id=pid, severity="medium",
                    observed_value=delay_days, threshold=45, exception_applied=False,
                    explanation=f"Sanction took {delay_days} days from recommendation (limit: 45 days).",
                ))

        # TIME-02: sanctioned work exceeds 1-year completion period, no justification on file
        if pd.notna(row.get("sanction_date")) and row["status"] != "Completed":
            reference_end = row.get("actual_completion_date")
            if pd.isna(reference_end):
                reference_end = today
            days_since_sanction = (reference_end - row["sanction_date"]).days
            if days_since_sanction > 365:
                flags.append(make_flag(
                    rule_id="TIME-02", project_id=pid, severity="medium",
                    observed_value=days_since_sanction, threshold=365, exception_applied=False,
                    explanation=(
                        f"{days_since_sanction} days since sanction, still '{row['status']}' "
                        f"(limit: 365 days, no documented justification on file)."
                    ),
                ))

        # TIME-03: duly sanctioned work incomplete beyond 18 months from MP's demitting office
        demit_date = row.get("mp_demit_date")
        if demit_date is not None and pd.notna(demit_date) and row["status"] != "Completed":
            days_since_demit = (today - demit_date).days
            if days_since_demit > 18 * 30:
                flags.append(make_flag(
                    rule_id="TIME-03", project_id=pid, severity="high",
                    observed_value=days_since_demit, threshold=18 * 30, exception_applied=False,
                    explanation=(
                        f"{days_since_demit} days since MP demitted office, project still "
                        f"'{row['status']}' (limit: 18 months)."
                    ),
                ))
    return flags


# ---------------------------------------------------------------------
# 3. INC-01..INC-10 — Ineligible / Prohibited-Use Checks (section 4.3)
# ---------------------------------------------------------------------
# The doc explicitly warns against relying only on free-text keyword
# matching, and asks for category/beneficiary/ownership/funding-source
# metadata instead. We don't have those structured fields yet, so this
# is a keyword-based STOPGAP for INC-01, 02, 03, 07, 09 only (the ones
# plausible to detect from a description string). INC-04, 05, 06, 08,
# 10 need structured financial/ownership fields not in the minimum
# contract — left as TODO, not implemented.
INELIGIBLE_KEYWORD_RULES = {
    "INC-01": {
        "keywords": ["routine maintenance", "repainting", "whitewash", "annual repair",
                     "recurring maintenance", "upkeep", "operation and maintenance", "o&m"],
        "label": "Operation/maintenance type work",
    },
    "INC-02": {
        "keywords": ["commercial complex", "private establishment", "shopping complex",
                     "private business", "commercial use"],
        "label": "Commercial/private-establishment type work",
    },
    "INC-03": {
        "keywords": ["land acquisition", "purchase of land", "acquiring land", "land purchase"],
        "label": "Land acquisition / acquisition-related expenditure",
    },
    "INC-07": {
        "keywords": ["temple", "mosque", "church", "gurudwara", "gurdwara", "shrine",
                     "religious", "idol", "worship"],
        "label": "Religious-use work",
    },
    "INC-09": {
        "keywords": ["personal residence", "private house", "individual benefit",
                     "personal use", "private property", "family benefit"],
        "label": "Individual/family-benefit asset",
    },
}


def check_ineligible_categories(df, text_col="project_description"):
    flags = []
    for _, row in df.iterrows():
        text = str(row.get(text_col, "")).lower()
        for rule_id, cfg in INELIGIBLE_KEYWORD_RULES.items():
            if any(kw in text for kw in cfg["keywords"]):
                flags.append(make_flag(
                    rule_id=rule_id, project_id=row["project_id"], severity="high",
                    observed_value=text_col, threshold="N/A (keyword match)",
                    exception_applied=False,
                    explanation=(
                        f"{cfg['label']} detected via keyword match on '{text_col}'. "
                        f"PROTOTYPE STOPGAP ONLY — spec requires category/ownership/"
                        f"funding-source metadata instead of free-text matching; "
                        f"treat as low-confidence until structured fields are available."
                    ),
                ))
    return flags


# ---------------------------------------------------------------------
# 4. FIN-001 — Financial cost-outlier (supports section 5.2
#    "category-level cost deviation"; not an explicit rule ID in the
#    doc's compliance table, kept as our own addition)
# ---------------------------------------------------------------------
def check_cost_outliers(df, z_threshold=2.5, category_col="project_category",
                         amount_col="sanctioned_amount"):
    flags = []
    for category, group in df.groupby(category_col):
        amounts = group[amount_col]
        median = amounts.median()
        mean = amounts.mean()
        std = amounts.std(ddof=0)
        q1, q3 = amounts.quantile(0.25), amounts.quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr

        for _, row in group.iterrows():
            amount = row[amount_col]
            z = (amount - mean) / std if std > 0 else 0
            is_z_outlier = abs(z) >= z_threshold
            is_iqr_outlier = amount < lower or amount > upper
            if is_z_outlier or is_iqr_outlier:
                multiple = amount / median if median > 0 else float("inf")
                methods = []
                if is_z_outlier:
                    methods.append(f"z-score {z:.1f}")
                if is_iqr_outlier:
                    methods.append("IQR bound exceeded")
                flags.append(make_flag(
                    rule_id="FIN-001", project_id=row["project_id"], severity="medium",
                    observed_value=round(amount, 2), threshold=round(median, 2),
                    exception_applied=False,
                    explanation=(
                        f"{amount_col} is {multiple:.1f}x the {category} category median "
                        f"(₹{median:,.0f}). Flagged by {', '.join(methods)}."
                    ),
                ))
    return flags


# ---------------------------------------------------------------------
# 5. MAIN
# ---------------------------------------------------------------------
REQUIRED_COLUMNS = {
    "project_id", "mp_id", "district", "project_description", "project_category",
    "sanctioned_amount", "expenditure", "status",
}


def run(input_path=None, output_path="flags.csv"):
    if input_path:
        df = pd.read_csv(input_path)
        df = adapt_dataframe(df)
    else:
        print("[!] No --input given — running on synthetic placeholder data.")
        df = make_synthetic_data()

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Input dataset is missing required columns: {missing}")

    has_beneficiary = "beneficiary_group" in df.columns
    sc_st_flags = check_sc_st_allocation(df) if has_beneficiary else []
    if not has_beneficiary:
        print("[!] 'beneficiary_group' column not found — skipping SC_001/ST_001 checks. "
              "Confirm with Data team how SC/ST beneficiary status is represented.")

    timeline_flags = check_timeline_rules(df)
    ineligible_flags = check_ineligible_categories(df)
    financial_flags = check_cost_outliers(df)

    all_flags = pd.DataFrame(sc_st_flags + timeline_flags + ineligible_flags + financial_flags)
    if not all_flags.empty:
        severity_order = {"high": 0, "medium": 1, "low": 2}
        all_flags["_sev_sort"] = all_flags["severity"].map(severity_order)
        all_flags = all_flags.sort_values(["_sev_sort", "rule_id"]).drop(columns="_sev_sort")

    all_flags.to_csv(output_path, index=False)

    print(f"Projects scanned: {len(df)}")
    print(f"SC_001/ST_001 flags: {len(sc_st_flags)}")
    print(f"TIME-01/02/03 flags: {len(timeline_flags)}")
    print(f"INC-xx flags: {len(ineligible_flags)}")
    print(f"FIN-001 flags: {len(financial_flags)}")
    print(f"Total flags written to {output_path}: {len(all_flags)}")

    return all_flags


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MPLADS Detection Engine v2")
    parser.add_argument("--input", type=str, default=None, help="Path to cleaned dataset CSV")
    parser.add_argument("--output", type=str, default="flags.csv", help="Path to write flags CSV")
    args = parser.parse_args()

    run(args.input, args.output)