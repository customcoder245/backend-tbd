
import json

path = r"c:\Users\ST\OneDrive\Desktop\parsed_questions.json"
with open(path, "r", encoding='utf-8') as f:
    data = json.load(f)

print(f"Total entries: {len(data)}")

roles = {}
domains = {}
for q in data:
    r = q.get("stakeholder")
    d = q.get("domain")
    roles[r] = roles.get(r, 0) + 1
    domains[d] = domains.get(d, 0) + 1

print("Roles:", roles)
print("Domains:", domains)
