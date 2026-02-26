
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

subdomains_by_domain = {}

for f_name in files:
    f_path = os.path.join(docs_dir, f_name)
    if not os.path.exists(f_path):
        print(f"File not found: {f_name}")
        continue
    
    try:
        df = pd.read_csv(f_path, encoding='latin1') # Use latin1 to avoid encoding errors
        for _, row in df.iterrows():
            domain = str(row.get('Domain', '')).strip()
            subdomain = str(row.get('SubDomain', row.get('Subdomain', ''))).strip()
            if domain and subdomain:
                if domain not in subdomains_by_domain:
                    subdomains_by_domain[domain] = set()
                subdomains_by_domain[domain].add(subdomain)
    except Exception as e:
        print(f"Error processing {f_name}: {e}")

for domain, subdomains in subdomains_by_domain.items():
    print(f"\nDomain: {domain}")
    for s in sorted(subdomains):
        print(f"  - {s}")
