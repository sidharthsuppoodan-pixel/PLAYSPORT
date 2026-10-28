import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as ReportLabImage, PageBreak, KeepTogether, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from PIL import Image as PILImage

SCREENSHOTS_DIR = "/Users/madhavsuppoodan/playsport/documentation/screenshots"
OUTPUT_PDF = "/Users/madhavsuppoodan/playsport/documentation/PLAYSPORT_Testing_Screenshots_Dossier.pdf"

def get_scaled_image(img_path, max_width=510, max_height=320):
    """Calculates dimensions maintaining aspect ratio for ReportLab."""
    with PILImage.open(img_path) as im:
        orig_w, orig_h = im.size
    
    aspect = orig_h / orig_w
    target_w = max_width
    target_h = target_w * aspect

    if target_h > max_height:
        target_h = max_height
        target_w = target_h / aspect

    return ReportLabImage(img_path, width=target_w, height=target_h)

def generate_screenshots_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    doc_title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#111827'),
        spaceAfter=6
    )

    doc_subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#16a34a'),
        spaceAfter=15
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#374151')
    )

    meta_bold = ParagraphStyle(
        'MetaBold',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#111827')
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=6
    )

    fig_title = ParagraphStyle(
        'FigTitle',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )

    fig_desc = ParagraphStyle(
        'FigDesc',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#475569')
    )

    status_pass = ParagraphStyle(
        'StatusPass',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#15803d')
    )

    story = []

    # ---------------- COVER / HEADER SECTION ----------------
    story.append(Paragraph("PLAYSPORT", doc_title_style))
    story.append(Paragraph("Automated Testing Execution & Visual Evidence Dossier", doc_subtitle_style))

    # Metadata summary table
    summary_data = [
        [
            Paragraph("<b>Project:</b> PLAYSPORT Sports Platform", meta_style),
            Paragraph("<b>Total Test Cases:</b> 29 Automated Tests", meta_style)
        ],
        [
            Paragraph("<b>Author:</b> Sidharth Suppoodan", meta_style),
            Paragraph("<b>Overall Pass Rate:</b> <b><font color='#16a34a'>100% PASSED (0 Failures)</font></b>", meta_style)
        ],
        [
            Paragraph("<b>Test Frameworks:</b> Pytest, Vitest, Selenium WebDriver", meta_style),
            Paragraph("<b>Execution Mode:</b> Headless Chrome / In-Memory SQLite", meta_style)
        ],
        [
            Paragraph("<b>Target Environment:</b> macOS / Python 3.9 / React 18", meta_style),
            Paragraph("<b>Execution Date:</b> 26/10/2026", meta_style)
        ]
    ]

    t_summary = Table(summary_data, colWidths=[255, 260])
    t_summary.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 15))

    # Helper function to render a figure item
    def add_screenshot_figure(img_filename, title, desc, test_ref, max_h=285):
        img_path = os.path.join(SCREENSHOTS_DIR, img_filename)
        if not os.path.exists(img_path):
            return

        fig_table_data = [
            [
                Paragraph(f"<b>{title}</b><br/><font color='#64748b' size='7.5'>Ref: {test_ref}</font>", fig_title),
                Paragraph("STATUS: <b>PASS ✓</b>", status_pass)
            ],
            [
                Paragraph(desc, fig_desc), ''
            ]
        ]
        fig_header_tbl = Table(fig_table_data, colWidths=[390, 125])
        fig_header_tbl.setStyle(TableStyle([
            ('SPAN', (0, 1), (1, 1)),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))

        img_widget = get_scaled_image(img_path, max_width=515, max_height=max_h)

        # Image border wrapper table
        img_box = Table([[img_widget]], colWidths=[515])
        img_box.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#94a3b8')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LEFTPADDING', (0,0), (-1,-1), 2),
            ('RIGHTPADDING', (0,0), (-1,-1), 2),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#000000')),
        ]))

        block = KeepTogether([
            fig_header_tbl,
            Spacer(1, 4),
            img_box,
            Spacer(1, 14)
        ])
        story.append(block)

    # ---------------- SECTION 1: PYTEST HTML AUTOMATED DASHBOARD ----------------
    story.append(Paragraph("1. Pytest-HTML Automated Test Dashboard Execution Report", section_heading))
    add_screenshot_figure(
        "01_pytest_html_report.png",
        "Figure 1.1: Automated Pytest-HTML Suite Execution Overview",
        "Visual proof of 14 passed Selenium automated browser tests with 100% pass rate, zero regressions, and environment metadata.",
        "tests/test_e2e.py & tests/report.html",
        max_h=270
    )

    story.append(PageBreak())

    # ---------------- SECTION 2: TERMINAL EXECUTION OUTPUTS ----------------
    story.append(Paragraph("2. Terminal Test Execution Proofs (Backend & Frontend)", section_heading))
    
    add_screenshot_figure(
        "09_terminal_backend_tests.png",
        "Figure 2.1: FastAPI Backend Integration Test Suite (Pytest)",
        "13 isolated integration tests passing in 4.62s across Authentication, Concurrency/Double-Booking, Slots, Matches, Tournaments, and Turfs.",
        "backend/tests/ (13/13 PASSED)",
        max_h=230
    )

    add_screenshot_figure(
        "10_terminal_frontend_tests.png",
        "Figure 2.2: React Frontend Component Test Suite (Vitest)",
        "Isolated JSDOM headless component tests passing with zero regressions under Vite & Vitest test runner.",
        "frontend/src/components/Footer.test.jsx (2/2 PASSED)",
        max_h=130
    )

    story.append(PageBreak())

    # ---------------- SECTION 3: E2E TERMINAL & BROWSER TESTING ----------------
    story.append(Paragraph("3. Selenium WebDriver E2E Automation Terminal Output", section_heading))
    add_screenshot_figure(
        "11_terminal_e2e_tests.png",
        "Figure 3.1: Deep End-to-End Selenium Terminal Output",
        "Comprehensive browser automation suite executing 14 test cases spanning modal interactions, form validations, search params, and checkout.",
        "tests/test_e2e.py (14/14 PASSED)",
        max_h=260
    )

    story.append(PageBreak())

    # ---------------- SECTION 4: LIVE BROWSER WORKFLOW SCREENSHOTS ----------------
    story.append(Paragraph("4. End-to-End Browser Testing Visual Evidence", section_heading))

    add_screenshot_figure(
        "03_homepage_layout.png",
        "Figure 4.1: Homepage Layout & Global Navigation Verification",
        "Verifies homepage load, Stitch design system rendering, navbar routing elements, and dynamic sport category cards.",
        "Test Case: PS_TC_01 / ST-E2E-001 (test_homepage_loads)",
        max_h=230
    )

    add_screenshot_figure(
        "04_turfs_search.png",
        "Figure 4.2: Turf Discovery & Dynamic Query Search Execution",
        "Validates interactive search text input query binding (?search=football) and dynamic filtered facility card rendering.",
        "Test Case: PS_TC_03 / ST-E2E-007 (test_search_functionality)",
        max_h=230
    )

    story.append(PageBreak())

    add_screenshot_figure(
        "05_auth_modal.png",
        "Figure 4.3: Customer Authentication Modal & Input Validation",
        "Tests Sign-In / Register dialog mounting, form validation, and credential submission workflows.",
        "Test Case: PS_TC_01 / ST-E2E-008 & ST-E2E-011",
        max_h=230
    )

    add_screenshot_figure(
        "06_turf_slot_picker.png",
        "Figure 4.4: Facility Detail Page & Real-Time Pitch Slot Matrix",
        "Verifies interactive time slot selection (:00 slots), multi-pitch tabs, hourly price calculations, and checkout activation.",
        "Test Case: PS_TC_02 & PS_TC_03 (test_complete_booking_workflow)",
        max_h=230
    )

    story.append(PageBreak())

    add_screenshot_figure(
        "07_booking_confirmed_modal.png",
        "Figure 4.5: Booking Confirmation Celebration & Digital Invoice",
        "Validates atomic reservation submission, double-booking prevention check, reference generation, and confetti modal.",
        "Test Case: PS_TC_02 & PS_TC_03 (test_complete_booking_workflow)",
        max_h=230
    )

    add_screenshot_figure(
        "08_owner_dashboard.png",
        "Figure 4.6: Turf Owner Facility Onboarding & Operations Dashboard",
        "Tests owner authentication, facility listing registration modal, calendar pitch slot generators, and live ground monitors.",
        "Test Case: PS_TC_05 / ST-E2E-014 (test_owner_workflow)",
        max_h=230
    )

    doc.build(story)
    print(f"Successfully generated Testing Screenshots PDF at: {OUTPUT_PDF}")

if __name__ == "__main__":
    generate_screenshots_pdf()
