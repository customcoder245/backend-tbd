
import pandas as pd
import os

docs_dir = r"C:\Users\ST\OneDrive\Documents"
files = [
    "POD360_Employee_QuestionSet_FINAL.xlsx - P_Employee_Questions.csv",
    "POD360_Employee_QuestionSet_FINAL.xlsx - O_Employee_Questions.csv",
    "POD360_Employee_QuestionSet_FINAL.xlsx - D_Employee_Questions.csv",
    "POD360_Manager_QuestionSet_Updated.xlsx - P_Manager_Questions.csv",
    "POD360_Manager_QuestionSet_Updated.xlsx - O_Manager_Questions.csv",
    "POD360_Manager_QuestionSet_Updated.xlsx - D_Manager_Questions.csv",
    "POD360_Senior_Leader_QuestionSet.xlsx - P_Senior Leader_Questions.csv",
    "POD360_Senior_Leader_QuestionSet.xlsx - O_Senior Leader_Questions.csv",
    "POD360_Senior_Leader_QuestionSet.xlsx - D_Senior Leader_Questions.csv"
]

total_lines_data = 0
for f_name in files:
    f_path = os.path.join(docs_dir, f_name)
    if os.path.exists(f_path):
        df = pd.read_csv(f_path, encoding='latin1')
        print(f"{f_name}: {len(df)} rows")
        total_lines_data += len(df)

print(f"Total rows in all files: {total_lines_data}")
