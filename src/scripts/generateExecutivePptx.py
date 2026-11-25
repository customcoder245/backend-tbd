import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def set_shape_flat(shape, fill_color, line_color=None, line_width=1, corner_radius=0.03):
    """Utility to set flat solid fill, clean border, and modern subtle corner radius."""
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(line_width)
    else:
        shape.line.fill.background()
    
    # Apply subtle, executive corner radius (replaces exaggerated rounded bubble corners)
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

def add_header(slide, title_text, category_text="LANGARA COLLABORATION PLATFORM (LCP) | PID 6738", logo_path=None):
    """Standardized crisp executive slide header."""
    # Subtle top accent bar
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.08))
    set_shape_flat(top_bar, RGBColor(230, 81, 0))

    # Dual-Name Logo at top left with crisp white card background
    header_logo = os.path.abspath('frontend/public/langara_logo_header.png')
    target_logo = header_logo if os.path.exists(header_logo) else logo_path
    if target_logo and os.path.exists(target_logo):
        slide.shapes.add_picture(target_logo, Inches(0.8), Inches(0.24), height=Inches(0.50))

    # Category / Program breadcrumb
    cat_box, cat_tf = create_textbox(slide, Inches(2.6), Inches(0.20), Inches(9.9), Inches(0.25))
    p_cat = cat_tf.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.name = "Segoe UI"
    p_cat.font.size = Pt(8.5)
    p_cat.font.bold = True
    p_cat.font.color.rgb = RGBColor(230, 81, 0)

    # Main Slide Title
    title_box, title_tf = create_textbox(slide, Inches(2.6), Inches(0.42), Inches(9.9), Inches(0.45))
    p_title = title_tf.paragraphs[0]
    p_title.text = title_text
    p_title.font.name = "Segoe UI"
    p_title.font.size = Pt(15.5)
    p_title.font.bold = True
    p_title.font.color.rgb = RGBColor(15, 23, 42)

    # Dividing thin line under header
    div = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.98), Inches(11.733), Inches(0.015))
    set_shape_flat(div, RGBColor(226, 232, 240))

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Executive Color Palette
    c_dark_navy = RGBColor(11, 19, 43)
    c_langara_orange = RGBColor(230, 81, 0)
    c_orange_light = RGBColor(255, 247, 237)
    c_orange_border = RGBColor(254, 215, 170)
    c_slate_bg = RGBColor(248, 250, 252)
    c_card_bg = RGBColor(255, 255, 255)
    c_text_dark = RGBColor(15, 23, 42)
    c_text_muted = RGBColor(100, 116, 139)
    c_border_gray = RGBColor(226, 232, 240)
    
    # Status Colors
    c_green_bg = RGBColor(232, 248, 238)
    c_green_text = RGBColor(30, 130, 76)
    c_green_border = RGBColor(163, 228, 215)
    c_amber_bg = RGBColor(255, 249, 230)
    c_amber_text = RGBColor(180, 83, 9)
    c_amber_border = RGBColor(250, 215, 160)
    c_blue_bg = RGBColor(235, 245, 251)
    c_blue_text = RGBColor(29, 78, 216)
    c_blue_border = RGBColor(174, 214, 241)
    c_red_bg = RGBColor(254, 226, 226)
    c_red_text = RGBColor(185, 28, 28)
    c_red_border = RGBColor(252, 165, 165)

    logo_path = os.path.abspath('frontend/public/langara_logo.png')
    logo_card_path = os.path.abspath('frontend/public/langara_logo_rounded.png')

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (Dark Executive Luxury Theme)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg1, c_dark_navy)

    # Accent decorative strip on left
    strip = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.35), Inches(7.5))
    set_shape_flat(strip, c_langara_orange)

    # Dual-Name Logo with dedicated rounded white container (zero clip, zero overflow)
    logo_w = Inches(3.8)
    logo_h = Inches(3.8 * (364 / 944))
    if os.path.exists(logo_card_path):
        s1.shapes.add_picture(logo_card_path, Inches(1.15), Inches(0.80), width=logo_w)
    elif os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(1.15), Inches(0.80), width=logo_w)

    # Top program tag with generous spacing
    _, tag_tf = create_textbox(s1, Inches(1.15), Inches(2.65), Inches(10.5), Inches(0.35))
    p = tag_tf.paragraphs[0]
    p.text = "LANGARA COLLABORATION PLATFORM (LCP) | PID 6738"
    p.font.name = "Segoe UI"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = RGBColor(245, 124, 0)

    # Title
    _, title_tf = create_textbox(s1, Inches(1.15), Inches(3.05), Inches(11.0), Inches(1.5))
    p = title_tf.paragraphs[0]
    p.text = "Privacy & Records Management (PRM)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(34)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    p2 = title_tf.add_paragraph()
    p2.text = "Benefits Realization Executive Scorecard"
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(28)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(254, 215, 170)

    # Subtitle
    _, sub_tf = create_textbox(s1, Inches(1.15), Inches(4.75), Inches(11.0), Inches(0.45))
    p = sub_tf.paragraphs[0]
    p.text = "Wave: Admin Group 1 • 90-Day Post-Go-Live Review Gate • Stage-Gate Checkpoint 3"
    p.font.name = "Segoe UI"
    p.font.size = Pt(13.5)
    p.font.color.rgb = RGBColor(203, 213, 225)

    # Bottom Metadata Pill Container
    meta_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.15), Inches(5.45), Inches(10.8), Inches(1.35))
    set_shape_flat(meta_box, RGBColor(18, 30, 66), RGBColor(30, 48, 100), line_width=1)
    
    # 4 Metadata Columns inside the pill box
    col_w = Inches(2.55)
    gap = Inches(0.12)
    meta_items = [
        ("ORGANIZATION", "Langara College (Vancouver, BC)"),
        ("GO-LIVE DATE", "June 2, 2026"),
        ("ACTIVE PROGRAM SCORE", "3.9 / 5.0 (78% Index)"),
        ("GOVERNANCE MANDATE", "BC FIPPA & Records Hygiene")
    ]
    for idx, (m_label, m_val) in enumerate(meta_items):
        mx = Inches(1.30) + idx * (col_w + gap)
        _, m_tf = create_textbox(s1, mx, Inches(5.65), col_w, Inches(0.95))
        p1 = m_tf.paragraphs[0]
        p1.text = m_label
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = RGBColor(245, 124, 0)

        p2 = m_tf.add_paragraph()
        p2.text = m_val
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(11)
        p2.font.bold = True
        p2.font.color.rgb = RGBColor(255, 255, 255)

    # =========================================================================
    # SLIDE 2: EXECUTIVE DASHBOARD CANVAS (3 PERFECT NON-OVERLAPPING COLUMNS)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg2, c_slate_bg)
    add_header(s2, "Executive Realization Dashboard — 90-Day Post-Go-Live Review Gate", logo_path=logo_path)

    # 3 Columns Layout
    col_width = Inches(3.68)
    col_gap = Inches(0.34)
    card_y = Inches(1.15)
    card_h = Inches(5.95)

    # -------------------------------------------------------------------------
    # Card 1: Overall Benefits Realization (Left Column)
    # -------------------------------------------------------------------------
    c1_x = Inches(0.8)
    c1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c1_x, card_y, col_width, card_h)
    set_shape_flat(c1, c_langara_orange)

    # Card 1 Header Text
    _, c1_h_tf = create_textbox(s2, c1_x + Inches(0.2), card_y + Inches(0.2), col_width - Inches(0.4), Inches(0.35))
    p = c1_h_tf.paragraphs[0]
    p.text = "Overall Benefits Realization"
    p.font.name = "Segoe UI"
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    # Gauge White Circle
    gauge_size = Inches(1.6)
    gauge_x = c1_x + (col_width - gauge_size) / 2
    gauge_y = card_y + Inches(0.7)
    gauge = s2.shapes.add_shape(MSO_SHAPE.OVAL, gauge_x, gauge_y, gauge_size, gauge_size)
    set_shape_flat(gauge, RGBColor(255, 255, 255))

    # Inner Text in Gauge
    _, g_tf = create_textbox(s2, gauge_x, gauge_y + Inches(0.25), gauge_size, Inches(1.1))
    p1 = g_tf.paragraphs[0]
    p1.text = "3.9"
    p1.alignment = PP_ALIGN.CENTER
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = c_langara_orange

    p2 = g_tf.add_paragraph()
    p2.text = "/ 5.0 (78%)"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(10.5)
    p2.font.bold = True
    p2.font.color.rgb = c_text_muted

    p3 = g_tf.add_paragraph()
    p3.text = "PROGRAM SCORE"
    p3.alignment = PP_ALIGN.CENTER
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(7.5)
    p3.font.bold = True
    p3.font.color.rgb = RGBColor(148, 163, 184)

    # 4 Pillars inside Card 1 (Pill rows with separate text and badge shapes)
    pillar_start_y = card_y + Inches(2.55)
    pillar_row_h = Inches(0.68)
    pillar_row_gap = Inches(0.12)
    pillars = [
        ("Delivery", "On Track", c_green_bg, c_green_text, c_green_border),
        ("Adoption", "On Track", c_green_bg, c_green_text, c_green_border),
        ("Benefits", "Progressing", c_blue_bg, c_blue_text, c_blue_border),
        ("Risk & Compliance", "Monitor", c_amber_bg, c_amber_text, c_amber_border)
    ]
    for idx, (p_name, p_stat, p_bg, p_fg, p_bd) in enumerate(pillars):
        py = pillar_start_y + idx * (pillar_row_h + pillar_row_gap)
        
        # Pill container row
        p_row = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c1_x + Inches(0.18), py, col_width - Inches(0.36), pillar_row_h)
        set_shape_flat(p_row, RGBColor(245, 124, 0))

        # Pillar Name (Left-aligned, width limited so it never overlaps badge)
        _, pn_tf = create_textbox(s2, c1_x + Inches(0.32), py + Inches(0.18), Inches(1.85), Inches(0.32))
        p = pn_tf.paragraphs[0]
        p.text = p_name
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)

        # Badge Shape (Right-aligned, independent shape with clear boundary)
        badge_w = Inches(1.15)
        badge_h = Inches(0.38)
        badge_x = c1_x + col_width - Inches(0.18) - badge_w - Inches(0.1)
        badge_y = py + (pillar_row_h - badge_h) / 2
        badge = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, badge_x, badge_y, badge_w, badge_h)
        set_shape_flat(badge, p_bg, p_bd, line_width=1)
        
        _, b_tf = create_textbox(s2, badge_x, badge_y + Inches(0.06), badge_w, badge_h - Inches(0.12))
        p = b_tf.paragraphs[0]
        p.text = p_stat
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = p_fg

    # -------------------------------------------------------------------------
    # Card 2: Key Outcomes (Center Column)
    # -------------------------------------------------------------------------
    c2_x = c1_x + col_width + col_gap
    c2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c2_x, card_y, col_width, card_h)
    set_shape_flat(c2, c_card_bg, c_border_gray, line_width=1)

    # Card 2 Header
    _, c2_h_tf = create_textbox(s2, c2_x + Inches(0.2), card_y + Inches(0.2), col_width - Inches(0.4), Inches(0.35))
    p = c2_h_tf.paragraphs[0]
    p.text = "Key Outcomes (Post-Go-Live)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = c_text_dark

    # 3 Outcome Tiles inside Card 2
    outcomes = [
        ("Folder Architecture", "541  ➔  44", "(-91.9%)", "Simpler Structure (Max Depth: 8 ➔ 2)", c_green_bg, c_green_text, c_green_border),
        ("Duplicate File Hygiene", "117  ➔  49", "(-58.1%)", "Reduced Redundancy & Clutter", c_green_bg, c_green_text, c_green_border),
        ("Generic File Names", "347  ➔  41", "(-88.2%)", "Standardized Search Findability", c_green_bg, c_green_text, c_green_border)
    ]
    tile_start_y = card_y + Inches(0.7)
    tile_h = Inches(1.58)
    tile_gap = Inches(0.14)
    for idx, (o_title, o_num, o_pct, o_tag, t_bg, t_fg, t_bd) in enumerate(outcomes):
        ty = tile_start_y + idx * (tile_h + tile_gap)
        tile = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c2_x + Inches(0.18), ty, col_width - Inches(0.36), tile_h)
        set_shape_flat(tile, RGBColor(248, 250, 252), c_border_gray, line_width=1)

        # Title
        _, t_tf = create_textbox(s2, c2_x + Inches(0.32), ty + Inches(0.12), col_width - Inches(0.64), Inches(0.26))
        p = t_tf.paragraphs[0]
        p.text = o_title
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = RGBColor(71, 85, 105)

        # Numbers
        _, n_tf = create_textbox(s2, c2_x + Inches(0.32), ty + Inches(0.42), col_width - Inches(0.64), Inches(0.48))
        p = n_tf.paragraphs[0]
        p.text = f"{o_num}  "
        p.font.name = "Segoe UI"
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = RGBColor(216, 67, 21)
        
        # Pct inline
        r = p.add_run()
        r.text = o_pct
        r.font.name = "Segoe UI"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = c_text_muted

        # Tag Badge
        tag_w = Inches(2.9)
        tag_h = Inches(0.34)
        tag_x = c2_x + Inches(0.32)
        tag_y = ty + Inches(1.02)
        tag = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, tag_x, tag_y, tag_w, tag_h)
        set_shape_flat(tag, t_bg, t_bd, line_width=1)

        _, tg_tf = create_textbox(s2, tag_x, tag_y + Inches(0.04), tag_w, tag_h - Inches(0.08))
        p = tg_tf.paragraphs[0]
        p.text = f"↑ {o_tag}"
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = t_fg

    # -------------------------------------------------------------------------
    # Card 3: Value Demonstrated to Date (Right Column)
    # -------------------------------------------------------------------------
    c3_x = c2_x + col_width + col_gap
    c3 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c3_x, card_y, col_width, card_h)
    set_shape_flat(c3, c_card_bg, c_border_gray, line_width=1)

    # Card 3 Header
    _, c3_h_tf = create_textbox(s2, c3_x + Inches(0.2), card_y + Inches(0.2), col_width - Inches(0.4), Inches(0.35))
    p = c3_h_tf.paragraphs[0]
    p.text = "Value Demonstrated to Date"
    p.font.name = "Segoe UI"
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = c_text_dark

    # Value Bullet Items
    value_items = [
        ("91.9% Fewer Folders", "541 reduced to 44; flatter structure and simplified navigation across all PRM document libraries."),
        ("58.1% Fewer Duplicate Files", "117 reduced to 49; improved information hygiene and elimination of version ambiguity."),
        ("Stronger Access Controls", "0 'Everyone' grants; 0 folder-level permission exceptions; clean site-level inheritance enforced."),
        ("100% Staff Enablement", "All PRM site owners and active members completed modern SharePoint training."),
        ("Benefits Still to Validate", "Measurable time savings, automated retention labeling, and sustained compliance through quarterly reviews.")
    ]
    v_start_y = card_y + Inches(0.7)
    v_item_h = Inches(0.98)
    for idx, (vt, vd) in enumerate(value_items):
        vy = v_start_y + idx * (v_item_h + Inches(0.06))
        v_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c3_x + Inches(0.18), vy, col_width - Inches(0.36), v_item_h)
        set_shape_flat(v_box, RGBColor(255, 255, 255), c_border_gray, line_width=1)

        _, v_tf = create_textbox(s2, c3_x + Inches(0.3), vy + Inches(0.1), col_width - Inches(0.6), v_item_h - Inches(0.2))
        p1 = v_tf.paragraphs[0]
        p1.text = f"•  {vt}"
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(10.5)
        p1.font.bold = True
        p1.font.color.rgb = c_langara_orange

        p2 = v_tf.add_paragraph()
        p2.text = vd
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9)
        p2.font.color.rgb = RGBColor(71, 85, 105)

    # =========================================================================
    # SLIDE 3: STRATEGIC BENEFITS SCORECARD (B1 – B9 CLEAN TABLE)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg3, c_slate_bg)
    add_header(s3, "Strategic Benefits Scorecard (Drivers B1 – B9) • Mean Score: 3.9 / 5.0", logo_path=logo_path)

    # Table of 9 Drivers
    table_shape = s3.shapes.add_table(11, 6, Inches(0.8), Inches(1.15), Inches(11.733), Inches(5.95))
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
        cell.fill.fore_color.rgb = RGBColor(15, 23, 42)
        p = cell.text_frame.paragraphs[0]
        p.font.name = "Segoe UI"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER if c_idx in [0, 2, 3, 4] else PP_ALIGN.LEFT

    drivers_data = [
        ("B1", "Improved Collaboration & Productivity", "5.0", "4.2", "On Track", "227 active cloud files; 4.5/5 version control survey, 40.2% ROT reduction (2,175 ➔ 1,300 files).", c_green_bg, c_green_text),
        ("B2", "Enhanced Data Security & Compliance", "5.0", "3.8", "Monitor", "4.5/5 restricted access confidence; 0 'Everyone' grants; 0% Purview labels (205 files unlabelled).", c_amber_bg, c_amber_text),
        ("B3", "Simplified IT Management", "5.0", "4.0", "On Track", "4.5/5 support awareness; 15.1% storage reduction (3.90 ➔ 3.31 GB); 0 path length errors.", c_green_bg, c_green_text),
        ("B4", "Enable Remote Work & Mobility", "5.0", "3.6", "Monitor", "3.5/5 off-site work ease; OneDrive sync coaching required to replace manual file uploads.", c_amber_bg, c_amber_text),
        ("B5", "Improved Decision-Making & BI", "5.0", "4.1", "On Track", "Single source of truth; folder depth 8 ➔ 2 (-75%), folders 541 ➔ 44 (-91.9%), duplicate files -58.1%.", c_green_bg, c_green_text),
        ("B6", "Streamlined Processes", "5.0", "3.7", "Progressing", "4.0/5 collaboration ease; workflow transition underway across PRM libraries.", c_blue_bg, c_blue_text),
        ("B7", "Standardization", "5.0", "3.5", "On Track", "5.0/5 metadata confidence; generic filenames reduced 347 ➔ 41 (-88.2%).", c_green_bg, c_green_text),
        ("B8", "Improved Adoption", "5.0", "4.5", "On Track", "4.5/5 training satisfaction, 4.5/5 team responsiveness; 100% staff training completion (1,151 staff).", c_green_bg, c_green_text),
        ("B9", "Cost Savings", "5.0", "3.9", "Verified", "15.1% storage reduction (3.90 ➔ 3.31 GB); >$70k PBX savings; $280k storage avoidance.", c_green_bg, c_green_text),
    ]

    for r_idx, (did, name, tgt, scr, stat, ev, bg_c, tx_c) in enumerate(drivers_data):
        row_num = r_idx + 1
        row_bg = RGBColor(248, 250, 252) if r_idx % 2 == 1 else RGBColor(255, 255, 255)

        for col_i in range(6):
            table.cell(row_num, col_i).fill.solid()
            table.cell(row_num, col_i).fill.fore_color.rgb = row_bg

        # Driver ID
        c0 = table.cell(row_num, 0)
        c0.text = did
        p = c0.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = c_langara_orange

        # Name
        c1 = table.cell(row_num, 1)
        c1.text = name
        p = c1.text_frame.paragraphs[0]
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = c_text_dark

        # Target
        c2 = table.cell(row_num, 2)
        c2.text = tgt
        p = c2.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.color.rgb = c_text_muted

        # Score
        c3 = table.cell(row_num, 3)
        c3.text = scr
        p = c3.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = c_text_dark

        # Status
        c4 = table.cell(row_num, 4)
        c4.text = stat
        c4.fill.solid()
        c4.fill.fore_color.rgb = bg_c
        p = c4.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = tx_c

        # Evidence
        c5 = table.cell(row_num, 5)
        c5.text = ev
        p = c5.text_frame.paragraphs[0]
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.color.rgb = RGBColor(51, 65, 85)

    # Bottom Mean Summary Row
    mean_row_num = 10
    for col_i in range(6):
        table.cell(mean_row_num, col_i).fill.solid()
        table.cell(mean_row_num, col_i).fill.fore_color.rgb = c_orange_light

    table.cell(mean_row_num, 0).text = "MEAN"
    p = table.cell(mean_row_num, 0).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = c_langara_orange

    table.cell(mean_row_num, 1).text = "Provisional Realization Scorecard Average"
    p = table.cell(mean_row_num, 1).text_frame.paragraphs[0]
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = c_text_dark

    table.cell(mean_row_num, 2).text = "5.0"
    p = table.cell(mean_row_num, 2).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.color.rgb = c_text_muted

    table.cell(mean_row_num, 3).text = "3.9"
    p = table.cell(mean_row_num, 3).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = c_langara_orange

    table.cell(mean_row_num, 4).text = "78% INDEX"
    p = table.cell(mean_row_num, 4).text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_langara_orange

    table.cell(mean_row_num, 5).text = "Active Gate 2/3 Benchmark Satisfied; Transition Authorized to Checkpoint 4."
    p = table.cell(mean_row_num, 5).text_frame.paragraphs[0]
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.color.rgb = c_text_dark

    # =========================================================================
    # SLIDE 4: STAGE-GATE ROADMAP (PERFECTLY PROPORTIONED CARDS)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg4, c_slate_bg)
    add_header(s4, "Benefit Checkpoints Roadmap — Stage-Gate Governance", logo_path=logo_path)

    checkpoints_spec = [
        ("Checkpoint 1", "Baseline", "June 2026", "3.5 / 5.0", "COMPLETED", "Initial post-go-live readiness survey and architecture audit.", c_green_bg, c_green_text, c_green_border, False),
        ("Checkpoint 2", "3-Month Review", "Sept 2026", "3.6 / 5.0", "COMPLETED", "Early adoption metrics and file hygiene validation.", c_green_bg, c_green_text, c_green_border, False),
        ("Checkpoint 3", "90-Day Review", "Nov 2026", "3.9 / 5.0", "ACTIVE GATE", "Formal evaluation for steering committee gate 2 sign-off.", c_langara_orange, RGBColor(255, 255, 255), c_langara_orange, True),
        ("Checkpoint 4", "Quarterly Review", "~ Dec 2026", "TBD", "UPCOMING", "Records retention automation & security labelling assessment.", c_slate_bg, c_text_muted, c_border_gray, False),
        ("Checkpoint 5", "Program Closure", "~ Feb 2027", "TBD", "UPCOMING", "Transition to sustained operations & continuous governance.", c_slate_bg, c_text_muted, c_border_gray, False)
    ]

    card_w = Inches(2.18)
    card_gap = Inches(0.20)
    c4_y = Inches(1.2)
    c4_h = Inches(4.35)

    for idx, (cp_title, cp_phase, cp_date, cp_score, cp_stat, cp_desc, pill_bg, pill_fg, pill_bd, is_active) in enumerate(checkpoints_spec):
        cx = Inches(0.8) + idx * (card_w + card_gap)
        
        # Base Card
        cp_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, c4_y, card_w, c4_h)
        card_fill = c_orange_light if is_active else RGBColor(255, 255, 255)
        card_border = c_langara_orange if is_active else c_border_gray
        set_shape_flat(cp_card, card_fill, card_border, line_width=2 if is_active else 1)

        # Card Title
        _, cp_t_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(0.18), card_w - Inches(0.2), Inches(0.3))
        p = cp_t_tf.paragraphs[0]
        p.text = cp_title
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = c_langara_orange if is_active else c_text_dark

        # Phase Name
        _, ph_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(0.52), card_w - Inches(0.2), Inches(0.28))
        p = ph_tf.paragraphs[0]
        p.text = cp_phase
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = RGBColor(71, 85, 105)

        # Score Box
        _, sc_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(1.0), card_w - Inches(0.2), Inches(0.45))
        p = sc_tf.paragraphs[0]
        p.text = cp_score
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = c_langara_orange if is_active else c_text_dark

        # Date
        _, dt_tf = create_textbox(s4, cx + Inches(0.1), c4_y + Inches(1.5), card_w - Inches(0.2), Inches(0.28))
        p = dt_tf.paragraphs[0]
        p.text = cp_date
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(9.5)
        p.font.color.rgb = c_text_muted

        # Divider inside card
        card_div = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, cx + Inches(0.2), c4_y + Inches(1.9), card_w - Inches(0.4), Inches(0.015))
        set_shape_flat(card_div, c_orange_border if is_active else c_border_gray)

        # Description
        _, ds_tf = create_textbox(s4, cx + Inches(0.15), c4_y + Inches(2.05), card_w - Inches(0.3), Inches(1.4))
        p = ds_tf.paragraphs[0]
        p.text = cp_desc
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(9)
        p.font.color.rgb = RGBColor(71, 85, 105)

        # Bottom Status Badge (strictly positioned near bottom with breathing room)
        b_w = Inches(1.8)
        b_h = Inches(0.38)
        b_x = cx + (card_w - b_w) / 2
        b_y = c4_y + c4_h - b_h - Inches(0.2)
        badge = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, b_x, b_y, b_w, b_h)
        set_shape_flat(badge, pill_bg, pill_bd, line_width=1)

        _, b_tf = create_textbox(s4, b_x, b_y + Inches(0.05), b_w, b_h - Inches(0.1))
        p = b_tf.paragraphs[0]
        p.text = cp_stat
        p.alignment = PP_ALIGN.CENTER
        p.font.name = "Segoe UI"
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = pill_fg

    # Bottom Decision Banner
    crit_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.75), Inches(11.733), Inches(1.35))
    set_shape_flat(crit_box, c_dark_navy)

    _, cb_tf = create_textbox(s4, Inches(1.0), Inches(5.85), Inches(11.333), Inches(1.15))
    p1 = cb_tf.paragraphs[0]
    p1.text = "REVIEW GATE 2 / 3 PASS CRITERIA & STEERING MANDATE"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(245, 124, 0)

    p2 = cb_tf.add_paragraph()
    p2.text = "• Information architecture targets validated: -91.9% folders, -58.1% duplicate files, 100% staff training completion."
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = RGBColor(255, 255, 255)

    p3 = cb_tf.add_paragraph()
    p3.text = "• Active Remediation Mandate: Configure Microsoft Purview automated retention labeling before proceeding to Checkpoint 4 closure."
    p3.font.name = "Segoe UI"
    p3.font.size = Pt(9.5)
    p3.font.color.rgb = RGBColor(255, 255, 255)

    # =========================================================================
    # SLIDE 5: STEERING COMMITTEE PRIORITIES (TWO 50/50 CLEAN CARDS)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg5, c_slate_bg)
    add_header(s5, "Review Gate 2 — Needs Attention & Steering Recommendations", logo_path=logo_path)

    p_card_w = Inches(5.72)
    p_card_h = Inches(5.95)
    p_card_y = Inches(1.15)

    pad_h5 = Inches(0.28)
    inner_w5 = p_card_w - (pad_h5 * 2) # 5.16 inches

    # Priority 1: Records & Security Labelling (CRITICAL)
    p1_x = Inches(0.8)
    p1_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x, p_card_y, p_card_w, p_card_h)
    set_shape_flat(p1_card, RGBColor(255, 255, 255), c_red_border, line_width=1.5)

    # Priority 1 Badge
    p1_badge = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(0.22), Inches(1.8), Inches(0.35))
    set_shape_flat(p1_badge, c_red_bg, c_red_border, line_width=1)
    b_tf = p1_badge.text_frame
    b_tf.word_wrap = True
    b_tf.margin_left = Inches(0.05)
    b_tf.margin_right = Inches(0.05)
    b_tf.margin_top = Inches(0.04)
    b_tf.margin_bottom = Inches(0.04)
    p = b_tf.paragraphs[0]
    p.text = "PRIORITY 1: CRITICAL"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_red_text

    # Title
    _, p1_t_tf = create_textbox(s5, p1_x + pad_h5, p_card_y + Inches(0.68), inner_w5, Inches(0.45))
    p = p1_t_tf.paragraphs[0]
    p.text = "Records & Security Labelling"
    p.font.name = "Segoe UI"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = c_text_dark

    # Box 1: Observed Issue
    box1 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(1.22), inner_w5, Inches(1.25))
    set_shape_flat(box1, RGBColor(248, 250, 252), c_border_gray, line_width=1)
    b1_tf = box1.text_frame
    b1_tf.word_wrap = True
    b1_tf.margin_left = Inches(0.20)
    b1_tf.margin_right = Inches(0.20)
    b1_tf.margin_top = Inches(0.14)
    b1_tf.margin_bottom = Inches(0.10)
    p = b1_tf.paragraphs[0]
    p.text = "OBSERVED ISSUE (SECURITY HEALTH: WEAK)"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_red_text
    p2 = b1_tf.add_paragraph()
    p2.text = "0% retention labels applied. 205 potentially sensitive administrative and student files remain unlabelled in SharePoint document libraries."
    p2.alignment = PP_ALIGN.LEFT
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = RGBColor(71, 85, 105)

    # Box 2: Regulatory Impact
    box2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(2.6), inner_w5, Inches(1.35))
    set_shape_flat(box2, RGBColor(248, 250, 252), c_border_gray, line_width=1)
    b2_tf = box2.text_frame
    b2_tf.word_wrap = True
    b2_tf.margin_left = Inches(0.20)
    b2_tf.margin_right = Inches(0.20)
    b2_tf.margin_top = Inches(0.14)
    b2_tf.margin_bottom = Inches(0.10)
    p = b2_tf.paragraphs[0]
    p.text = "BUSINESS & COMPLIANCE IMPACT"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_text_dark
    p2 = b2_tf.add_paragraph()
    p2.text = "Leaves confidential records unclassified in SharePoint, risking compliance breach under BC Freedom of Information and Protection of Privacy Act (FIPPA)."
    p2.alignment = PP_ALIGN.LEFT
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = RGBColor(71, 85, 105)

    # Box 3: Prescribed Action
    box3 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p1_x + pad_h5, p_card_y + Inches(4.1), inner_w5, Inches(1.55))
    set_shape_flat(box3, c_orange_light, c_orange_border, line_width=1)
    b3_tf = box3.text_frame
    b3_tf.word_wrap = True
    b3_tf.margin_left = Inches(0.20)
    b3_tf.margin_right = Inches(0.20)
    b3_tf.margin_top = Inches(0.14)
    b3_tf.margin_bottom = Inches(0.10)
    p = b3_tf.paragraphs[0]
    p.text = "RECOMMENDED ACTION FOR STEERING COMMITTEE"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_langara_orange
    p2 = b3_tf.add_paragraph()
    p2.text = "Configure Microsoft Purview auto-labelling rules and security classifications across all PRM document libraries to automatically enforce retention schedules."
    p2.alignment = PP_ALIGN.LEFT
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(10)
    p2.font.bold = True
    p2.font.color.rgb = c_text_dark

    # Priority 2: Version-Control Maturity & OneDrive Sync Friction (MEDIUM)
    p2_x = p1_x + p_card_w + Inches(0.29)
    p2_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x, p_card_y, p_card_w, p_card_h)
    set_shape_flat(p2_card, RGBColor(255, 255, 255), c_amber_border, line_width=1.5)

    # Priority 2 Badge
    p2_badge = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(0.22), Inches(1.8), Inches(0.35))
    set_shape_flat(p2_badge, c_amber_bg, c_amber_border, line_width=1)
    b_p2_tf = p2_badge.text_frame
    b_p2_tf.word_wrap = True
    b_p2_tf.margin_left = Inches(0.05)
    b_p2_tf.margin_right = Inches(0.05)
    b_p2_tf.margin_top = Inches(0.04)
    b_p2_tf.margin_bottom = Inches(0.04)
    p = b_p2_tf.paragraphs[0]
    p.text = "PRIORITY 2: MEDIUM"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_amber_text

    # Title
    _, p2_t_tf = create_textbox(s5, p2_x + pad_h5, p_card_y + Inches(0.68), inner_w5, Inches(0.45))
    p = p2_t_tf.paragraphs[0]
    p.text = "Version-Control Maturity"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = c_text_dark

    # Box 1: Observed Issue
    box1_p2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(1.22), inner_w5, Inches(1.25))
    set_shape_flat(box1_p2, RGBColor(248, 250, 252), c_border_gray, line_width=1)
    b1_p2_tf = box1_p2.text_frame
    b1_p2_tf.word_wrap = True
    b1_p2_tf.margin_left = Inches(0.20)
    b1_p2_tf.margin_right = Inches(0.20)
    b1_p2_tf.margin_top = Inches(0.14)
    b1_p2_tf.margin_bottom = Inches(0.10)
    p = b1_p2_tf.paragraphs[0]
    p.text = "OBSERVED ISSUE & USER FEEDBACK (HYGIENE HABIT)"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = c_amber_text
    p2 = b1_p2_tf.add_paragraph()
    p2.text = "Files with 'v2/final/draft' habits increased (468 ➔ 607). PRM Site Owner feedback: 'I still need to learn how to sync my OneDrive with our SP site so I don't need to manually upload documents.'"
    p2.alignment = PP_ALIGN.LEFT
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(8.8)
    p2.font.color.rgb = RGBColor(71, 85, 105)

    # Box 2: Operational Impact
    box2_p2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(2.6), inner_w5, Inches(1.35))
    set_shape_flat(box2_p2, RGBColor(248, 250, 252), c_border_gray, line_width=1)
    b2_p2_tf = box2_p2.text_frame
    b2_p2_tf.word_wrap = True
    b2_p2_tf.margin_left = Inches(0.20)
    b2_p2_tf.margin_right = Inches(0.20)
    b2_p2_tf.margin_top = Inches(0.14)
    b2_p2_tf.margin_bottom = Inches(0.10)
    p = b2_p2_tf.paragraphs[0]
    p.text = "OPERATIONAL & COLLABORATION IMPACT"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_text_dark
    p2 = b2_p2_tf.add_paragraph()
    p2.text = "Generates unnecessary document sprawl, storage overhead, and confusion over which copy represents the authorized single source of truth."
    p2.alignment = PP_ALIGN.LEFT
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = RGBColor(71, 85, 105)

    # Box 3: Prescribed Action
    box3_p2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p2_x + pad_h5, p_card_y + Inches(4.1), inner_w5, Inches(1.55))
    set_shape_flat(box3_p2, c_orange_light, c_orange_border, line_width=1)
    b3_p2_tf = box3_p2.text_frame
    b3_p2_tf.word_wrap = True
    b3_p2_tf.margin_left = Inches(0.20)
    b3_p2_tf.margin_right = Inches(0.20)
    b3_p2_tf.margin_top = Inches(0.14)
    b3_p2_tf.margin_bottom = Inches(0.10)
    p = b3_p2_tf.paragraphs[0]
    p.text = "RECOMMENDED ACTION FOR STEERING COMMITTEE"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = c_langara_orange
    p2 = b3_p2_tf.add_paragraph()
    p2.text = "Deliver targeted 15-minute coaching clinics on OneDrive sync vs. manual uploads, native M365 version history, and real-time co-authoring practice sessions."
    p2.alignment = PP_ALIGN.LEFT
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(9.8)
    p2.font.bold = True
    p2.font.color.rgb = c_text_dark

    # =========================================================================
    # SLIDE 6: STEERING COMMITTEE DECISIONS & SIGN-OFF
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg6, c_slate_bg)
    add_header(s6, "Review Gate 2 — Formal Decision & Sign-Off Block", logo_path=logo_path)

    so_card_w = Inches(5.72)
    so_card_h = Inches(5.95)
    so_card_y = Inches(1.15)
    pad_h = Inches(0.28)
    inner_w = so_card_w - (pad_h * 2) # 5.16 inches

    # Left Card: Gate 2 Decision Checklist
    chk_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), so_card_y, so_card_w, so_card_h)
    set_shape_flat(chk_card, RGBColor(255, 255, 255), c_border_gray, line_width=1)

    _, chk_h_tf = create_textbox(s6, Inches(0.8) + pad_h, so_card_y + Inches(0.22), inner_w, Inches(0.35))
    p = chk_h_tf.paragraphs[0]
    p.text = "Gate 2 Decision Checklist"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = c_langara_orange

    checklist_items = [
        ("✓ Information Architecture Validated", "Folder count successfully collapsed from 541 to 44 (-91.9%), satisfying Wave 1 structural criteria.", c_green_bg, c_green_text),
        ("✓ Access Control Baseline Established", "Zero 'Everyone' grants and zero folder-level permission exceptions; clean inheritance verified.", c_green_bg, c_green_text),
        ("✓ Staff Training Baseline Complete", "100% of PRM site owners and active members have undergone modern SharePoint enablement.", c_green_bg, c_green_text),
        ("▶ Purview Auto-Labelling Mandate Approved", "Steering committee approves immediate configuration of sensitivity rules for 205 unlabelled files.", c_amber_bg, c_amber_text),
        ("▶ Checkpoint 4 Transition Authorized", "Program authorizes progression to Checkpoint 4 (Quarterly Review - Dec 2026).", c_blue_bg, c_blue_text)
    ]
    ch_start_y = so_card_y + Inches(0.70)
    ch_h = Inches(0.92)
    ch_gap = Inches(0.09)
    for idx, (c_head, c_sub, ch_bg, ch_fg) in enumerate(checklist_items):
        cy = ch_start_y + idx * (ch_h + ch_gap)
        box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8) + pad_h, cy, inner_w, ch_h)
        set_shape_flat(box, ch_bg)

        # Write directly into box's text_frame with precise inset margins (zero floating overlap)
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.20)
        tf.margin_right = Inches(0.20)
        tf.margin_top = Inches(0.14)
        tf.margin_bottom = Inches(0.10)

        p = tf.paragraphs[0]
        p.text = c_head
        p.alignment = PP_ALIGN.LEFT
        p.font.name = "Segoe UI"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = ch_fg

        p2 = tf.add_paragraph()
        p2.text = c_sub
        p2.alignment = PP_ALIGN.LEFT
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9)
        p2.font.color.rgb = RGBColor(71, 85, 105)

    # Right Card: Formal Sign-Off Table Block
    so_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81), so_card_y, so_card_w, so_card_h)
    set_shape_flat(so_card, RGBColor(255, 255, 255), c_border_gray, line_width=1)

    _, so_h_tf = create_textbox(s6, Inches(6.81) + pad_h, so_card_y + Inches(0.22), inner_w, Inches(0.35))
    p = so_h_tf.paragraphs[0]
    p.text = "Steering Committee Formal Approvals"
    p.alignment = PP_ALIGN.LEFT
    p.font.name = "Segoe UI"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = c_langara_orange

    sign_roles = [
        ("Executive Sponsor", "Darren McKnight", "Senior Leader, Langara College"),
        ("Program Director", "LCP Program Office", "Langara Collaboration Platform"),
        ("Privacy & Records Officer", "PRM Lead", "Privacy & Records Management"),
        ("IT & Governance Lead", "Enterprise Information Services", "IT Operations")
    ]
    s_start_y = so_card_y + Inches(0.70)
    s_box_h = Inches(1.12)
    s_gap = Inches(0.14)
    for idx, (role, name, dept) in enumerate(sign_roles):
        sy = s_start_y + idx * (s_box_h + s_gap)
        box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.81) + pad_h, sy, inner_w, s_box_h)
        set_shape_flat(box, RGBColor(248, 250, 252), c_border_gray, line_width=1)

        # Write directly into box's text_frame with precise inset margins (zero floating overlap)
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.20)
        tf.margin_right = Inches(0.20)
        tf.margin_top = Inches(0.14)
        tf.margin_bottom = Inches(0.10)

        p = tf.paragraphs[0]
        p.text = f"{role}:  {name}"
        p.alignment = PP_ALIGN.LEFT
        p.font.name = "Segoe UI"
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = c_text_dark

        p2 = tf.add_paragraph()
        p2.text = f"Title: {dept}"
        p2.alignment = PP_ALIGN.LEFT
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(9)
        p2.font.color.rgb = c_text_muted

        p3 = tf.add_paragraph()
        p3.text = "Signature: ______________________      Date: _______________"
        p3.alignment = PP_ALIGN.LEFT
        p3.font.name = "Segoe UI"
        p3.font.size = Pt(9)
        p3.font.color.rgb = RGBColor(148, 163, 184)

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
