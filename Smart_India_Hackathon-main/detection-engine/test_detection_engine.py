"""
Unit tests for MPLADS Detection Engine v2
-------------------------------------------
Per architecture doc section 11 (Testing & Validation):
  "Unit-test each compliance rule with positive, negative and
   exception cases. Test missing and malformed data before model
   execution."

Run:
    python test_detection_engine.py

No pytest dependency — plain assertions with clear pass/fail output,
so it's easy to run and read during a hackathon without extra setup.
"""

import pandas as pd
from detection_engine import (
    check_sc_st_allocation,
    check_timeline_rules,
    check_ineligible_categories,
    check_cost_outliers,
    adapt_dataframe,
)

PASS = 0
FAIL = 0


def check(name, condition):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name}")


def make_row(**overrides):
    base = {
        "project_id": "TEST-001",
        "mp_id": "MP-Test",
        "district": "TestDistrict",
        "project_description": "Generic public work",
        "project_category": "Roads",
        "sanctioned_amount": 1_000_000,
        "released_amount": 1_000_000,
        "expenditure": 500_000,
        "recommendation_date": pd.Timestamp("2024-01-01"),
        "sanction_date": pd.Timestamp("2024-01-15"),
        "expected_completion_date": pd.Timestamp("2025-01-15"),
        "actual_completion_date": pd.NaT,
        "status": "In Progress",
        "implementing_agency": "TestAgency",
        "beneficiary_group": "General",
    }
    base.update(overrides)
    return base


# =======================================================================
# TEST GROUP 1: SC_001 / ST_001 — SC/ST Allocation
# =======================================================================
print("\n=== SC_001 / ST_001 — SC/ST Allocation ===")

# POSITIVE: below threshold -> should flag
df_low_sc = pd.DataFrame([
    make_row(project_id="P1", mp_id="MP-A", sanctioned_amount=1_000_000, beneficiary_group="General"),
    make_row(project_id="P2", mp_id="MP-A", sanctioned_amount=100_000, beneficiary_group="SC"),  # ~9% SC
])
flags = check_sc_st_allocation(df_low_sc)
check("flags SC allocation below 15% threshold", any(f["rule_id"] == "SC_001" for f in flags))

# NEGATIVE: above threshold -> should NOT flag
df_ok_sc = pd.DataFrame([
    make_row(project_id="P1", mp_id="MP-B", sanctioned_amount=700_000, beneficiary_group="General"),
    make_row(project_id="P2", mp_id="MP-B", sanctioned_amount=200_000, beneficiary_group="SC"),   # 20% SC
    make_row(project_id="P3", mp_id="MP-B", sanctioned_amount=100_000, beneficiary_group="ST"),   # 10% ST
])
flags = check_sc_st_allocation(df_ok_sc)
check("does NOT flag when SC/ST allocation meets threshold", len(flags) == 0)

# EDGE: zero total funds for an MP -> should not crash, should not divide by zero
df_zero = pd.DataFrame([make_row(project_id="P1", mp_id="MP-C", sanctioned_amount=0, beneficiary_group="General")])
try:
    flags = check_sc_st_allocation(df_zero)
    check("handles zero-total MP funds without crashing", True)
except ZeroDivisionError:
    check("handles zero-total MP funds without crashing", False)


# =======================================================================
# TEST GROUP 2: TIME-01 / TIME-02 — Timeline Rules
# =======================================================================
print("\n=== TIME-01 / TIME-02 — Timeline Rules ===")

# POSITIVE: sanction delay > 45 days -> should flag TIME-01
df_late_sanction = pd.DataFrame([make_row(
    project_id="P1",
    recommendation_date=pd.Timestamp("2024-01-01"),
    sanction_date=pd.Timestamp("2024-03-01"),  # 60 days later
)])
flags = check_timeline_rules(df_late_sanction, today="2024-06-01")
check("flags TIME-01 when sanction exceeds 45 days", any(f["rule_id"] == "TIME-01" for f in flags))

# NEGATIVE: sanction within 45 days -> should NOT flag TIME-01
df_ontime_sanction = pd.DataFrame([make_row(
    project_id="P2",
    recommendation_date=pd.Timestamp("2024-01-01"),
    sanction_date=pd.Timestamp("2024-01-20"),  # 19 days later
)])
flags = check_timeline_rules(df_ontime_sanction, today="2024-06-01")
check("does NOT flag TIME-01 when sanction is within 45 days", not any(f["rule_id"] == "TIME-01" for f in flags))

# POSITIVE: incomplete beyond 1 year -> should flag TIME-02
df_overdue = pd.DataFrame([make_row(
    project_id="P3",
    sanction_date=pd.Timestamp("2023-01-01"),
    status="In Progress",
)])
flags = check_timeline_rules(df_overdue, today="2024-06-01")  # ~1.4 years since sanction
check("flags TIME-02 when incomplete beyond 1 year", any(f["rule_id"] == "TIME-02" for f in flags))

# EXCEPTION CASE: completed on time -> should NOT flag TIME-02
df_completed_ontime = pd.DataFrame([make_row(
    project_id="P4",
    sanction_date=pd.Timestamp("2023-01-01"),
    actual_completion_date=pd.Timestamp("2023-08-01"),
    status="Completed",
)])
flags = check_timeline_rules(df_completed_ontime, today="2024-06-01")
check("does NOT flag TIME-02 when completed within 1 year", not any(f["rule_id"] == "TIME-02" for f in flags))

# EDGE: missing dates -> should not crash
df_missing_dates = pd.DataFrame([make_row(
    project_id="P5", recommendation_date=pd.NaT, sanction_date=pd.NaT,
)])
try:
    flags = check_timeline_rules(df_missing_dates, today="2024-06-01")
    check("handles missing dates without crashing", True)
except Exception:
    check("handles missing dates without crashing", False)


# =======================================================================
# TEST GROUP 3: INC-xx — Ineligible Categories
# =======================================================================
print("\n=== INC-xx — Ineligible Categories ===")

# POSITIVE: religious keyword -> should flag INC-07
df_temple = pd.DataFrame([make_row(project_id="P1", project_description="Temple renovation work")])
flags = check_ineligible_categories(df_temple)
check("flags INC-07 for religious-use keyword", any(f["rule_id"] == "INC-07" for f in flags))

# POSITIVE: land acquisition -> should flag INC-03
df_land = pd.DataFrame([make_row(project_id="P2", project_description="Land acquisition for new school site")])
flags = check_ineligible_categories(df_land)
check("flags INC-03 for land acquisition keyword", any(f["rule_id"] == "INC-03" for f in flags))

# NEGATIVE: ordinary description -> should NOT flag
df_ordinary = pd.DataFrame([make_row(project_id="P3", project_description="Construction of a new road bridge")])
flags = check_ineligible_categories(df_ordinary)
check("does NOT flag an ordinary project description", len(flags) == 0)

# FALSE-POSITIVE RISK CASE: known limitation, documented here on purpose.
# "Templeton Road" contains "temple" as a substring and WILL false-positive
# with the current naive keyword matcher. This test documents the known
# gap rather than hiding it — matches the doc's explicit warning against
# relying only on free-text keyword matching.
df_false_positive = pd.DataFrame([make_row(project_id="P4", project_description="Templeton Road resurfacing")])
flags = check_ineligible_categories(df_false_positive)
check(
    "[KNOWN LIMITATION] 'Templeton Road' false-positives on INC-07 "
    "(documents the doc's warning against naive keyword matching)",
    any(f["rule_id"] == "INC-07" for f in flags),  # True = confirms the known gap exists
)


# =======================================================================
# TEST GROUP 4: FIN-001 — Cost Outliers
# =======================================================================
print("\n=== FIN-001 — Cost Outliers ===")

# POSITIVE: extreme outlier -> should flag
rows = [make_row(project_id=f"NORM{i}", project_category="Roads", sanctioned_amount=1_000_000 + i * 10_000) for i in range(10)]
rows.append(make_row(project_id="OUTLIER", project_category="Roads", sanctioned_amount=10_000_000))
df_outlier = pd.DataFrame(rows)
flags = check_cost_outliers(df_outlier)
check("flags an extreme cost outlier", any(f["project_id"] == "OUTLIER" for f in flags))

# NEGATIVE: tightly clustered costs -> should NOT flag any
rows = [make_row(project_id=f"NORM{i}", project_category="Health", sanctioned_amount=800_000 + i * 1_000) for i in range(15)]
df_tight = pd.DataFrame(rows)
flags = check_cost_outliers(df_tight)
check("does NOT flag when all costs are tightly clustered", len(flags) == 0)


# =======================================================================
# TEST GROUP 5: Adapter — Jyothi's real CSV format
# =======================================================================
print("\n=== adapt_dataframe() — real CSV column mapping ===")

df_jyothi_format = pd.DataFrame([{
    "Project ID": "MPLAD-TEST-0001",
    "State": "TestState",
    "District": "TestDistrict",
    "MP Name": "Test MP",
    "Project Name": "Test project description",
    "Category": "Roads, Pathways & Bridges",
    "Cost (INR)": 1_000_000,
    "Funds Released (INR)": 900_000,
    "Sanction Date": "2024-01-15",
    "Completion Status": "In Progress",
    "Physical Completion (%)": 50,
    "Implementing Agency": "TestAgency",
    "Vendor Name": "TestVendor",
    "Target Beneficiary": "Scheduled Caste (SC)",
    "Latitude": 20.0,
    "Longitude": 78.0,
}])
adapted = adapt_dataframe(df_jyothi_format)
check("adapter renames 'Project ID' -> 'project_id'", "project_id" in adapted.columns)
check("adapter maps beneficiary label 'Scheduled Caste (SC)' -> 'SC'", adapted.iloc[0]["beneficiary_group"] == "SC")
check("adapter maps status 'Sanctioned but not started' -> 'In Progress'"
      if False else "adapter passes through status correctly", adapted.iloc[0]["status"] == "In Progress")
check("adapter computes expenditure from released_amount x completion%",
      adapted.iloc[0]["expenditure"] == 900_000 * 0.5)


# =======================================================================
# SUMMARY
# =======================================================================
print(f"\n{'='*50}")
print(f"RESULTS: {PASS} passed, {FAIL} failed (out of {PASS + FAIL})")
print(f"{'='*50}")
if FAIL > 0:
    raise SystemExit(1)
