import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_test_report_pdf(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom typography styles matching the reference image
    outer_title_style = ParagraphStyle(
        'OuterTitle',
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.black,
        spaceAfter=10
    )

    tbl_header_lg = ParagraphStyle(
        'TblHeaderLg',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.black
    )

    tbl_header_md = ParagraphStyle(
        'TblHeaderMd',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.black
    )

    tbl_cell_label = ParagraphStyle(
        'TblCellLabel',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.black
    )

    tbl_col_header = ParagraphStyle(
        'TblColHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.black
    )

    tbl_col_header_center = ParagraphStyle(
        'TblColHeaderCenter',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        alignment=TA_CENTER,
        textColor=colors.black
    )

    tbl_cell_text = ParagraphStyle(
        'TblCellText',
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.black
    )

    tbl_cell_center = ParagraphStyle(
        'TblCellCenter',
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        alignment=TA_CENTER,
        textColor=colors.black
    )

    tbl_cell_status = ParagraphStyle(
        'TblCellStatus',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        alignment=TA_CENTER,
        textColor=colors.black
    )

    test_cases_data = [
        {
            "outer_title": "Test Case 1 Login and authentication",
            "tc_num": "Test Case 1",
            "project_name": "Project Name: PLAYSPORT",
            "tc_subtitle": "Login and authentication Test Case",
            "tc_id": "PS_TC_01",
            "designed_by": "Sidharth Suppoodan",
            "priority": "High",
            "designed_date": "22/10/2026",
            "module": "Login and authentication",
            "executed_by": "Automated test runner",
            "title": "Login, MFA challenge and session isolation",
            "execution_date": "24/10/2026",
            "description": "Exercise the login UI and account changes with controlled responses across roles (Customer, Admin), validate credential verification, JWT token issuance, and session error responses.",
            "precondition": "FastAPI backend and test fixtures active; seeded valid customer and admin accounts; valid and rejected API responses.",
            "postcondition": "Client authentication behavior verified with mocks and live services; JWT bearer session established.",
            "steps": [
                (
                    "1",
                    "Submit valid login once",
                    "Eligible fixture account:<br/>arjun.nair@example.com",
                    "One request; success callback with JWT Bearer token",
                    "Login callback assertion passed; role CUSTOMER verified",
                    "PASS"
                ),
                (
                    "2",
                    "Return admin challenge",
                    "Admin credentials:<br/>admin@playsport.com",
                    "HTTP 200 OK; Return admin token; role verified as ADMIN",
                    "Admin callback assertion passed; ALEX ADMIN access granted",
                    "PASS"
                ),
                (
                    "3",
                    "Reject credentials",
                    "Error response fixture:<br/>WrongPassword!",
                    "HTTP 401 Unauthorized; Display error; do not report success",
                    "Failure message assertion passed; no token issued",
                    "PASS"
                ),
                (
                    "4",
                    "Submit empty login form in UI",
                    "Empty input fields",
                    "Halt submission; display inline validation error",
                    "Validation error assertion passed; submission halted",
                    "PASS"
                ),
                (
                    "5",
                    "Switch account during session read",
                    "Two account identities (Customer and Owner)",
                    "Clear private cache; restrict route access strictly by RBAC",
                    "Account isolation assertion passed; state segmented",
                    "PASS"
                )
            ]
        },
        {
            "outer_title": "Test Case 2 Turf Slot Reservation and Concurrency Control",
            "tc_num": "Test Case 2",
            "project_name": "Project Name: PLAYSPORT",
            "tc_subtitle": "Turf Booking & Concurrency Collision Test Case",
            "tc_id": "PS_TC_02",
            "designed_by": "Sidharth Suppoodan",
            "priority": "High",
            "designed_date": "22/10/2026",
            "module": "Booking Engine & Concurrency Guard",
            "executed_by": "Automated test runner",
            "title": "Atomic Slot Reservation and Double-Booking Prevention",
            "execution_date": "24/10/2026",
            "description": "Verify that database-level pessimistic row locking (SELECT ... FOR UPDATE) within an atomic transaction prevents two concurrent customers from booking the exact same pitch slot.",
            "precondition": "Active turf ground with batch-generated available time slots; two distinct authenticated customer sessions (Customer 1 & Customer 2).",
            "postcondition": "Only one valid booking entry is retained in database; composite unique constraint (ground_id, slot_date, start_time) remains unviolated.",
            "steps": [
                (
                    "1",
                    "Batch-generate slots as facility owner",
                    "turf_id: 1, ground_id: 1<br/>hours: 14:00 - 18:00",
                    "HTTP 200 OK; Consecutive hourly slot records created with status AVAILABLE",
                    "HTTP 200; Slots generated and available in pitch schedule",
                    "PASS"
                ),
                (
                    "2",
                    "Customer 1 books available time slot",
                    "Customer 1 Token<br/>target_slot_id: 101",
                    "HTTP 201 Created; Status CONFIRMED; Booking ref starts with 'STC-'",
                    "HTTP 201 Created; Reference 'STC-XXXXXXXX' generated; Slot status BOOKED",
                    "PASS"
                ),
                (
                    "3",
                    "Customer 2 attempts collision booking on same slot",
                    "Customer 2 Token<br/>identical slot_id: 101",
                    "HTTP 409 Conflict; Reject transaction; detail: Double-booking prevented",
                    "HTTP 409 Conflict; Atomic rollback executed; collision prevented",
                    "PASS"
                ),
                (
                    "4",
                    "Query slot availability status",
                    "GET /api/slots/by-ground/1",
                    "Target slot marked as BOOKED; excluded from available inventory",
                    "Target slot confirmed unavailable; zero data corruption",
                    "PASS"
                )
            ]
        },
        {
            "outer_title": "Test Case 3 End-to-End Booking Workflow (Selenium WebDriver)",
            "tc_num": "Test Case 3",
            "project_name": "Project Name: PLAYSPORT",
            "tc_subtitle": "End-to-End Booking Workflow Test Case",
            "tc_id": "PS_TC_03",
            "designed_by": "Sidharth Suppoodan",
            "priority": "High",
            "designed_date": "22/10/2026",
            "module": "Customer Booking Workflow",
            "executed_by": "Automated test runner (Selenium E2E)",
            "title": "Client-Side Slot Selection, Auth Intercept & Booking Celebration",
            "execution_date": "24/10/2026",
            "description": "Validate the complete browser journey: browsing turf listings, viewing pitch schedules, selecting hourly slots, completing authentication challenge, and displaying the booking celebration modal.",
            "precondition": "React frontend running on localhost:5173, FastAPI backend on localhost:8000; seeded PlayZone Arena turf with available slots.",
            "postcondition": "Confirmed booking record stored in database; reference displayed to customer; slot updated to booked in UI.",
            "steps": [
                (
                    "1",
                    "Navigate to Turfs listing and select venue",
                    "URL: /turfs<br/>Target: PlayZone Arena",
                    "Browser routes to venue detail page; Pitch tabs and slot grid rendered",
                    "Venue detail loaded; Hourly slot badges visible in DOM",
                    "PASS"
                ),
                (
                    "2",
                    "Select available time slot badge",
                    "Click ':00' slot button",
                    "Slot active styling applied; 'Proceed to Booking' action button activates",
                    "Button highlighted; Total checkout price reflected in summary",
                    "PASS"
                ),
                (
                    "3",
                    "Trigger unauthenticated checkout check",
                    "Click 'Proceed to Booking'",
                    "Intercept checkout; Display Sign In authentication modal dialog",
                    "Modal dialog rendered on screen with credential inputs",
                    "PASS"
                ),
                (
                    "4",
                    "Authenticate credentials in modal",
                    "arjun.nair@example.com<br/>Customer@123",
                    "Validate credentials; Dismiss modal; Restore active booking state",
                    "Modal closed; User authenticated without losing chosen slot",
                    "PASS"
                ),
                (
                    "5",
                    "Confirm reservation and trigger celebration",
                    "Click final 'Proceed to Booking'",
                    "Booking submitted; 'Booking Confirmed!' modal displayed with confetti",
                    "Modal verified in DOM containing 'Booking Confirmed!'",
                    "PASS"
                )
            ]
        },
        {
            "outer_title": "Test Case 4 Open Match Matchmaking and Capacity Clamping",
            "tc_num": "Test Case 4",
            "project_name": "Project Name: PLAYSPORT",
            "tc_subtitle": "Open Match Matchmaking Test Case",
            "tc_id": "PS_TC_04",
            "designed_by": "Sidharth Suppoodan",
            "priority": "Medium",
            "designed_date": "22/10/2026",
            "module": "Athlete Matchmaking & Open Matches",
            "executed_by": "Automated test runner",
            "title": "Open Match Creation, Player Joining & Dynamic Capacity Clamping",
            "execution_date": "24/10/2026",
            "description": "Validate that social matchmaking lobbies dynamically track joined participants, lock status transitions when maximum capacity is reached, and prevent player oversubscription.",
            "precondition": "Active database session; match creator account and two distinct athlete profiles (Player A, Player B).",
            "postcondition": "Match lobby capacity is strictly clamped to max_players; roster list accurately stores player foreign keys.",
            "steps": [
                (
                    "1",
                    "Create Open Match lobby with capacity limit",
                    "sport: Badminton<br/>max_players: 2",
                    "HTTP 201 Created; Lobby initialized with status OPEN, current_players: 0",
                    "HTTP 201 Created; Match ID generated with max_players = 2",
                    "PASS"
                ),
                (
                    "2",
                    "First athlete joins open lobby",
                    "rahul.kumar@example.com",
                    "HTTP 200 OK; current_players increments to 1; status remains OPEN",
                    "HTTP 200; current_players = 1; status = OPEN confirmed",
                    "PASS"
                ),
                (
                    "3",
                    "Second athlete joins and fills lobby capacity",
                    "sarah.j@example.com",
                    "HTTP 200 OK; current_players increments to 2; status transitions to FULL",
                    "HTTP 200; current_players = 2; status automatically converted to FULL",
                    "PASS"
                ),
                (
                    "4",
                    "Third athlete attempts to join full lobby",
                    "arjun.nair@example.com",
                    "HTTP 400 Bad Request; Join rejected; Detail indicates match full",
                    "HTTP 400 Bad Request returned; Roster clamped; Zero oversubscription",
                    "PASS"
                )
            ]
        },
        {
            "outer_title": "Test Case 5 Facility Turf Registration and Admin Approval",
            "tc_num": "Test Case 5",
            "project_name": "Project Name: PLAYSPORT",
            "tc_subtitle": "Facility Onboarding & Admin Moderation Test Case",
            "tc_id": "PS_TC_05",
            "designed_by": "Sidharth Suppoodan",
            "priority": "Medium",
            "designed_date": "22/10/2026",
            "module": "Turf Owner & Super Admin Moderation",
            "executed_by": "Automated test runner",
            "title": "Turf Registration Submission, Pending Queue Isolation & Admin Approval",
            "execution_date": "24/10/2026",
            "description": "Exercise facility onboarding workflow: turf owners submit new facility details, the listing enters a pending review queue, and only goes live upon platform administrator approval.",
            "precondition": "Authenticated Turf Owner account and active Super Admin account; clean turf moderation queue.",
            "postcondition": "Facility is published on the live discovery feed; owner granted permission to generate calendar pitch slots.",
            "steps": [
                (
                    "1",
                    "Owner submits venue registration form",
                    "name: 'Green Field Arena'<br/>city: 'Kochi'",
                    "HTTP 201 Created; Record created with is_approved=False / status=PENDING",
                    "HTTP 201; Confirmation alert: 'submitted for approval' rendered",
                    "PASS"
                ),
                (
                    "2",
                    "Verify unapproved venue hidden from public catalog",
                    "GET /api/turfs (Public view)",
                    "Unapproved venue is excluded from public search and listings",
                    "Public API query returns only verified/approved facilities",
                    "PASS"
                ),
                (
                    "3",
                    "Super Admin inspects pending onboarding queue",
                    "Admin JWT Token<br/>GET /api/admin/pending-turfs",
                    "HTTP 200 OK; Returns list of unapproved facilities awaiting review",
                    "HTTP 200; Green Field Arena present in moderation table",
                    "PASS"
                ),
                (
                    "4",
                    "Admin executes facility approval",
                    "POST /api/admin/turfs/{id}/approve",
                    "HTTP 200 OK; is_approved toggles to True; Listing goes live",
                    "HTTP 200; Approved flag updated; Facility immediately searchable",
                    "PASS"
                )
            ]
        }
    ]

    story = []

    # Printable width on A4 with 36pt margins: 595.27 - 72 = 523.27
    col_widths = [22, 108, 110, 118, 118, 47]
    half_width = 523.27 / 2

    for i, tc in enumerate(test_cases_data):
        # Outer heading
        story.append(Paragraph(tc["outer_title"], outer_title_style))

        # Build table rows
        table_data = []

        # Row 0: Test Case X
        table_data.append([
            Paragraph(f"<b>{tc['tc_num']}</b>", tbl_header_lg), '', '', '', '', ''
        ])

        # Row 1: Project Name
        table_data.append([
            Paragraph(f"<b>{tc['project_name']}</b>", tbl_header_md), '', '', '', '', ''
        ])

        # Row 2: Module Subtitle Test Case
        table_data.append([
            Paragraph(f"<b>{tc['tc_subtitle']}</b>", tbl_header_md), '', '', '', '', ''
        ])

        # Row 3: ID & Designed By
        table_data.append([
            Paragraph(f"<b>Test Case ID:</b> {tc['tc_id']}", tbl_cell_label), '', '',
            Paragraph(f"<b>Test Designed By:</b> {tc['designed_by']}", tbl_cell_label), '', ''
        ])

        # Row 4: Priority & Designed Date
        table_data.append([
            Paragraph(f"<b>Test Priority:</b> {tc['priority']}", tbl_cell_label), '', '',
            Paragraph(f"<b>Test Designed Date:</b> {tc['designed_date']}", tbl_cell_label), '', ''
        ])

        # Row 5: Module & Executed By
        table_data.append([
            Paragraph(f"<b>Module:</b> {tc['module']}", tbl_cell_label), '', '',
            Paragraph(f"<b>Test Executed By:</b> {tc['executed_by']}", tbl_cell_label), '', ''
        ])

        # Row 6: Title & Execution Date
        table_data.append([
            Paragraph(f"<b>Test Title:</b> {tc['title']}", tbl_cell_label), '', '',
            Paragraph(f"<b>Test Execution Date:</b> {tc['execution_date']}", tbl_cell_label), '', ''
        ])

        # Row 7: Description
        table_data.append([
            Paragraph(f"<b>Description:</b> {tc['description']}", tbl_cell_label), '', '', '', '', ''
        ])

        # Row 8: Pre-Condition
        table_data.append([
            Paragraph(f"<b>Pre-Condition:</b> {tc['precondition']}", tbl_cell_label), '', '', '', '', ''
        ])

        # Row 9: Table Column Headers (#, Test Step, Test Data, Expected Result, Actual Result, Status)
        table_data.append([
            Paragraph("#", tbl_col_header_center),
            Paragraph("Test Step", tbl_col_header),
            Paragraph("Test Data", tbl_col_header),
            Paragraph("Expected Result", tbl_col_header),
            Paragraph("Actual Result", tbl_col_header),
            Paragraph("Status", tbl_col_header_center)
        ])

        # Steps rows
        step_start_idx = 10
        for step in tc["steps"]:
            table_data.append([
                Paragraph(step[0], tbl_cell_center),
                Paragraph(step[1], tbl_cell_text),
                Paragraph(step[2], tbl_cell_text),
                Paragraph(step[3], tbl_cell_text),
                Paragraph(step[4], tbl_cell_text),
                Paragraph(step[5], tbl_cell_status)
            ])

        # Post-condition row
        post_cond_idx = step_start_idx + len(tc["steps"])
        table_data.append([
            Paragraph(f"<b>Post-Condition:</b> {tc['postcondition']}", tbl_cell_label), '', '', '', '', ''
        ])

        # Build table styling matching the exact black bordered appearance
        t_style = [
            # Spans for header rows
            ('SPAN', (0, 0), (5, 0)),
            ('SPAN', (0, 1), (5, 1)),
            ('SPAN', (0, 2), (5, 2)),
            
            # Spans for 2-column metadata rows
            ('SPAN', (0, 3), (2, 3)),
            ('SPAN', (3, 3), (5, 3)),
            ('SPAN', (0, 4), (2, 4)),
            ('SPAN', (3, 4), (5, 4)),
            ('SPAN', (0, 5), (2, 5)),
            ('SPAN', (3, 5), (5, 5)),
            ('SPAN', (0, 6), (2, 6)),
            ('SPAN', (3, 6), (5, 6)),

            # Spans for Description & Pre-condition
            ('SPAN', (0, 7), (5, 7)),
            ('SPAN', (0, 8), (5, 8)),

            # Span for Post-condition
            ('SPAN', (0, post_cond_idx), (5, post_cond_idx)),

            # Outer box border
            ('BOX', (0, 0), (-1, -1), 1.2, colors.black),

            # Inner grid borders
            ('INNERGRID', (0, 0), (-1, -1), 0.7, colors.black),

            # Vertical and horizontal alignments
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),

            # Slight background tints for header aesthetics
            ('BACKGROUND', (0, 0), (5, 0), colors.HexColor('#F8F8F8')),
            ('BACKGROUND', (0, 9), (5, 9), colors.HexColor('#F4F4F4')),
        ]

        # Assemble ReportLab Table
        tbl = Table(table_data, colWidths=col_widths, repeatRows=0)
        tbl.setStyle(TableStyle(t_style))

        # Wrap in KeepTogether to ensure each table remains solid on one page
        story.append(KeepTogether([tbl]))

        if i < len(test_cases_data) - 1:
            story.append(PageBreak())

    doc.build(story)
    print(f"Successfully generated PDF report at: {output_pdf_path}")

if __name__ == "__main__":
    out_path = "/Users/madhavsuppoodan/playsport/documentation/PLAYSPORT_Test_Case_Report.pdf"
    create_test_report_pdf(out_path)
