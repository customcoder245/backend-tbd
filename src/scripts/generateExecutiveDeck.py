import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

NAVY = RGBColor(26, 54, 82)        # #1A3652
BLUE = RGBColor(68, 140, 210)      # #448CD2
LIGHT_BG = RGBColor(237, 245, 253) # #EDF5FD
GRAY = RGBColor(100, 116, 139)
GREEN = RGBColor(48, 173, 67)
WHITE = RGBColor(255, 255, 255)

blank_layout = prs.slide_layouts[6]

# Slide 1: Title Slide
s1 = prs.slides.add_slide(blank_layout)
tb = s1.shapes.add_textbox(Inches(1), Inches(1.5), Inches(11.3), Inches(4.5))
tf = tb.text_frame
tf.word_wrap = True

p1 = tf.paragraphs[0]
p1.text = "LANGARA COLLABORATION PLATFORM (LCP | PID 6738)"
p1.font.bold = True
p1.font.size = Pt(16)
p1.font.color.rgb = BLUE

p2 = tf.add_paragraph()
p2.text = "Benefits Realization Executive Scorecard"
p2.font.bold = True
p2.font.size = Pt(36)
p2.font.color.rgb = NAVY

p3 = tf.add_paragraph()
p3.text = "Wave 1: Admin Group 1 — Privacy & Records Management (PRM) • 90-Day Review Gate"
p3.font.size = Pt(20)
p3.font.color.rgb = GRAY

p4 = tf.add_paragraph()
p4.text = "\nPrepared for: PRM Business Unit Lead (Sponsor) | Shireen Cardas (IT PPM) | Suzanna de Souza (OCM)\nPowered by POD-360™ Strategic Transformation Platform"
p4.font.size = Pt(14)
p4.font.color.rgb = GRAY

# Slide 2: Executive Summary & 4 Pillars
s2 = prs.slides.add_slide(blank_layout)
tb2 = s2.shapes.add_textbox(Inches(1), Inches(0.8), Inches(11.3), Inches(1))
p = tb2.text_frame.paragraphs[0]
p.text = "Executive Summary — 4 Core Transformation Pillars"
p.font.bold = True
p.font.size = Pt(28)
p.font.color.rgb = NAVY

tb_pillars = s2.shapes.add_textbox(Inches(1), Inches(2.0), Inches(11.3), Inches(4.8))
tf_p = tb_pillars.text_frame
tf_p.word_wrap = True

pillars = [
    ("1. Delivery (Score: 4.2 / 5.0 — On Track)", "SharePoint Online migration and M365 technical foundation deployed on schedule. Zero critical infrastructure bugs."),
    ("2. Adoption (Score: 4.5 / 5.0 — On Track)", "100% of staff completed change training (1,151 trained). Active collaboration across 227 live business records."),
    ("3. Benefits Realization (Score: 3.9 / 5.0 — Progressing)", "Early collaboration gains realized; folder structures simplified by 91.9%. FOIPPA compliance workflows accelerating."),
    ("4. Risk & Security (Score: 3.2 / 5.0 — Monitor)", "0 Everyone sharing grants maintained. Priority remediation active for Microsoft Purview automated sensitivity labelling.")
]

for title, desc in pillars:
    p_t = tf_p.add_paragraph()
    p_t.text = title
    p_t.font.bold = True
    p_t.font.size = Pt(16)
    p_t.font.color.rgb = BLUE
    p_d = tf_p.add_paragraph()
    p_d.text = desc + "\n"
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = NAVY

# Slide 3: Hygiene & Measurable Outcomes
s3 = prs.slides.add_slide(blank_layout)
tb3 = s3.shapes.add_textbox(Inches(1), Inches(0.8), Inches(11.3), Inches(1))
p = tb3.text_frame.paragraphs[0]
p.text = "Measurable Operational & Information Hygiene Outcomes"
p.font.bold = True
p.font.size = Pt(28)
p.font.color.rgb = NAVY

tb_outcomes = s3.shapes.add_textbox(Inches(1), Inches(2.0), Inches(11.3), Inches(4.8))
tf_o = tb_outcomes.text_frame
tf_o.word_wrap = True

outcomes = [
    ("• Folder Sprawl Reduction: 541 -> 44 folders (-91.9%)", "Eliminated deep nesting hierarchies, slashing navigation friction and support overhead."),
    ("• Duplicate File Elimination: 117 -> 49 duplicates (-58.1%)", "Consolidated legacy copies into authoritative single-source-of-truth M365 libraries."),
    ("• Ambiguous Naming Cleanup: 347 -> 41 files (-88.2%)", "Replaced generic filenames with standardized metadata nomenclature."),
    ("• Zero Uncontrolled Access: 0 'Everyone' Grants", "Complete lockdown of open enterprise permissions across all PRM document spaces."),
    ("• Staff Training Fluency: 1,151 / 1,151 Employees (100%)", "Total institutional enablement across Privacy & Records Management teams.")
]

for title, desc in outcomes:
    p_t = tf_o.add_paragraph()
    p_t.text = title
    p_t.font.bold = True
    p_t.font.size = Pt(16)
    p_t.font.color.rgb = GREEN
    p_d = tf_o.add_paragraph()
    p_d.text = desc + "\n"
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = NAVY

# Slide 4: Strategic Drivers (B1-B9) & Next Steps
s4 = prs.slides.add_slide(blank_layout)
tb4 = s4.shapes.add_textbox(Inches(1), Inches(0.8), Inches(11.3), Inches(1))
p = tb4.text_frame.paragraphs[0]
p.text = "Strategic Scorecard (B1–B9) & Action Priorities"
p.font.bold = True
p.font.size = Pt(28)
p.font.color.rgb = NAVY

tb_actions = s4.shapes.add_textbox(Inches(1), Inches(2.0), Inches(11.3), Inches(4.8))
tf_a = tb_actions.text_frame
tf_a.word_wrap = True

actions = [
    ("Priority 1: Microsoft Purview Automated Security Labelling [Critical]", "Configure auto-labelling rules and security classifications across all PRM document libraries to safeguard confidential student and administrative records under BC FIPPA."),
    ("Priority 2: Version-Control Maturity Clinic [Medium]", "Conduct OCM coaching clinic & co-authoring practice sessions (Due: Gate 2 +30d) to curb 'v2/final/draft' file duplication habits."),
    ("Stage-Gate Roadmap", "Checkpoint 1 (Baseline: 3.5) [Completed] -> Checkpoint 2 (3-Month: 3.6) [Completed] -> Checkpoint 3 (90-Day Gate: 3.9) [ACTIVE] -> Checkpoint 4 (Quarterly: Target 4.2) -> Checkpoint 5 (Closure: Target 4.5)")
]

for title, desc in actions:
    p_t = tf_a.add_paragraph()
    p_t.text = title
    p_t.font.bold = True
    p_t.font.size = Pt(16)
    p_t.font.color.rgb = BLUE
    p_d = tf_a.add_paragraph()
    p_d.text = desc + "\n"
    p_d.font.size = Pt(13)
    p_d.font.color.rgb = NAVY

output_path = os.path.abspath("frontend/public/Langara_PRM_Executive_Scorecard.pptx")
prs.save(output_path)
print("Saved executive presentation to:", output_path)
