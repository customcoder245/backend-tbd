import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# =========================================================================
# LANGARA APPROVED BRAND PALETTE & TYPOGRAPHY
# Fonts: Cambria for Headers | Calibri for Rest of Text
# =========================================================================
FONT_HEADER = "Cambria"
FONT_BODY = "Calibri"

# Approved Colors from Langara Matrix
COLOR_ORANGE_PRIMARY = RGBColor(241, 90, 34)    # #F15A22 (Langara Orange)
COLOR_ORANGE_SECONDARY = RGBColor(242, 151, 5)  # #F29705
COLOR_AMBER = RGBColor(252, 181, 17)            # #FCB511
COLOR_CREAM = RGBColor(251, 224, 181)           # #FBE0B5
COLOR_BLACK = RGBColor(0, 0, 0)                 # #000000
COLOR_CHARCOAL = RGBColor(109, 110, 112)        # #6D6E70
COLOR_MID_GRAY = RGBColor(188, 189, 192)        # #BCBDC0
COLOR_BORDER_GRAY = RGBColor(209, 210, 212)     # #D1D2D4
COLOR_LIGHT_GRAY = RGBColor(230, 231, 232)      # #E6E7E8
COLOR_WHITE = RGBColor(255, 255, 255)           # #FFFFFF

# Status Accent Colors
COLOR_GREEN_BG = RGBColor(232, 248, 238)
COLOR_GREEN_TEXT = RGBColor(30, 130, 76)
COLOR_GREEN_BORDER = RGBColor(163, 228, 215)
COLOR_AMBER_BG = RGBColor(255, 249, 230)
COLOR_AMBER_TEXT = RGBColor(180, 83, 9)
COLOR_AMBER_BORDER = RGBColor(250, 215, 160)
COLOR_BLUE_BG = RGBColor(235, 245, 251)
COLOR_BLUE_TEXT = RGBColor(29, 78, 216)
COLOR_BLUE_BORDER = RGBColor(174, 214, 241)
COLOR_RED_BG = RGBColor(254, 226, 226)
COLOR_RED_TEXT = RGBColor(185, 28, 28)
COLOR_RED_BORDER = RGBColor(252, 165, 165)

def set_shape_flat(shape, fill_color, line_color=None, line_width=1, corner_radius=0.03):
    """Utility to set flat solid fill, clean border, and modern subtle corner radius."""
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(line_width)
    else:
        shape.line.fill.background()
    
    if hasattr(shape, 'adjustments') and len(shape.adjustments) > 0 and corner_radius is not None:
        try:
            shape.adjustments[0] = corner_radius
        except Exception:
            pass

def create_textbox(slide, left, top, width, height, margin=0):
    """Create a textbox with zero or specified margins to avoid text clipping."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    return txBox, tf

def add_header(slide, title_text, category_text="LANGARA COLLABORATION PLATFORM (LCP) | PID 6738"):
    """Standardized crisp executive slide header using Cambria & Calibri."""
    # Top accent bar in Langara Orange
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.08))
    set_shape_flat(top_bar, COLOR_ORANGE_PRIMARY)

    # Category / Program breadcrumb (Calibri)
    cat_box, cat_tf = create_textbox(slide, Inches(0.8), Inches(0.20), Inches(11.733), Inches(0.25))
    p_cat = cat_tf.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.name = FONT_BODY
    p_cat.font.size = Pt(8.5)
    p_cat.font.bold = True
    p_cat.font.color.rgb = COLOR_ORANGE_PRIMARY

    # Main Slide Title (Cambria)
    title_box, title_tf = create_textbox(slide, Inches(0.8), Inches(0.42), Inches(11.733), Inches(0.45))
    p_title = title_tf.paragraphs[0]
    p_title.text = title_text
    p_title.font.name = FONT_HEADER
    p_title.font.size = Pt(16)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_BLACK

    # Dividing thin line under header in Langara border gray
    div = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.95), Inches(11.733), Inches(0.015))
    set_shape_flat(div, COLOR_BORDER_GRAY)

def add_footer_logo(slide, logo_path):
    """Adds the official Langara bilingual logo at the bottom."""
    if logo_path and os.path.exists(logo_path):
        slide.shapes.add_picture(logo_path, Inches(0.8), Inches(6.65), height=Inches(0.65))

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    logo_path = os.path.abspath('frontend/public/langara_logo.png')

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (EXACT CLEAN WHITE THEME MATCHING UPLOADED IMAGE)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg1, COLOR_WHITE)

    # Accent decorative strip on left in Langara Orange
    strip = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.35), Inches(7.5))
    set_shape_flat(strip, COLOR_ORANGE_PRIMARY)

    # Title block (Top left aligned)
    _, t_tf = create_textbox(s1, Inches(1.2), Inches(0.85), Inches(11.0), Inches(4.5))
    
    # 1. Program Header (Cambria)
    p1 = t_tf.paragraphs[0]
    p1.text = "Langara Collaboration Platform Program"
    p1.font.name = FONT_HEADER
    p1.font.size = Pt(26)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_BLACK

    # 2. Main Title (Cambria Bold)
    p2 = t_tf.add_paragraph()
    p2.text = "Privacy & Records Management (PRM)"
    p2.font.name = FONT_HEADER
    p2.font.size = Pt(36)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_ORANGE_PRIMARY

    # 3. Subtitle (Calibri)
    p3 = t_tf.add_paragraph()
    p3.text = "Benefits Realization performance update\n"
    p3.font.name = FONT_BODY
    p3.font.size = Pt(20)
    p3.font.color.rgb = COLOR_CHARCOAL

    # 4. Metadata Details (Calibri)
    meta_lines = [
        ("Project: Admin Group 1", False),
        ("Go-Live:  June 2, 2026", False),
        ("90-Day Post-Go-Live Review Gate:  November 12, 2026", True),
        ("Update provided by:  Suzanna de Souza", False)
    ]
    for text_line, is_bold in meta_lines:
        pm = t_tf.add_paragraph()
        pm.text = text_line
        pm.font.name = FONT_BODY
        pm.font.size = Pt(15)
        pm.font.bold = is_bold
        pm.font.color.rgb = COLOR_BLACK if is_bold else COLOR_CHARCOAL

    # Large Langara Logo placed prominently on Slide 1
    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(1.2), Inches(5.35), height=Inches(1.5))

    # =========================================================================
    # SLIDE 2: EXECUTIVE REALIZATION DASHBOARD (3 COLUMN CARDS)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg2, COLOR_WHITE)
    add_header(s2, "Executive Realization Dashboard — 90-Day Post-Go-Live Review Gate")
    add_footer_logo(s2, logo_path)

    col_width = Inches(3.68)
    col_gap = Inches(0.34)
    card_y = Inches(1.15)
    card_h = Inches(5.35)

    # Card 1: Overall Benefits Realization (Left Column)
    c1_x = Inches(0.8)
    c1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c1_x, card_y, col_width, card_h)
    set_shape_flat(c1, COLOR_ORANGE_PRIMARY)

    _, c1_h_tf = create_textbox(s2, c1_x + Inches(0.2), card_y + Inches(0.18), col_width - Inches(0.4), Inches(0.35))
    p = c1_h_tf.paragraphs[0]
    p.text = "Overall Benefits Realization"
    p.font.name = FONT_HEADER
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_WHITE

    # Gauge White Circle
    gauge_size = Inches(1.55)
    gauge_x = c1_x + (col_width - gauge_size) / 2
    gauge_y = card_y + Inches(0.65)
    gauge = s2.shapes.add_shape(MSO_SHAPE.OVAL, gauge_x, gauge_y, gauge_size, gauge_size)
    set_shape_flat(gauge, COLOR_WHITE)

    _, g_tf = create_textbox(s2, gauge_x, gauge_y + Inches(0.25), gauge_size, Inches(1.05))
    p1 = g_tf.paragraphs[0]
    p1.text = "3.9"
    p1.alignment = PP_ALIGN.CENTER
    p1.font.name = FONT_BODY
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_ORANGE_PRIMARY

    p2 = g_tf.add_paragraph()
    p2.text = "/ 5.0 (78%)"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = FONT_BODY
    p2.font.size = Pt(10.5)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_CHARCOAL

    p3 = g_tf.add_paragraph()
    p3.text = "PROGRAM SCORE"
    p3.alignment = PP_ALIGN.CENTER
    p3.font.name = FONT_BODY
    p3.font.size = Pt(7.5)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_MID_GRAY

    # 4 Pillars inside Card 1
    pillar_start_y = card_y + Inches(2.40)
    pillar_row_h = Inches(0.60)
    pillar_row_gap = Inches(0.10)
    pillars = [
        ("Delivery", "On Track", COLOR_GREEN_BG, COLOR_GREEN_TEXT, COLOR_GREEN_BORDER),
        ("Adoption", "On Track", COLOR_GREEN_BG, COLOR_GREEN_TEXT, COLOR_GREEN_BORDER),
        ("Benefits", "Progressing", COLOR_CREAM, COLOR_ORANGE_PRIMARY, COLOR_ORANGE_SECONDARY),
        ("Risk & Compliance", "Monitor", COLOR_CREAM, COLOR_ORANGE_PRIMARY, COLOR_ORANGE_SECONDARY)
    ]
    for idx, (p_name, p_stat, p_bg, p_fg, p_bd) in enumerate(pillars):
        py = pillar_start_y + idx * (pillar_row_h + pillar_row_gap)
        p_row = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c1_x + Inches(0.18), py, col_width - Inches(0.36), pillar_row_h)
        set_shape_flat(p_row, COLOR_ORANGE_SECONDARY)

        _, pn_tf = create_textbox(s2, c1_x + Inches(0.32), py + Inches(0.14), Inches(1.85), Inches(0.32))
        p = pn_tf.paragraphs[0]
        p.text = p_name
        p.font.name = FONT_BODY
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE

        badge_w = Inches(1.15)
        badge_h = Inches(0.36)
        badge_x = c1_x + col_width - Inches(0.18) - badge_w - Inches(0.1)
        badge_y = py + (pillar_row_h - badge_h) / 2
        badge = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, badge_x, badge_y, badge_w, badge_h)
        set_shape_flat(badge, p_bg, p_bd, line_width=1)
        
        _, b_tf = create_textbox(s2, badge_x, badge_y + Inches(0.05), badge_w, badge_h - Inches(0.10))
        p = b_tf.paragraphs[0]
        p.text = p_stat
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = p_fg

    # Card 2: Key Outcomes (Center Column)
    c2_x = c1_x + col_width + col_gap
    c2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c2_x, card_y, col_width, card_h)
    set_shape_flat(c2, COLOR_WHITE, COLOR_BORDER_GRAY, line_width=1)

    _, c2_h_tf = create_textbox(s2, c2_x + Inches(0.2), card_y + Inches(0.18), col_width - Inches(0.4), Inches(0.35))
    p = c2_h_tf.paragraphs[0]
    p.text = "Key Outcomes (Post-Go-Live)"
    p.font.name = FONT_HEADER
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK

    outcomes = [
        ("Folder Architecture", "541  ➔  44", "(-91.9%)", "Simpler Structure (Max Depth: 8 ➔ 2)", COLOR_GREEN_BG, COLOR_GREEN_TEXT, COLOR_GREEN_BORDER),
        ("Duplicate File Hygiene", "117  ➔  49", "(-58.1%)", "Reduced Redundancy & Clutter", COLOR_GREEN_BG, COLOR_GREEN_TEXT, COLOR_GREEN_BORDER),
        ("Generic File Names", "347  ➔  41", "(-88.2%)", "Standardized Search Findability", COLOR_GREEN_BG, COLOR_GREEN_TEXT, COLOR_GREEN_BORDER)
    ]
    tile_start_y = card_y + Inches(0.65)
    tile_h = Inches(1.42)
    tile_gap = Inches(0.12)
    for idx, (o_title, o_num, o_pct, o_tag, t_bg, t_fg, t_bd) in enumerate(outcomes):
        ty = tile_start_y + idx * (tile_h + tile_gap)
        tile = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c2_x + Inches(0.18), ty, col_width - Inches(0.36), tile_h)
        set_shape_flat(tile, COLOR_LIGHT_GRAY, COLOR_BORDER_GRAY, line_width=1)

        _, t_tf = create_textbox(s2, c2_x + Inches(0.32), ty + Inches(0.10), col_width - Inches(0.64), Inches(0.24))
        p = t_tf.paragraphs[0]
        p.text = o_title
        p.font.name = FONT_HEADER
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_BLACK

        _, n_tf = create_textbox(s2, c2_x + Inches(0.32), ty + Inches(0.36), col_width - Inches(0.64), Inches(0.44))
        p = n_tf.paragraphs[0]
        p.text = f"{o_num}  "
        p.font.name = FONT_BODY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_ORANGE_PRIMARY
        
        r = p.add_run()
        r.text = o_pct
        r.font.name = FONT_BODY
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = COLOR_CHARCOAL

        tag_w = Inches(2.9)
        tag_h = Inches(0.32)
        tag_x = c2_x + Inches(0.32)
        tag_y = ty + Inches(0.95)
        tag = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, tag_x, tag_y, tag_w, tag_h)
        set_shape_flat(tag, t_bg, t_bd, line_width=1)

        _, tg_tf = create_textbox(s2, tag_x, tag_y + Inches(0.04), tag_w, tag_h - Inches(0.08))
        p = tg_tf.paragraphs[0]
        p.text = f"↑ {o_tag}"
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = t_fg

    # Card 3: Value Demonstrated to Date (Right Column)
    c3_x = c2_x + col_width + col_gap
    c3 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c3_x, card_y, col_width, card_h)
    set_shape_flat(c3, COLOR_WHITE, COLOR_BORDER_GRAY, line_width=1)

    _, c3_h_tf = create_textbox(s2, c3_x + Inches(0.2), card_y + Inches(0.18), col_width - Inches(0.4), Inches(0.35))
    p = c3_h_tf.paragraphs[0]
    p.text = "Value Demonstrated to Date"
    p.font.name = FONT_HEADER
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK

    value_items = [
        ("91.9% Fewer Folders", "541 reduced to 44; flatter structure and simplified navigation across all PRM document libraries."),
        ("58.1% Fewer Duplicate Files", "117 reduced to 49; improved information hygiene and elimination of version ambiguity."),
        ("Stronger Access Controls", "0 'Everyone' grants; 0 folder-level permission exceptions; clean site-level inheritance enforced."),
        ("100% Staff Enablement", "All PRM site owners and active members completed modern SharePoint training."),
        ("Benefits Still to Validate", "Measurable time savings, automated retention labeling, and sustained compliance through quarterly reviews.")
    ]
    v_start_y = card_y + Inches(0.65)
    v_item_h = Inches(0.88)
    for idx, (vt, vd) in enumerate(value_items):
        vy = v_start_y + idx * (v_item_h + Inches(0.05))
        v_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c3_x + Inches(0.18), vy, col_width - Inches(0.36), v_item_h)
        set_shape_flat(v_box, COLOR_WHITE, COLOR_LIGHT_GRAY, line_width=1)

        _, v_tf = create_textbox(s2, c3_x + Inches(0.28), vy + Inches(0.08), col_width - Inches(0.56), v_item_h - Inches(0.16))
        p1 = v_tf.paragraphs[0]
        p1.text = f"•  {vt}"
        p1.font.name = FONT_HEADER
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_ORANGE_PRIMARY

        p2 = v_tf.add_paragraph()
        p2.text = vd
        p2.font.name = FONT_BODY
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_CHARCOAL

    # =========================================================================
    # SLIDE 3: STRATEGIC BENEFITS SCORECARD (B1 – B9 TABLE)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg3, COLOR_WHITE)
    add_header(s3, "Strategic Benefits Scorecard (Drivers B1 – B9) • Mean Score: 3.9 / 5.0")
    add_footer_logo(s3, logo_path)

    table_shape = s3.shapes.add_table(11, 6, Inches(0.8), Inches(1.15), Inches(11.733), Inches(5.35))
    table = table_shape.table
    table.columns[0].width = Inches(1.1)
    table.columns[1].width = Inches(3.0)
    table.columns[2].width = Inches(1.1)
    table.columns[3].width = Inches(1.1)
    table.columns[4].width = Inches(1.4)
    table.columns[5].width = Inches(4.033)

    headers = ["Driver ID", "Strategic Driver Name", "Target", "Score", "Status", "Operational Evidence & Verification Metrics"]
    for c_idx, h_text in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = h_text
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_BLACK
        p = cell.text_frame.paragraphs[0]
        p.font.name = FONT_HEADER
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.alignment = PP_ALIGN.CENTER if c_idx in [0, 2, 3, 4] else PP_ALIGN.LEFT

    drivers_data = [
        ("B1", "Improved Collaboration & Productivity", "5.0", "4.2", "On Track", "227 active cloud files; 4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files).", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("B2", "Enhanced Data Security & Compliance", "5.0", "3.8", "Monitor", "4.5/5 restricted access confidence; 0 'Everyone' grants; 0% Purview labels (205 files unlabelled).", COLOR_CREAM, COLOR_ORANGE_PRIMARY),
        ("B3", "Simplified IT Management", "5.0", "4.0", "On Track", "4.5/5 support awareness; 15.1% storage reduction (3.90 ➔ 3.31 GB); 0 path length errors.", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("B4", "Enable Remote Work & Mobility", "5.0", "3.6", "Monitor", "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual file uploads.", COLOR_CREAM, COLOR_ORANGE_PRIMARY),
        ("B5", "Improved Decision-Making & BI", "5.0", "4.1", "On Track", "Single source of truth; folder depth 8 ➔ 2 (-75%), folders 541 ➔ 44 (-91.9%), duplicate files -58.1%.", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("B6", "Streamlined Processes", "5.0", "3.7", "Progressing", "4.0/5 collaboration ease; workflow transition underway across PRM libraries.", COLOR_CREAM, COLOR_ORANGE_SECONDARY),
        ("B7", "Standardization", "5.0", "3.5", "On Track", "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%).", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("B8", "Improved Adoption", "5.0", "4.5", "On Track", "4.5/5 training satisfaction, 4.5/5 team responsiveness; 100% staff training completion (1,151 staff).", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("B9", "Cost Savings", "5.0", "3.9", "Verified", "15.1% storage reduction (3.90 ➔ 3.31 GB); >$70k PBX savings; $280k storage avoidance.", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
    ]

    for r_idx, (did, name, tgt, scr, stat, ev, bg_c, tx_c) in enumerate(drivers_data):
        row_num = r_idx + 1
        row_bg = COLOR_LIGHT_GRAY if r_idx % 2 == 1 else COLOR_WHITE

        for col_i in range(6):
            table.cell(row_num, col_i).fill.solid()
            table.cell(row_num, col_i).fill.fore_color.rgb = row_bg

        # Driver ID (Cambria)
        c0 = table.cell(row_num, 0)
        c0.text = did
        p = c0.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_HEADER
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_ORANGE_PRIMARY

        # Name (Calibri)
        c1 = table.cell(row_num, 1)
        c1.text = name
        p = c1.text_frame.paragraphs[0]
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_BLACK

        # Target (Calibri)
        c2 = table.cell(row_num, 2)
        c2.text = tgt
        p = c2.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_CHARCOAL

        # Score (Calibri Bold)
        c3 = table.cell(row_num, 3)
        c3.text = scr
        p = c3.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_BLACK

        # Status Badge (Calibri)
        c4 = table.cell(row_num, 4)
        c4.text = stat
        c4.fill.solid()
        c4.fill.fore_color.rgb = bg_c
        p = c4.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = tx_c

        # Evidence (Calibri)
        c5 = table.cell(row_num, 5)
        c5.text = ev
        p = c5.text_frame.paragraphs[0]
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_CHARCOAL

    # Bottom Mean Summary Row
    mean_row_num = 10
    for col_i in range(6):
        table.cell(mean_row_num, col_i).fill.solid()
        table.cell(mean_row_num, col_i).fill.fore_color.rgb = COLOR_CREAM

    table.cell(mean_row_num, 0).text = "MEAN"
    p = table.cell(mean_row_num, 0).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADER
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_ORANGE_PRIMARY

    table.cell(mean_row_num, 1).text = "Provisional Realization Scorecard Average"
    p = table.cell(mean_row_num, 1).text_frame.paragraphs[0]
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK

    table.cell(mean_row_num, 2).text = "5.0"
    p = table.cell(mean_row_num, 2).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.color.rgb = COLOR_CHARCOAL

    table.cell(mean_row_num, 3).text = "3.9"
    p = table.cell(mean_row_num, 3).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_BODY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ORANGE_PRIMARY

    table.cell(mean_row_num, 4).text = "78% INDEX"
    p = table.cell(mean_row_num, 4).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_ORANGE_PRIMARY

    table.cell(mean_row_num, 5).text = "Active Gate 2/3 Benchmark Satisfied; Transition Authorized to Checkpoint 4."
    p = table.cell(mean_row_num, 5).text_frame.paragraphs[0]
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = COLOR_BLACK

    # =========================================================================
    # SLIDE 4: BENEFIT CHECKPOINTS ROADMAP (STAGE-GATE GOVERNANCE)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg4, COLOR_WHITE)
    add_header(s4, "Benefit Checkpoints Roadmap — Stage-Gate Governance")
    add_footer_logo(s4, logo_path)

    checkpoints_spec = [
        ("Checkpoint 1", "Baseline", "June 2026", "3.5 / 5.0", "COMPLETED", "Initial post-go-live readiness survey and architecture audit.", COLOR_GREEN_BG, COLOR_GREEN_TEXT, COLOR_GREEN_BORDER, False),
        ("Checkpoint 2", "Pre-Operational Handover", "Sept 2026", "3.6 / 5.0", "COMPLETED", "Early adoption metrics and file hygiene validation.", COLOR_GREEN_BG, COLOR_GREEN_TEXT, COLOR_GREEN_BORDER, False),
        ("Checkpoint 3", "90-Day Review", "Nov 2026", "3.9 / 5.0", "ACTIVE GATE", "Formal evaluation for steering committee gate 2 sign-off.", COLOR_ORANGE_PRIMARY, COLOR_WHITE, COLOR_ORANGE_PRIMARY, True),
        ("Checkpoint 4", "Quarterly Review", "~ Dec 2026", "TBD", "UPCOMING", "Records retention automation & security labelling assessment.", COLOR_LIGHT_GRAY, COLOR_CHARCOAL, COLOR_BORDER_GRAY, False),
        ("Checkpoint 5", "Program Closure", "~ Feb 2027", "TBD", "UPCOMING", "Transition to sustained operations & continuous governance.", COLOR_LIGHT_GRAY, COLOR_CHARCOAL, COLOR_BORDER_GRAY, False)
    ]

    card_w = Inches(2.18)
    card_gap = Inches(0.20)
    c4_y = Inches(1.15)
    c4_h = Inches(4.00)

    for idx, (cp_title, cp_phase, cp_date, cp_score, cp_stat, cp_desc, pill_bg, pill_fg, pill_bd, is_active) in enumerate(checkpoints_spec):
        cx = Inches(0.8) + idx * (card_w + card_gap)
        
        cp_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, c4_y, card_w, c4_h)
        card_fill = COLOR_CREAM if is_active else COLOR_WHITE
        card_border = COLOR_ORANGE_PRIMARY if is_active else COLOR_BORDER_GRAY
        set_shape_flat(cp_card, card_fill, card_border, line_width=2 if is_active else 1)

        _, cp_t_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(0.16), card_w - Inches(0.2), Inches(0.28))
        p = cp_t_tf.paragraphs[0]
        p.text = cp_title
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_HEADER
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_ORANGE_PRIMARY if is_active else COLOR_BLACK

        _, ph_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(0.48), card_w - Inches(0.2), Inches(0.26))
        p = ph_tf.paragraphs[0]
        p.text = cp_phase
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_CHARCOAL

        _, sc_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(0.92), card_w - Inches(0.2), Inches(0.40))
        p = sc_tf.paragraphs[0]
        p.text = cp_score
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = COLOR_ORANGE_PRIMARY if is_active else COLOR_BLACK

        _, dt_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(1.38), card_w - Inches(0.2), Inches(0.26))
        p = dt_tf.paragraphs[0]
        p.text = cp_date
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = COLOR_CHARCOAL

        card_div = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx + Inches(0.2), c4_y + Inches(1.75), card_w - Inches(0.4), Inches(0.015))
        set_shape_flat(card_div, COLOR_ORANGE_SECONDARY if is_active else COLOR_BORDER_GRAY)

        _, ds_tf = create_textbox(s4, cx + Inches(0.15), c4_y + Inches(1.90), card_w - Inches(0.3), Inches(1.35))
        p = ds_tf.paragraphs[0]
        p.text = cp_desc
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(8.5)
        p.font.color.rgb = COLOR_CHARCOAL

        b_w = Inches(1.8)
        b_h = Inches(0.36)
        b_x = cx + (card_w - b_w) / 2
        b_y = c4_y + c4_h - b_h - Inches(0.16)
        badge = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, b_x, b_y, b_w, b_h)
        set_shape_flat(badge, pill_bg, pill_bd, line_width=1)

        _, b_tf = create_textbox(s4, b_x, b_y + Inches(0.05), b_w, b_h - Inches(0.1))
        p = b_tf.paragraphs[0]
        p.text = cp_stat
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_BODY
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = pill_fg

    # Bottom Decision Banner (Langara Black)
    crit_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.30), Inches(11.733), Inches(1.25))
    set_shape_flat(crit_box, COLOR_BLACK)

    _, cb_tf = create_textbox(s4, Inches(1.0), Inches(5.40), Inches(11.333), Inches(1.05))
    p1 = cb_tf.paragraphs[0]
    p1.text = "REVIEW GATE 2 / 3 PASS CRITERIA & STEERING MANDATE"
    p1.font.name = FONT_HEADER
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_ORANGE_PRIMARY

    p2 = cb_tf.add_paragraph()
    p2.text = "• Information architecture targets validated: -91.9% folders, -58.1% duplicate files, 100% staff training completion."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(9)
    p2.font.color.rgb = COLOR_WHITE

    p3 = cb_tf.add_paragraph()
    p3.text = "• Active Remediation Mandate: Configure Microsoft Purview automated retention labeling before proceeding to Checkpoint 4 closure."
    p3.font.name = FONT_BODY
    p3.font.size = Pt(9)
    p3.font.color.rgb = COLOR_WHITE

    # =========================================================================
    # SLIDE 5: REVIEW GATE 2 — NEEDS ATTENTION & STEERING RECOMMENDATIONS
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg5, COLOR_WHITE)
    add_header(s5, "Review Gate 2 — Needs Attention & Steering Recommendations")
    add_footer_logo(s5, logo_path)

    p_card_w = Inches(5.72)
    p_card_h = Inches(5.35)
    p_card_y = Inches(1.15)
    pad_h5 = Inches(0.28)
    inner_w5 = p_card_w - (pad_h5 * 2)

    # Priority 1: Records & Security Labelling (CRITICAL)
    p1_x = Inches(0.8)
    p1_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x, p_card_y, p_card_w, p_card_h)
    set_shape_flat(p1_card, COLOR_WHITE, COLOR_RED_BORDER, line_width=1.5)

    p1_badge = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(0.20), Inches(1.8), Inches(0.32))
    set_shape_flat(p1_badge, COLOR_RED_BG, COLOR_RED_BORDER, line_width=1)
    b_tf = p1_badge.text_frame
    p = b_tf.paragraphs[0]
    p.text = "PRIORITY 1: CRITICAL"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_RED_TEXT

    _, p1_t_tf = create_textbox(s5, p1_x + pad_h5, p_card_y + Inches(0.60), inner_w5, Inches(0.40))
    p = p1_t_tf.paragraphs[0]
    p.text = "Records & Security Labelling"
    p.font.name = FONT_HEADER
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK

    # Box 1: Observed Issue
    box1 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(1.10), inner_w5, Inches(1.15))
    set_shape_flat(box1, COLOR_LIGHT_GRAY, COLOR_BORDER_GRAY, line_width=1)
    b1_tf = box1.text_frame
    b1_tf.word_wrap = True
    b1_tf.margin_left = Inches(0.20)
    b1_tf.margin_right = Inches(0.20)
    b1_tf.margin_top = Inches(0.12)
    p = b1_tf.paragraphs[0]
    p.text = "OBSERVED ISSUE (SECURITY HEALTH: WEAK)"
    p.font.name = FONT_HEADER
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_RED_TEXT
    p2 = b1_tf.add_paragraph()
    p2.text = "0% retention labels applied. 205 potentially sensitive administrative and student files remain unlabelled in SharePoint document libraries."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(9)
    p2.font.color.rgb = COLOR_CHARCOAL

    # Box 2: Regulatory Impact
    box2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(2.35), inner_w5, Inches(1.25))
    set_shape_flat(box2, COLOR_LIGHT_GRAY, COLOR_BORDER_GRAY, line_width=1)
    b2_tf = box2.text_frame
    b2_tf.word_wrap = True
    b2_tf.margin_left = Inches(0.20)
    b2_tf.margin_right = Inches(0.20)
    b2_tf.margin_top = Inches(0.12)
    p = b2_tf.paragraphs[0]
    p.text = "BUSINESS & COMPLIANCE IMPACT"
    p.font.name = FONT_HEADER
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK
    p2 = b2_tf.add_paragraph()
    p2.text = "Leaves confidential records unclassified in SharePoint, risking compliance breach under BC Freedom of Information and Protection of Privacy Act (FIPPA)."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(9)
    p2.font.color.rgb = COLOR_CHARCOAL

    # Box 3: Prescribed Action
    box3 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(3.70), inner_w5, Inches(1.45))
    set_shape_flat(box3, COLOR_CREAM, COLOR_ORANGE_SECONDARY, line_width=1)
    b3_tf = box3.text_frame
    b3_tf.word_wrap = True
    b3_tf.margin_left = Inches(0.20)
    b3_tf.margin_right = Inches(0.20)
    b3_tf.margin_top = Inches(0.12)
    p = b3_tf.paragraphs[0]
    p.text = "RECOMMENDED ACTION FOR STEERING COMMITTEE"
    p.font.name = FONT_HEADER
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_ORANGE_PRIMARY
    p2 = b3_tf.add_paragraph()
    p2.text = "Configure Microsoft Purview auto-labelling rules and security classifications across all PRM document libraries to automatically enforce retention schedules."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(9.5)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_BLACK

    # Priority 2: Version-Control Maturity (MEDIUM)
    p2_x = p1_x + p_card_w + Inches(0.29)
    p2_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x, p_card_y, p_card_w, p_card_h)
    set_shape_flat(p2_card, COLOR_WHITE, COLOR_AMBER_BORDER, line_width=1.5)

    p2_badge = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(0.20), Inches(1.8), Inches(0.32))
    set_shape_flat(p2_badge, COLOR_AMBER_BG, COLOR_AMBER_BORDER, line_width=1)
    b_p2_tf = p2_badge.text_frame
    p = b_p2_tf.paragraphs[0]
    p.text = "PRIORITY 2: MEDIUM"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER_TEXT

    _, p2_t_tf = create_textbox(s5, p2_x + pad_h5, p_card_y + Inches(0.60), inner_w5, Inches(0.40))
    p = p2_t_tf.paragraphs[0]
    p.text = "Version-Control Maturity"
    p.font.name = FONT_HEADER
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK

    box1_p2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(1.10), inner_w5, Inches(1.15))
    set_shape_flat(box1_p2, COLOR_LIGHT_GRAY, COLOR_BORDER_GRAY, line_width=1)
    b1_p2_tf = box1_p2.text_frame
    b1_p2_tf.word_wrap = True
    b1_p2_tf.margin_left = Inches(0.20)
    b1_p2_tf.margin_right = Inches(0.20)
    b1_p2_tf.margin_top = Inches(0.12)
    p = b1_p2_tf.paragraphs[0]
    p.text = "OBSERVED ISSUE & USER FEEDBACK (HYGIENE HABIT)"
    p.font.name = FONT_HEADER
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER_TEXT
    p2 = b1_p2_tf.add_paragraph()
    p2.text = "Files with 'v2/final/draft' habits increased (468 ➔ 607). PRM Site Owner feedback: 'I still need to learn how to sync my OneDrive with our SP site so I don't need to manually upload documents.'"
    p2.font.name = FONT_BODY
    p2.font.size = Pt(8.5)
    p2.font.color.rgb = COLOR_CHARCOAL

    box2_p2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(2.35), inner_w5, Inches(1.25))
    set_shape_flat(box2_p2, COLOR_LIGHT_GRAY, COLOR_BORDER_GRAY, line_width=1)
    b2_p2_tf = box2_p2.text_frame
    b2_p2_tf.word_wrap = True
    b2_p2_tf.margin_left = Inches(0.20)
    b2_p2_tf.margin_right = Inches(0.20)
    b2_p2_tf.margin_top = Inches(0.12)
    p = b2_p2_tf.paragraphs[0]
    p.text = "OPERATIONAL & COLLABORATION IMPACT"
    p.font.name = FONT_HEADER
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLACK
    p2 = b2_p2_tf.add_paragraph()
    p2.text = "Generates unnecessary document sprawl, storage overhead, and confusion over which copy represents the authorized single source of truth."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(9)
    p2.font.color.rgb = COLOR_CHARCOAL

    box3_p2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(3.70), inner_w5, Inches(1.45))
    set_shape_flat(box3_p2, COLOR_CREAM, COLOR_ORANGE_SECONDARY, line_width=1)
    b3_p2_tf = box3_p2.text_frame
    b3_p2_tf.word_wrap = True
    b3_p2_tf.margin_left = Inches(0.20)
    b3_p2_tf.margin_right = Inches(0.20)
    b3_p2_tf.margin_top = Inches(0.12)
    p = b3_p2_tf.paragraphs[0]
    p.text = "RECOMMENDED ACTION FOR STEERING COMMITTEE"
    p.font.name = FONT_HEADER
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = COLOR_ORANGE_PRIMARY
    p2 = b3_p2_tf.add_paragraph()
    p2.text = "Deliver targeted 15-minute coaching clinics on OneDrive sync vs. manual uploads, native M365 version history, and real-time co-authoring practice sessions."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(9.5)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_BLACK

    # =========================================================================
    # SLIDE 6: REVIEW GATE 2 — FORMAL DECISION & SIGN-OFF BLOCK
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg6, COLOR_WHITE)
    add_header(s6, "Review Gate 2 — Formal Decision & Sign-Off Block")
    add_footer_logo(s6, logo_path)

    so_card_w = Inches(5.72)
    so_card_h = Inches(5.35)
    so_card_y = Inches(1.15)
    pad_h = Inches(0.28)
    inner_w = so_card_w - (pad_h * 2)

    # Left Card: Gate 2 Decision Checklist
    chk_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), so_card_y, so_card_w, so_card_h)
    set_shape_flat(chk_card, COLOR_WHITE, COLOR_BORDER_GRAY, line_width=1)

    _, chk_h_tf = create_textbox(s6, Inches(0.8) + pad_h, so_card_y + Inches(0.18), inner_w, Inches(0.35))
    p = chk_h_tf.paragraphs[0]
    p.text = "Gate 2 Decision Checklist"
    p.font.name = FONT_HEADER
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_ORANGE_PRIMARY

    checklist_items = [
        ("✓ Information Architecture Validated", "Folder count successfully collapsed from 541 to 44 (-91.9%), satisfying Wave 1 structural criteria.", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("✓ Access Control Baseline Established", "Zero 'Everyone' grants and zero folder-level permission exceptions; clean inheritance verified.", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("✓ Staff Training Baseline Complete", "100% of PRM site owners and active members have undergone modern SharePoint enablement.", COLOR_GREEN_BG, COLOR_GREEN_TEXT),
        ("▶ Purview Auto-Labelling Mandate Approved", "Steering committee approves immediate configuration of sensitivity rules for 205 unlabelled files.", COLOR_CREAM, COLOR_ORANGE_PRIMARY),
        ("▶ Checkpoint 4 Transition Authorized", "Program authorizes progression to Checkpoint 4 (Quarterly Review - Dec 2026).", COLOR_BLUE_BG, COLOR_BLUE_TEXT)
    ]
    ch_start_y = so_card_y + Inches(0.60)
    ch_h = Inches(0.84)
    ch_gap = Inches(0.08)
    for idx, (c_head, c_sub, ch_bg, ch_fg) in enumerate(checklist_items):
        cy = ch_start_y + idx * (ch_h + ch_gap)
        box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8) + pad_h, cy, inner_w, ch_h)
        set_shape_flat(box, ch_bg)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.18)
        tf.margin_right = Inches(0.18)
        tf.margin_top = Inches(0.10)
        p = tf.paragraphs[0]
        p.text = c_head
        p.font.name = FONT_HEADER
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = ch_fg

        p2 = tf.add_paragraph()
        p2.text = c_sub
        p2.font.name = FONT_BODY
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_CHARCOAL

    # Right Card: Steering Committee Formal Approvals
    so_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81), so_card_y, so_card_w, so_card_h)
    set_shape_flat(so_card, COLOR_WHITE, COLOR_BORDER_GRAY, line_width=1)

    _, so_h_tf = create_textbox(s6, Inches(6.81) + pad_h, so_card_y + Inches(0.18), inner_w, Inches(0.35))
    p = so_h_tf.paragraphs[0]
    p.text = "Steering Committee Formal Approvals"
    p.font.name = FONT_HEADER
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_ORANGE_PRIMARY

    sign_roles = [
        ("Executive Sponsor", "Darren McKnight", "Senior Leader, Langara College"),
        ("Program Director", "LCP Program Office", "Langara Collaboration Platform"),
        ("Privacy & Records Officer", "PRM Lead", "Privacy & Records Management"),
        ("IT & Governance Lead", "Enterprise Information Services", "IT Operations")
    ]
    s_start_y = so_card_y + Inches(0.60)
    s_box_h = Inches(0.92)
    s_gap = Inches(0.08)
    for idx, (role, name, dept) in enumerate(sign_roles):
        sy = s_start_y + idx * (s_box_h + s_gap)
        box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81) + pad_h, sy, inner_w, s_box_h)
        set_shape_flat(box, COLOR_LIGHT_GRAY, COLOR_BORDER_GRAY, line_width=1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.18)
        tf.margin_right = Inches(0.18)
        tf.margin_top = Inches(0.08)

        p = tf.paragraphs[0]
        p.text = f"{role}:  {name}"
        p.font.name = FONT_HEADER
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = COLOR_BLACK

        p2 = tf.add_paragraph()
        p2.text = f"Title: {dept}"
        p2.font.name = FONT_BODY
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_CHARCOAL

        p3 = tf.add_paragraph()
        p3.text = "Signature: ______________________      Date: _______________"
        p3.font.name = FONT_BODY
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = COLOR_MID_GRAY

    # Bottom Right Sub-note (Matching screenshot: "Langara IT | Increasing the adoption of new technologies in academic and service delivery")
    _, subnote_tf = create_textbox(s6, Inches(6.81) + pad_h, so_card_y + Inches(4.70), inner_w, Inches(0.55))
    p_sn1 = subnote_tf.paragraphs[0]
    p_sn1.text = "Langara IT"
    p_sn1.font.name = FONT_HEADER
    p_sn1.font.size = Pt(10)
    p_sn1.font.bold = True
    p_sn1.font.color.rgb = COLOR_ORANGE_PRIMARY

    p_sn2 = subnote_tf.add_paragraph()
    p_sn2.text = "Increasing the adoption of new technologies in academic and service delivery"
    p_sn2.font.name = FONT_BODY
    p_sn2.font.size = Pt(8.5)
    p_sn2.font.color.rgb = COLOR_CHARCOAL

    # Save to all target paths
    out_paths = [
        'Langara_PRM_Executive_Scorecard.pptx',
        'frontend/public/Langara_PRM_Executive_Scorecard.pptx',
        'frontend/dist/Langara_PRM_Executive_Scorecard.pptx'
    ]
    for p in out_paths:
        dir_name = os.path.dirname(p)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
        prs.save(p)
        print(f"Successfully generated: {p} ({os.path.getsize(p)} bytes)")

if __name__ == '__main__':
    create_deck()
