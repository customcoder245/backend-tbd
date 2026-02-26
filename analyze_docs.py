
import pandas as pd
import os

docs_dir = r"C:\Users\ST\OneDrive\Documents"
files = [
    "POD360_Employee_QuestionSet_FINAL.xlsx",
    "POD360_Manager_QuestionSet_Updated.xlsx",
    "POD360_Senior_Leader_QuestionSet.xlsx"
]

for f_name in files:
    f = os.path.join(docs_dir, f_name)
    if not os.path.exists(f):
        # Maybe names are slightly different or I should list dir first
        pass
    else:
        print(f"\n--- Analyzing {f_name} ---")
        try:
            xl = pd.ExcelFile(f)
            print(f"Sheets: {xl.sheet_names}")
            for sheet in xl.sheet_names:
                df = pd.read_excel(f, sheet_name=sheet)
                print(f"  Sheet '{sheet}': {len(df)} rows")
        except Exception as e:
            print(f"Error reading {f_name}: {e}")

# Also list everything in Documents just in case
print("\n--- Documents Content ---")
for item in os.listdir(docs_dir):
    print(item)
