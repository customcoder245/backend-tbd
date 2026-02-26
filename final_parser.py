
import pandas as pd
import json
import os
import re

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

domain_abbr = {
    "People Potential": "PP",
    "Operational Steadiness": "OS",
    "Digital Fluency": "DF"
}

stakeholder_prefix = {
    "admin": "A",
    "leader": "L",
    "manager": "M",
    "employee": "E"
}

type_suffix = {
    "Calibration": "CAL",
    "Behavioural": "B",
    "Forced-Choice": "FC",
    "Self-Rating": ""
}

def get_abbreviation(text):
    if not text: return ""
    exclude = ["and", "the", "with", "or"]
    parts = re.split(r'[\s&/-]+', str(text))
    abbr = "".join([p[0].upper() for p in parts if p and p.lower() not in exclude])
    return abbr

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
prefix_counters = {}
stakeholder_order_counters = {
    "employee": 1,
    "manager": 1,
    "leader": 1,
    "admin": 1
}

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
            
        # We need to process each row for both potential roles (leader -> admin)
        # But we must ensure the 'order' is consistent. 
        # If we loop over roles outside, the order will be mixed if multiple files have the same stakeholder.
        # But here files are grouped by stakeholder, so roles = [stakeholder] or [leader, admin] is fine.
        
        for _, row in df.iterrows():
            domain = str(row.get('Domain', '')).strip()
            subdomain = str(row.get('SubDomain', row.get('Subdomain', ''))).strip()
            if not domain or domain == "nan": continue
            
            q_type = clean_type(row.get("QuestionType", "Self-Rating"))
            scale = clean_scale(row.get("Scale", "1-5"))
            q_stem = str(row.get("QuestionStem", "")).strip()
            insight = str(row.get("InsightPrompt", "")).strip() if pd.notna(row.get("InsightPrompt")) else ""
            
            if not q_stem or q_stem == "nan": continue

            roles = [stakeholder]
            if stakeholder == "leader":
                roles.append("admin")
            
            for role in roles:
                dAbbr = domain_abbr.get(domain, get_abbreviation(domain))
                sAbbr = get_abbreviation(subdomain)
                rolePref = stakeholder_prefix.get(role.lower(), role[0].upper())
                tSuff = type_suffix.get(q_type, "")
                
                prefix = f"{dAbbr}-{sAbbr}-{rolePref}{tSuff}"
                if prefix not in prefix_counters:
                    prefix_counters[prefix] = 1
                else:
                    prefix_counters[prefix] += 1
                
                generated_code = f"{prefix}{prefix_counters[prefix]}"
                
                q_data = {
                    "stakeholder": role,
                    "domain": domain,
                    "subdomain": subdomain,
                    "questionType": q_type,
                    "questionCode": generated_code,
                    "questionStem": q_stem,
                    "scale": scale,
                    "insightPrompt": insight,
                    "subdomainWeight": (0.35 if domain == "People Potential" else (0.25 if domain == "Operational Steadiness" else 0.20)),
                    "order": stakeholder_order_counters[role]
                }
                
                stakeholder_order_counters[role] += 1
                
                if scale == "FORCED_CHOICE":
                    optA = str(row.get("OptionA", "")).strip()
                    optB = str(row.get("OptionB", "")).strip()
                    q_data["forcedChoice"] = {
                        "optionA": { "label": optA, "insightPrompt": insight },
                        "optionB": { "label": optB, "insightPrompt": insight },
                        "higherValueOption": "A"
                    }
                else:
                    if not q_data["insightPrompt"]:
                        q_data["insightPrompt"] = f"Please provide details regarding your experience with {subdomain.lower()}."
                
                output_questions.append(q_data)
                
    except Exception as e:
        print(f"Error processing {entry['file']}: {e}")

# Save to JSON
with open(r"c:\Users\ST\OneDrive\Desktop\backend-tbd\final_questions.json", "w", encoding='utf-8') as f:
    json.dump(output_questions, f, indent=4)

print(f"Total questions generated: {len(output_questions)}")
for role, count in stakeholder_order_counters.items():
    print(f"  {role}: {count-1} questions")
