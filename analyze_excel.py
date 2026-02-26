
import pandas as pd
import os

files = [
    "POD360_Refined_All_Stakeholders.xlsx",
    "2_POD360_Executive_TownHall_ADKAR_v5.xlsx",
    "3_POD360_ADKAR_OCM_By_Score_FINAL.xlsx"
]

for f in files:
    print(f"\n--- Analyzing {f} ---")
    try:
        xl = pd.ExcelFile(f)
        print(f"Sheets: {xl.sheet_names}")
        for sheet in xl.sheet_names:
            df = pd.read_excel(f, sheet_name=sheet)
            print(f"  Sheet '{sheet}': {len(df)} rows, columns: {list(df.columns)}")
    except Exception as e:
        print(f"Error reading {f}: {e}")
