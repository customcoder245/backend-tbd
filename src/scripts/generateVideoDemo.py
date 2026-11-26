import os
import subprocess
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
print(f"Using FFmpeg: {ffmpeg_exe}")

# Video Configuration
WIDTH = 1920
HEIGHT = 1080
FPS = 30
FRAME_DIR = "d:/Manik_WorkSpace2k26/talent_by_design/video_frames"
os.makedirs(FRAME_DIR, exist_ok=True)

# Color Palette (Langara Brand)
NAVY_BG = (11, 19, 43)
DARK_CARD = (17, 28, 61)
SLATE_BG = (248, 250, 252)
CARD_WHITE = (255, 255, 255)
LANGARA_ORANGE = (230, 81, 0)
ORANGE_LIGHT = (255, 247, 237)
ORANGE_BORDER = (254, 215, 170)
BORDER_GRAY = (226, 232, 240)
TEXT_DARK = (15, 23, 42)
TEXT_MUTED = (100, 116, 139)
GREEN_BG = (232, 248, 238)
GREEN_TEXT = (30, 130, 76)
AMBER_BG = (255, 249, 230)
AMBER_TEXT = (180, 83, 9)
RED_TEXT = (220, 38, 38)

# Load fonts
try:
    font_hero_num = ImageFont.truetype("arialbd.ttf", 64)
    font_title = ImageFont.truetype("arialbd.ttf", 36)
    font_section = ImageFont.truetype("arialbd.ttf", 26)
    font_body_bold = ImageFont.truetype("arialbd.ttf", 20)
    font_body = ImageFont.truetype("arial.ttf", 18)
    font_small = ImageFont.truetype("arial.ttf", 15)
    font_badge = ImageFont.truetype("arialbd.ttf", 14)
    font_sub_narration = ImageFont.truetype("arial.ttf", 22)
except Exception:
    font_hero_num = font_title = font_section = font_body_bold = font_body = font_small = font_badge = font_sub_narration = ImageFont.load_default()

# 5 Key Scenes
SCENES = [
    {
        "id": 1,
        "title": "SCENE 1: EXECUTIVE CANVAS & 4 CORE PILLARS",
        "focus": "hero",
        "subtitle": "Overall Realization Index: 3.9 / 5.0 (78%). Delivery: 4.2 | Adoption: 4.5 | Benefits: 3.9 | Risk: 3.2",
        "voice": "Welcome Suzanna. On the main Executive Dashboard, you see the overall program index of 3.9 out of 5.0 (78%), backed by the four core pillars: Delivery, Adoption, Benefits, and Risk and Security.",
        "duration_sec": 7
    },
    {
        "id": 2,
        "title": "SCENE 2: HOW TO UPDATE CHECKPOINTS & SCORES",
        "focus": "checkpoints",
        "subtitle": "Click 'Update Gate' to advance review gates (Gate 1 -> 5). Click any B1-B9 row to edit scores and evidence live.",
        "voice": "Updating this instance is completely live. Click 'Update Gate' to transition review gates. Click any B1 through B9 driver row to view verified evidence and edit scores.",
        "duration_sec": 8
    },
    {
        "id": 3,
        "title": "SCENE 3: SURVEY RESULTS & TECHNICAL AUDIT TABS",
        "focus": "tabs",
        "subtitle": "Dedicated top tabs reveal all 16 Likert questions, qualitative feedback, and 10 M365 technical audit metrics.",
        "voice": "Dedicated top navigation tabs let steering committees inspect all 16 survey questions, Site Owner qualitative quotes, and the 10 automated M365 technical audit dimensions.",
        "duration_sec": 8
    },
    {
        "id": 4,
        "title": "SCENE 4: ONE-CLICK EXCEL (7 SHEETS) & PPTX EXPORTS",
        "focus": "exports",
        "subtitle": "Download the exact 7-sheet client Excel workbook or the 6-slide widescreen presentation deck with subtle borders.",
        "voice": "At any time, download the exact 7-sheet client Excel workbook or the 6-slide widescreen presentation deck with subtle borders and formal steering committee approval blocks.",
        "duration_sec": 7
    },
    {
        "id": 5,
        "title": "SCENE 5: ROLLING RESULTS FOR PROJECTS 1 TO 7",
        "focus": "rolling",
        "subtitle": "Projects 1 to 7 roll up cumulative hygiene sums (-91.9% folders, GB saved) and driver status counts with ZERO scope creep.",
        "voice": "To answer your question on Projects 1 to 7: PRM sets the baseline for Project 1. As Projects 2 to 7 go live, their data rolls up into cumulative hygiene totals and driver status distributions with zero added complexity.",
        "duration_sec": 9
    }
]

print("Rendering scene frames...")
frame_idx = 0

for sc in SCENES:
    total_frames = int(sc["duration_sec"] * FPS)
    print(f"Rendering {sc['title']} ({total_frames} frames)...")

    # Base image for scene
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)

    # Top Navigation Bar
    draw.rectangle([(0, 0), (WIDTH, 90)], fill=DARK_CARD)
    draw.rectangle([(0, 88), (WIDTH, 92)], fill=LANGARA_ORANGE)

    # Header Logo Badge
    draw.rounded_rectangle([(40, 20), (280, 70)], radius=6, fill=(255, 255, 255))
    draw.text((55, 28), "Langara.", fill=LANGARA_ORANGE, font=font_section)
    draw.text((160, 36), "| at Musqueam", fill=(71, 85, 105), font=font_small)

    # Header Titles
    draw.text((310, 22), "LANGARA COLLABORATION PLATFORM (LCP | PID 6738)", fill=(254, 215, 170), font=font_small)
    draw.text((310, 44), "Wave 1: Privacy & Records Management (PRM) • Executive Video Demo", fill=(255, 255, 255), font=font_section)

    # Top Right Tab Buttons
    tab_x = 1200
    tabs = ["Executive Dashboard", "Survey Results (n=2)", "M365 Technical Audit"]
    for i, t in enumerate(tabs):
        active = (sc["focus"] == "tabs" and i > 0) or (sc["focus"] != "tabs" and i == 0)
        t_fill = ORANGE_LIGHT if active else (24, 38, 77)
        t_border = LANGARA_ORANGE if active else (40, 60, 110)
        t_text = LANGARA_ORANGE if active else (203, 213, 225)
        draw.rounded_rectangle([(tab_x + i * 190, 26), (tab_x + i * 190 + 175, 64)], radius=6, fill=t_fill, outline=t_border, width=1)
        draw.text((tab_x + i * 190 + 12, 36), t, fill=t_text, font=font_small)

    # Main Canvas Area
    CANVAS_Y = 115
    CANVAS_H = 780
    draw.rounded_rectangle([(40, CANVAS_Y), (WIDTH - 40, CANVAS_Y + CANVAS_H)], radius=12, fill=SLATE_BG, outline=BORDER_GRAY, width=1)

    # 3 Top Columns
    # Card 1: Hero Realization (Left)
    c1_rect = [(70, CANVAS_Y + 30), (620, CANVAS_Y + 410)]
    draw.rounded_rectangle(c1_rect, radius=10, fill=LANGARA_ORANGE)
    draw.text((100, CANVAS_Y + 50), "OVERALL BENEFITS REALIZATION", fill=(255, 255, 255), font=font_section)
    
    # Circle Gauge
    draw.ellipse([(120, CANVAS_Y + 110), (320, CANVAS_Y + 310)], fill=(255, 255, 255))
    draw.text((160, CANVAS_Y + 160), "3.9", fill=LANGARA_ORANGE, font=font_hero_num)
    draw.text((170, CANVAS_Y + 235), "/ 5.0 (78%)", fill=TEXT_MUTED, font=font_body_bold)
    draw.text((165, CANVAS_Y + 265), "PROGRAM SCORE", fill=(148, 163, 184), font=font_badge)

    # 4 Pillars
    pillars = [
        ("Delivery", "4.2", "On Track", GREEN_BG, GREEN_TEXT),
        ("Adoption", "4.5", "On Track", GREEN_BG, GREEN_TEXT),
        ("Benefits", "3.9", "Progressing", (235, 245, 251), (29, 78, 216)),
        ("Risk & Security", "3.2", "Monitor", AMBER_BG, AMBER_TEXT)
    ]
    py = CANVAS_Y + 110
    for pname, pval, pstat, pbg, pfg in pillars:
        draw.rounded_rectangle([(350, py), (590, py + 42)], radius=6, fill=(255, 255, 255))
        draw.text((365, py + 10), f"{pname}: {pval}", fill=TEXT_DARK, font=font_body_bold)
        draw.rounded_rectangle([(490, py + 8), (580, py + 34)], radius=10, fill=pbg)
        draw.text((505, py + 12), pstat, fill=pfg, font=font_badge)
        py += 52

    # Card 2: Outcomes (Middle)
    c2_rect = [(650, CANVAS_Y + 30), (1240, CANVAS_Y + 410)]
    draw.rounded_rectangle(c2_rect, radius=10, fill=CARD_WHITE, outline=BORDER_GRAY, width=1)
    draw.text((680, CANVAS_Y + 50), "VERIFIED HYGIENE OUTCOMES", fill=TEXT_DARK, font=font_section)

    outcomes = [
        ("Folder Architecture", "541 ➔ 44", "(-91.9%)", "Simpler Structure (Depth: 8 ➔ 2)", GREEN_TEXT),
        ("Duplicate File Hygiene", "117 ➔ 49", "(-58.1%)", "Reduced Redundancy & Sprawl", GREEN_TEXT),
        ("Generic File Names", "347 ➔ 41", "(-88.2%)", "Standardized Document Findability", GREEN_TEXT),
        ("Access Governance", "0 'Everyone' Grants", "(100%)", "Zero Folder Exceptions Enforced", GREEN_TEXT)
    ]
    oy = CANVAS_Y + 95
    for otit, onum, opct, osub, ocol in outcomes:
        draw.rounded_rectangle([(680, oy), (1210, oy + 65)], radius=6, fill=(248, 250, 252), outline=BORDER_GRAY, width=1)
        draw.text((695, oy + 8), otit, fill=TEXT_MUTED, font=font_small)
        draw.text((695, oy + 30), f"{onum}  {opct}", fill=LANGARA_ORANGE, font=font_body_bold)
        draw.text((940, oy + 32), f"• {osub}", fill=ocol, font=font_small)
        oy += 75

    # Card 3: Checkpoints & Roadmap (Right)
    c3_rect = [(1270, CANVAS_Y + 30), (1850, CANVAS_Y + 410)]
    draw.rounded_rectangle(c3_rect, radius=10, fill=CARD_WHITE, outline=BORDER_GRAY, width=1)
    draw.text((1300, CANVAS_Y + 50), "STAGE-GATE ROADMAP", fill=TEXT_DARK, font=font_section)
    draw.rounded_rectangle([(1660, CANVAS_Y + 46), (1820, CANVAS_Y + 80)], radius=6, fill=LANGARA_ORANGE)
    draw.text((1675, CANVAS_Y + 54), "Update Gate", fill=(255, 255, 255), font=font_body_bold)

    checkpoints = [
        ("Checkpoint 1: Baseline (June 2026)", "3.5 / 5.0", "COMPLETED", GREEN_BG, GREEN_TEXT),
        ("Checkpoint 2: 3-Month (Sept 2026)", "3.6 / 5.0", "COMPLETED", GREEN_BG, GREEN_TEXT),
        ("Checkpoint 3: 90-Day (Nov 2026)", "3.9 / 5.0", "ACTIVE GATE", ORANGE_LIGHT, LANGARA_ORANGE),
        ("Checkpoint 4: Quarterly (~Dec 2026)", "TBD", "UPCOMING", SLATE_BG, TEXT_MUTED),
        ("Checkpoint 5: Closure (~Feb 2027)", "TBD", "UPCOMING", SLATE_BG, TEXT_MUTED)
    ]
    chy = CANVAS_Y + 95
    for ctitle, cscore, cstat, cbg, cfg in checkpoints:
        draw.rounded_rectangle([(1300, chy), (1820, chy + 52)], radius=6, fill=cbg, outline=BORDER_GRAY, width=1)
        draw.text((1315, chy + 8), ctitle, fill=TEXT_DARK, font=font_body_bold)
        draw.text((1315, chy + 30), f"Score: {cscore}", fill=LANGARA_ORANGE if cstat == "ACTIVE GATE" else TEXT_MUTED, font=font_small)
        draw.text((1700, chy + 18), cstat, fill=cfg, font=font_badge)
        chy += 60

    # Bottom Area: B1-B9 Scorecard & Focus Areas
    draw.rounded_rectangle([(70, CANVAS_Y + 430), (1240, CANVAS_Y + 750)], radius=10, fill=CARD_WHITE, outline=BORDER_GRAY, width=1)
    draw.text((100, CANVAS_Y + 445), "BENEFITS SCORECARD (DRIVERS B1 – B9) • CLICK TO EDIT", fill=TEXT_DARK, font=font_section)

    drivers = [
        ("B1", "Improved Collaboration & Productivity", "4.2", "On Track", "227 active cloud files; 40.2% ROT reduction (2,175 ➔ 1,300 files)."),
        ("B2", "Enhanced Data Security & Compliance", "3.8", "Monitor", "0 'Everyone' grants; 0% Purview auto-labels applied (205 unlabelled)."),
        ("B3", "Simplified IT Management", "4.0", "On Track", "15.1% storage reduction (3.90 ➔ 3.31 GB); 0 path length errors."),
        ("B4", "Enable Remote Work & Mobility", "3.6", "Monitor", "OneDrive sync coaching needed to eliminate manual file re-uploads.")
    ]
    dry = CANVAS_Y + 490
    for did, dname, dscore, dstat, dev in drivers:
        draw.rectangle([(90, dry), (1220, dry + 55)], fill=(248, 250, 252) if did in ["B1", "B3"] else CARD_WHITE)
        draw.text((105, dry + 10), did, fill=LANGARA_ORANGE, font=font_body_bold)
        draw.text((145, dry + 10), dname, fill=TEXT_DARK, font=font_body_bold)
        draw.text((580, dry + 10), f"Score: {dscore}", fill=TEXT_DARK, font=font_body_bold)
        draw.text((700, dry + 10), dstat, fill=GREEN_TEXT if dstat == "On Track" else AMBER_TEXT, font=font_badge)
        draw.text((145, dry + 32), f"Evidence: {dev}", fill=TEXT_MUTED, font=font_small)
        dry += 62

    # Bottom Right: Focus Areas
    draw.rounded_rectangle([(1270, CANVAS_Y + 430), (1850, CANVAS_Y + 750)], radius=10, fill=CARD_WHITE, outline=BORDER_GRAY, width=1)
    draw.text((1300, CANVAS_Y + 445), "PRIORITY ACTION ITEMS", fill=TEXT_DARK, font=font_section)
    
    # Action 1
    draw.rounded_rectangle([(1300, CANVAS_Y + 490), (1820, CANVAS_Y + 605)], radius=6, fill=(254, 242, 242), outline=(252, 165, 165), width=1)
    draw.text((1315, CANVAS_Y + 500), "PRIORITY 1: CRITICAL (Purview Auto-Labelling)", fill=RED_TEXT, font=font_body_bold)
    draw.text((1315, CANVAS_Y + 530), "• 0% retention labels applied across 205 files.\n• Action: Configure Microsoft Purview auto-labelling rules.", fill=TEXT_DARK, font=font_small)

    # Action 2
    draw.rounded_rectangle([(1300, CANVAS_Y + 620), (1820, CANVAS_Y + 735)], radius=6, fill=AMBER_BG, outline=ORANGE_BORDER, width=1)
    draw.text((1315, CANVAS_Y + 630), "PRIORITY 2: MEDIUM (Version-Control Habits)", fill=AMBER_TEXT, font=font_body_bold)
    draw.text((1315, CANVAS_Y + 660), "• 'v2/final/draft' habits increased (468 ➔ 607 files).\n• Action: 15-min coaching clinics on native OneDrive sync.", fill=TEXT_DARK, font=font_small)

    # Bottom Subtitle & Narration Banner
    draw.rectangle([(0, 930), (WIDTH, HEIGHT)], fill=(8, 13, 31))
    draw.rectangle([(0, 928), (WIDTH, 930)], fill=LANGARA_ORANGE)
    draw.text((50, 945), sc["title"], fill=LANGARA_ORANGE, font=font_body_bold)
    draw.text((50, 980), f'"{sc["subtitle"]}"', fill=(255, 255, 255), font=font_sub_narration)
    draw.text((WIDTH - 380, 945), "LANGARA COLLABORATION PLATFORM", fill=(148, 163, 184), font=font_small)

    # Highlight Spotlight for specific focus
    spot_rect = None
    if sc["focus"] == "hero":
        spot_rect = [(60, CANVAS_Y + 20), (630, CANVAS_Y + 420)]
    elif sc["focus"] == "checkpoints":
        spot_rect = [(1260, CANVAS_Y + 20), (1860, CANVAS_Y + 420)]
    elif sc["focus"] == "tabs":
        spot_rect = [(1180, 18), (1800, 75)]
    elif sc["focus"] == "exports":
        spot_rect = [(640, CANVAS_Y + 20), (1250, CANVAS_Y + 420)]
    elif sc["focus"] == "rolling":
        spot_rect = [(60, CANVAS_Y + 420), (1860, CANVAS_Y + 760)]

    # Save animation frames
    for f in range(total_frames):
        frame_img = img.copy()
        if spot_rect:
            fdraw = ImageDraw.Draw(frame_img)
            # Pulse outline
            fdraw.rounded_rectangle(spot_rect, radius=12, outline=LANGARA_ORANGE, width=3)
        
        frame_path = os.path.join(FRAME_DIR, f"frame_{frame_idx:05d}.jpg")
        frame_img.save(frame_path, quality=90)
        frame_idx += 1

print(f"Total rendered frames: {frame_idx}")

# Encode to MP4 using FFmpeg
out_mp4 = "d:/Manik_WorkSpace2k26/talent_by_design/Langara_PRM_Benefits_Realization_Demo.mp4"
print(f"Compiling frames to MP4 ({out_mp4})...")

cmd = [
    ffmpeg_exe,
    "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(FRAME_DIR, "frame_%05d.jpg"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "22",
    "-preset", "fast",
    out_mp4
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("FFmpeg return code:", res.returncode)

if os.path.exists(out_mp4):
    size = os.path.getsize(out_mp4)
    print(f"SUCCESS: Video generated at {out_mp4} ({size:,} bytes)")
    
    # Copy to frontend public and dist for download
    import shutil
    shutil.copyfile(out_mp4, "d:/Manik_WorkSpace2k26/talent_by_design/frontend/public/Langara_PRM_Benefits_Realization_Demo.mp4")
    shutil.copyfile(out_mp4, "d:/Manik_WorkSpace2k26/talent_by_design/frontend/dist/Langara_PRM_Benefits_Realization_Demo.mp4")
    print("Copied video to frontend/public and frontend/dist!")
    
    # Cleanup frames
    for f in os.listdir(FRAME_DIR):
        os.remove(os.path.join(FRAME_DIR, f))
    os.rmdir(FRAME_DIR)
    print("Frame cache cleaned up cleanly.")
else:
    print("ERROR generating MP4:", res.stderr)
