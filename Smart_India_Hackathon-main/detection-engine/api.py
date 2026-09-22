"""
MPLADS Detection Engine — API wrapper
----------------------------------------
Wraps detection_engine.py as a small FastAPI service so the rest of
the team can call it over HTTP instead of running the script locally.

Endpoints:
  GET  /                  -> health check
  POST /detect             -> upload a CSV, get back JSON flags
  GET  /detect/demo        -> runs on built-in synthetic data (no upload needed)

Run locally:
    uvicorn api:app --reload

Deploy: see README_DEPLOY.md
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io

from detection_engine import (
    make_synthetic_data,
    adapt_dataframe,
    check_sc_st_allocation,
    check_timeline_rules,
    check_ineligible_categories,
    check_cost_outliers,
    REQUIRED_COLUMNS,
)

app = FastAPI(
    title="MPLADS Detection Engine API",
    description="Financial anomaly + SC/ST compliance + timeline + ineligible-category detection for MPLADS projects.",
    version="2.0",
)

# Allow the dashboard (or anyone) to call this from a browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_all_checks(df: pd.DataFrame):
    df = adapt_dataframe(df)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Dataset missing required columns: {sorted(missing)}")

    has_beneficiary = "beneficiary_group" in df.columns
    sc_st_flags = check_sc_st_allocation(df) if has_beneficiary else []
    timeline_flags = check_timeline_rules(df)
    ineligible_flags = check_ineligible_categories(df)
    financial_flags = check_cost_outliers(df)

    all_flags = sc_st_flags + timeline_flags + ineligible_flags + financial_flags

    return {
        "projects_scanned": len(df),
        "flag_counts": {
            "sc_st_compliance": len(sc_st_flags),
            "timeline": len(timeline_flags),
            "ineligible_category": len(ineligible_flags),
            "financial_outlier": len(financial_flags),
        },
        "total_flags": len(all_flags),
        "flags": all_flags,
    }


@app.get("/")
def health_check():
    return {"status": "ok", "service": "MPLADS Detection Engine API"}


@app.get("/detect/demo")
def detect_demo():
    """Runs detection on built-in synthetic data — no file upload needed. Good for a quick live demo."""
    df = make_synthetic_data()
    return JSONResponse(content=run_all_checks(df))


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """
    Upload a project dataset CSV (either Jyothi's real format or the
    internal schema) and get back structured flags as JSON.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    return JSONResponse(content=run_all_checks(df))
