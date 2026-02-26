
import pandas as pd
import json
import os

docs_dir = r"C:\Users\ST\OneDrive\Documents"
files_mapping = [
    {"stakeholder": "employee", "file": "POD360_Employee_QuestionSet_FINAL.xlsx - P_Employee_Questions.csv"},
    {"stakeholder": "employee", "file": "POD360_Employee_QuestionSet_FINAL.xlsx - O_Employee_Questions.csv"},
    {"stakeholder": "employee", "file": "POD360_Employee_QuestionSet_FINAL.xlsx - D_Employee_Questions.csv"},
    {"stakeholder": "manager", "file": "POD360_Manager_QuestionSet_Updated.xlsx - P_Manager_Questions.csv"},
    {"stakeholder": "manager", "file": "POD360_Manager_QuestionSet_Updated.xlsx - O_Manager_Questions.csv"},
    {"stakeholder": "manager", "file": "POD360_Manager_QuestionSet_Updated.xlsx - D_Manager_Questions.csv"},
    {"stakeholder": "leader", "file": "POD360_Senior_Leader_QuestionSet.xlsx - P_Senior Leader_Questions.csv"},
    {"stakeholder": "leader", "file": "POD360_Senior_Leader_QuestionSet.xlsx - O_Senior Leader_Questions.csv"},
    {"stakeholder": "leader", "file": "POD360_Senior_Leader_QuestionSet.xlsx - D_Senior Leader_Questions.csv"}
]

domain_weights = {
    "People Potential": 0.35,
    "Operational Steadiness": 0.25,
    "Digital Fluency": 0.20
}

def clean_scale(s):
    if not isinstance(s, str): return "SCALE_1_5"
    s = s.strip()
    if "1-5" in s: return "SCALE_1_5"
    if "Never" in s and "Always" in s: return "NEVER_ALWAYS"
    if "Forced" in s: return "FORCED_CHOICE"
    return "SCALE_1_5"

def clean_type(t):
    if not isinstance(t, str): return "Self-Rating"
    t = t.strip()
    if "Self" in t: return "Self-Rating"
    if "Calibration" in t: return "Calibration"
    if "Behavioural" in t: return "Behavioural"
    if "Forced" in t: return "Forced-Choice"
    return "Self-Rating"

output_questions = []

for entry in files_mapping:
    stakeholder = entry["stakeholder"]
    f_path = os.path.join(docs_dir, entry["file"])
    
    if not os.path.exists(f_path):
        print(f"Skipping {entry['file']}, path not found.")
        continue
    
    try:
        try:
            df = pd.read_csv(f_path, encoding='utf-8-sig')
        except:
            df = pd.read_csv(f_path, encoding='latin1')
            
        roles = [stakeholder]
        if stakeholder == "leader":
            roles.append("admin")
            
        for role in roles:
            for _, row in df.iterrows():
                domain = str(row.get('Domain', '')).strip()
                subdomain = str(row.get('SubDomain', row.get('Subdomain', ''))).strip()
                if not domain or domain == "nan": continue
                
                q_type = clean_type(row.get("QuestionType", "Self-Rating"))
                scale = clean_scale(row.get("Scale", "1-5"))
                q_stem = str(row.get("QuestionStem", "")).strip()
                insight = str(row.get("InsightPrompt", "")).strip() if pd.notna(row.get("InsightPrompt")) else ""
                
                # Create a unique code if missing or for duplication
                q_code = str(row.get("QuestionCode", "")).strip()
                if not q_code or role == "admin" or q_code == "nan":
                    # For admin, we want a distinct code if leader code is present
                    orig_code = q_code if q_code and q_code != "nan" else "Q"
                    q_code = f"{role.upper()}-{orig_code}-{domain[0]}{subdomain[0]}" # Added more uniqueness
                
                q_data = {
                    "stakeholder": role,
                    "domain": domain,
                    "subdomain": subdomain,
                    "questionType": q_type,
                    "questionCode": q_code,
                    "questionStem": q_stem,
                    "scale": scale,
                    "insightPrompt": insight,
                    "subdomainWeight": domain_weights.get(domain, 0.35)
                }
                
                if scale == "FORCED_CHOICE":
                    optA = str(row.get("OptionA", "")).strip()
                    optB = str(row.get("OptionB", "")).strip()
                    q_data["forcedChoice"] = {
                        "optionA": { "label": optA, "insightPrompt": insight },
                        "optionB": { "label": optB, "insightPrompt": insight },
                        "higherValueOption": "A"
                    }
                
                output_questions.append(q_data)
                
    except Exception as e:
        print(f"Error processing {entry['file']}: {e}")

# Save to JSON
with open(r"c:\Users\ST\OneDrive\Desktop\backend-tbd\final_questions.json", "w", encoding='utf-8') as f:
    json.dump(output_questions, f, indent=4)

print(f"Total questions generated: {len(output_questions)}")
