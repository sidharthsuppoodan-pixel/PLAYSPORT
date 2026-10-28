# PLAYSPORT — Formal Test Case Specification & Execution Report
**Project Name:** PLAYSPORT (Sports Facility Management & Athlete Matchmaking Platform)  
**Document Type:** Software Testing & Quality Assurance Report  
**Test Suite:** Pytest Integration Fixtures & Selenium WebDriver End-to-End (E2E) Automation  
**Author:** Sidharth Suppoodan  

---

### Test Case 1: Login and Authentication

<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1.5px solid black; font-family: Arial, sans-serif; font-size: 13px;">
  <tr>
    <td colspan="6" style="font-weight: bold; font-size: 15px; border-bottom: 1.5px solid black; background-color: #f9f9f9;">Test Case 1</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Project Name: PLAYSPORT</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Login and authentication Test Case</td>
  </tr>
  <tr>
    <td colspan="3" style="width: 50%; border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Case ID:</b> PS_TC_01</td>
    <td colspan="3" style="width: 50%; border-bottom: 1px solid black;"><b>Test Designed By:</b> Sidharth Suppoodan</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Priority:</b> High</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Designed Date:</b> 22/10/2026</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Module:</b> Login and authentication</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Executed By:</b> Automated test runner (Pytest / Selenium)</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Title:</b> User Authentication, Credential Verification & Session Isolation</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Execution Date:</b> 24/10/2026</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1px solid black;"><b>Description:</b> Exercise user authentication across roles (Customer, Admin), validate credential verification, JWT token issuance, client-side input validation, and session error responses.</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1.5px solid black;"><b>Pre-Condition:</b> FastAPI backend and test database active; seeded test accounts (Customer, Admin) initialized; valid and rejected auth request fixtures.</td>
  </tr>
  <tr style="background-color: #f2f2f2; font-weight: bold; text-align: left;">
    <th style="width: 5%; border-right: 1px solid black; border-bottom: 1px solid black; text-align: center;">#</th>
    <th style="width: 25%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Step</th>
    <th style="width: 18%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Data</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Expected Result</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Actual Result</th>
    <th style="width: 8%; border-bottom: 1px solid black; text-align: center;">Status</th>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">1</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Submit valid customer credentials</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">email: arjun.nair@example.com<br>password: Customer@123</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200 OK; Return JWT Bearer token; User role set to CUSTOMER</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200; Access token issued; Customer profile asserted successfully</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">2</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Submit valid platform administrator credentials</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">email: admin@playsport.com<br>password: Admin@123</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200 OK; Return JWT token; Role verified as ADMIN</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200; Access token generated; Full Name: ALEX ADMIN verified</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">3</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Reject invalid password attempt</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">email: arjun.nair@example.com<br>password: WrongPassword!</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 401 Unauthorized; Error response returned; No token issued</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 401 Unauthorized returned; Assertion passed without state change</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">4</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Submit empty login form in frontend UI</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Email: [empty]<br>Password: [empty]</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Halt API dispatch; Display inline validation warning to user</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Validation error banner rendered on screen; Form submission prevented</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">5</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Register new customer athlete account</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">name: Test Athlete<br>phone: 9876500000<br>password: SecurePassword123!</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201 Created; Record saved with hashed password; JWT issued</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201 Created; Full name converted to uppercase; JWT access token verified</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td colspan="6" style="border-top: 1.5px solid black;"><b>Post-Condition:</b> Client session state stores JWT token; user identity and RBAC role bound to subsequent API headers.</td>
  </tr>
</table>

<br>

---

### Test Case 2: Turf Slot Reservation & Double-Booking Prevention (Concurrency Control)

<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1.5px solid black; font-family: Arial, sans-serif; font-size: 13px;">
  <tr>
    <td colspan="6" style="font-weight: bold; font-size: 15px; border-bottom: 1.5px solid black; background-color: #f9f9f9;">Test Case 2</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Project Name: PLAYSPORT</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Turf Booking & Concurrency Collision Test Case</td>
  </tr>
  <tr>
    <td colspan="3" style="width: 50%; border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Case ID:</b> PS_TC_02</td>
    <td colspan="3" style="width: 50%; border-bottom: 1px solid black;"><b>Test Designed By:</b> Sidharth Suppoodan</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Priority:</b> High</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Designed Date:</b> 22/10/2026</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Module:</b> Booking Engine & Concurrency Guard</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Executed By:</b> Automated test runner (Pytest Integration Suite)</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Title:</b> Atomic Slot Reservation and Double-Booking Prevention</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Execution Date:</b> 24/10/2026</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1px solid black;"><b>Description:</b> Verify that atomic transactions and database-level pessimistic row locking (`SELECT FOR UPDATE`) prevent two concurrent customers from reserving the same turf ground time slot.</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1.5px solid black;"><b>Pre-Condition:</b> Active turf ground with published available hourly slots; two distinct authenticated customer sessions (Customer A and Customer B).</td>
  </tr>
  <tr style="background-color: #f2f2f2; font-weight: bold; text-align: left;">
    <th style="width: 5%; border-right: 1px solid black; border-bottom: 1px solid black; text-align: center;">#</th>
    <th style="width: 25%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Step</th>
    <th style="width: 18%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Data</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Expected Result</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Actual Result</th>
    <th style="width: 8%; border-bottom: 1px solid black; text-align: center;">Status</th>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">1</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Batch-generate calendar time slots as facility owner</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">turf_id: 1, ground_id: 1<br>hours: 14:00 - 18:00<br>price: ₹1500.00</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200 OK; Consecutive hourly slot records created with status AVAILABLE</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200; Slots batch successfully created across ground calendar</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">2</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Customer 1 books available time slot</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Customer 1 Token<br>target_slot_id: 101<br>payment_method: UPI</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201 Created; Status CONFIRMED; Booking ref starts with 'STC-'</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201 Created; Reference 'STC-XXXXXXXX' generated; Slot status set to BOOKED</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">3</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Customer 2 attempts collision booking on same slot</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Customer 2 Token<br>identical target_slot_id: 101</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 409 Conflict; Reject transaction; Detail indicates slot already booked</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 409 Conflict; Double-booking prevention message returned; Rollback confirmed</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">4</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Verify slot availability query reflecting booked status</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">GET /api/slots/by-ground/1</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Target slot marked as BOOKED; excluded from public available pool</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Target slot is confirmed unavailable; zero data corruption</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td colspan="6" style="border-top: 1.5px solid black;"><b>Post-Condition:</b> Only one valid booking entry is retained in database; composite unique constraint (ground_id, slot_date, start_time) remains unviolated.</td>
  </tr>
</table>

<br>

---

### Test Case 3: End-to-End Booking Workflow & Payment Checkout (Selenium E2E)

<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1.5px solid black; font-family: Arial, sans-serif; font-size: 13px;">
  <tr>
    <td colspan="6" style="font-weight: bold; font-size: 15px; border-bottom: 1.5px solid black; background-color: #f9f9f9;">Test Case 3</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Project Name: PLAYSPORT</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">End-to-End Booking Workflow Test Case</td>
  </tr>
  <tr>
    <td colspan="3" style="width: 50%; border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Case ID:</b> PS_TC_03</td>
    <td colspan="3" style="width: 50%; border-bottom: 1px solid black;"><b>Test Designed By:</b> Sidharth Suppoodan</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Priority:</b> High</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Designed Date:</b> 22/10/2026</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Module:</b> Customer Booking Workflow</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Executed By:</b> Selenium WebDriver (Headless Chrome)</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Title:</b> Full Client-Side Slot Selection, Authentication Intercept & Booking Confirmation</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Execution Date:</b> 24/10/2026</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1px solid black;"><b>Description:</b> Validate the end-to-end customer journey in the browser: browsing turf listings, viewing ground details, selecting hourly slots, completing authentication challenge, and displaying the booking celebration modal.</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1.5px solid black;"><b>Pre-Condition:</b> React frontend running on localhost:5173, FastAPI backend on localhost:8000; seeded PlayZone Arena turf with available slots.</td>
  </tr>
  <tr style="background-color: #f2f2f2; font-weight: bold; text-align: left;">
    <th style="width: 5%; border-right: 1px solid black; border-bottom: 1px solid black; text-align: center;">#</th>
    <th style="width: 25%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Step</th>
    <th style="width: 18%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Data</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Expected Result</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Actual Result</th>
    <th style="width: 8%; border-bottom: 1px solid black; text-align: center;">Status</th>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">1</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Navigate to Turfs listing page and select venue</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">URL: /turfs<br>Target: PlayZone Arena</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Browser routes to /turfs/playzone-arena; Venue details and slot matrix rendered</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Turf details loaded; Pitch tabs and hourly slot cards displayed in DOM</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">2</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Select available time slot button</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Click available ':00' slot badge</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Slot card changes to selected state; 'Proceed to Booking' button enables</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Active styling applied; Checkout action button enabled with total price</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">3</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Trigger unauthenticated checkout check</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Click 'Proceed to Booking'</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Intercept checkout; Display Login/Auth Modal dialog to anonymous user</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Authentication modal displayed with email/password inputs</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">4</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Fulfill login challenge in modal</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">email: arjun.nair@example.com<br>password: Customer@123</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Authenticate credentials; Close modal; Restore booking checkout flow</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Auth successful; Modal dismissed; User session verified</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">5</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Confirm reservation and trigger confirmation modal</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Click final 'Proceed to Booking'</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">POST /api/bookings/create succeeds; 'Booking Confirmed!' modal displayed</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Modal verified in DOM containing 'Booking Confirmed!' text and confetti trigger</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td colspan="6" style="border-top: 1.5px solid black;"><b>Post-Condition:</b> Confirmed booking record stored in database; reference displayed to customer; slot updated to booked.</td>
  </tr>
</table>

<br>

---

### Test Case 4: Open Match Matchmaking & Capacity Clamping

<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1.5px solid black; font-family: Arial, sans-serif; font-size: 13px;">
  <tr>
    <td colspan="6" style="font-weight: bold; font-size: 15px; border-bottom: 1.5px solid black; background-color: #f9f9f9;">Test Case 4</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Project Name: PLAYSPORT</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Open Match Matchmaking Test Case</td>
  </tr>
  <tr>
    <td colspan="3" style="width: 50%; border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Case ID:</b> PS_TC_04</td>
    <td colspan="3" style="width: 50%; border-bottom: 1px solid black;"><b>Test Designed By:</b> Sidharth Suppoodan</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Priority:</b> Medium</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Designed Date:</b> 22/10/2026</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Module:</b> Athlete Matchmaking & Open Matches</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Executed By:</b> Automated test runner (Pytest Backend Suite)</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Title:</b> Open Match Creation, Player Joining & Maximum Capacity Clamping</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Execution Date:</b> 24/10/2026</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1px solid black;"><b>Description:</b> Validate that social matchmaking lobbies dynamically track joined participants, lock status transitions when maximum capacity is reached, and prevent player oversubscription.</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1.5px solid black;"><b>Pre-Condition:</b> Active database session; match creator account and two distinct athlete profiles (Player A, Player B).</td>
  </tr>
  <tr style="background-color: #f2f2f2; font-weight: bold; text-align: left;">
    <th style="width: 5%; border-right: 1px solid black; border-bottom: 1px solid black; text-align: center;">#</th>
    <th style="width: 25%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Step</th>
    <th style="width: 18%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Data</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Expected Result</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Actual Result</th>
    <th style="width: 8%; border-bottom: 1px solid black; text-align: center;">Status</th>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">1</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Create Open Match lobby with strict capacity limit</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">sport: Badminton<br>max_players: 2<br>price: ₹100.00</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201 Created; Lobby initialized with status OPEN, current_players: 0</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201 Created; Match ID generated with configured capacity limit</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">2</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">First athlete joins open lobby</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">User: rahul.kumar@example.com</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200 OK; current_players increments to 1; status remains OPEN</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200; current_players = 1; status = OPEN confirmed</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">3</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Second athlete joins and fills lobby capacity</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">User: sarah.j@example.com</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200 OK; current_players increments to 2; status transitions to FULL</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200; current_players = 2; status automatically converted to FULL</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">4</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Third athlete attempts to join full lobby</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">User: arjun.nair@example.com</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 400 Bad Request; Join rejected; Error: 'Match is already full'</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 400 Bad Request returned; Roster clamped; Zero oversubscription</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td colspan="6" style="border-top: 1.5px solid black;"><b>Post-Condition:</b> Match lobby capacity is strictly clamped to max_players; roster list accurately stores player foreign keys.</td>
  </tr>
</table>

<br>

---

### Test Case 5: Facility Turf Registration & Admin Approval Queue

<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1.5px solid black; font-family: Arial, sans-serif; font-size: 13px;">
  <tr>
    <td colspan="6" style="font-weight: bold; font-size: 15px; border-bottom: 1.5px solid black; background-color: #f9f9f9;">Test Case 5</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Project Name: PLAYSPORT</td>
  </tr>
  <tr>
    <td colspan="6" style="font-weight: bold; border-bottom: 1px solid black;">Facility Onboarding & Admin Moderation Test Case</td>
  </tr>
  <tr>
    <td colspan="3" style="width: 50%; border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Case ID:</b> PS_TC_05</td>
    <td colspan="3" style="width: 50%; border-bottom: 1px solid black;"><b>Test Designed By:</b> Sidharth Suppoodan</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Priority:</b> Medium</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Designed Date:</b> 22/10/2026</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Module:</b> Turf Owner & Super Admin Moderation</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Executed By:</b> Automated test runner (Selenium E2E & Backend API)</td>
  </tr>
  <tr>
    <td colspan="3" style="border-right: 1px solid black; border-bottom: 1px solid black;"><b>Test Title:</b> Turf Registration Submission, Pending Queue Isolation & Admin Approval</td>
    <td colspan="3" style="border-bottom: 1px solid black;"><b>Test Execution Date:</b> 24/10/2026</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1px solid black;"><b>Description:</b> Exercise facility onboarding workflow: turf owners submit new facility details, the listing enters a pending review queue, and only goes live upon platform administrator approval.</td>
  </tr>
  <tr>
    <td colspan="6" style="border-bottom: 1.5px solid black;"><b>Pre-Condition:</b> Authenticated Turf Owner account and active Super Admin account; clean turf moderation queue.</td>
  </tr>
  <tr style="background-color: #f2f2f2; font-weight: bold; text-align: left;">
    <th style="width: 5%; border-right: 1px solid black; border-bottom: 1px solid black; text-align: center;">#</th>
    <th style="width: 25%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Step</th>
    <th style="width: 18%; border-right: 1px solid black; border-bottom: 1px solid black;">Test Data</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Expected Result</th>
    <th style="width: 22%; border-right: 1px solid black; border-bottom: 1px solid black;">Actual Result</th>
    <th style="width: 8%; border-bottom: 1px solid black; text-align: center;">Status</th>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">1</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Owner submits venue registration form</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">name: 'Green Field Arena'<br>city: 'Kochi'<br>address: 'Near Stadium Jct'</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201 Created; Record created with is_approved=False / status=PENDING</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 201; Confirmation alert: 'submitted for approval' rendered</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">2</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Verify unapproved venue hidden from public catalog</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">GET /api/turfs (Public customer view)</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Unapproved venue is excluded from public search and listings</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Public API query returns only verified/approved facilities</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">3</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Super Admin inspects pending onboarding queue</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Admin JWT Token<br>GET /api/admin/pending-turfs</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200 OK; Returns list of unapproved facilities awaiting review</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200; Green Field Arena present in moderation table</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td style="text-align: center; border-right: 1px solid black; border-bottom: 1px solid black;">4</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">Admin executes facility approval</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">POST /api/admin/turfs/{id}/approve</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200 OK; is_approved toggles to True; Listing goes live</td>
    <td style="border-right: 1px solid black; border-bottom: 1px solid black;">HTTP 200; Approved flag updated; Facility immediately searchable on frontend</td>
    <td style="text-align: center; border-bottom: 1px solid black; font-weight: bold; color: green;">PASS</td>
  </tr>
  <tr>
    <td colspan="6" style="border-top: 1.5px solid black;"><b>Post-Condition:</b> Facility is published on the live discovery feed; owner granted permission to generate calendar pitch slots.</td>
  </tr>
</table>
