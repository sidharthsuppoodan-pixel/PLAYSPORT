# Administrator & Facility Manager Guide
### PLAYSPORT — Sports Facility Management System (MCA Minor Project)

---

## 1. Role Capabilities Matrix

| Action | Super Admin | Turf Owner | Customer |
|---|:---:|:---:|:---:|
| Search & Browse Turfs | ✅ | ✅ | ✅ |
| Book Slots & Make Payments | ✅ | ✅ | ✅ |
| Join Open Matches | ✅ | ✅ | ✅ |
| Register Tournament Teams | ✅ | ✅ | ✅ |
| Rent Sports Equipment | ✅ | ✅ | ✅ |
| View Printable Digital Receipts | ✅ | ✅ | ✅ |
| Submit Verified Reviews | ✅ | ✅ | ✅ |
| Create New Turf Listings | ✅ | ✅ | ❌ |
| Batch Generate Time Slots | ✅ | ✅ | ❌ |
| View Real-Time Facility Status | ✅ | ✅ | ❌ |
| Approve/Reject Turf Owners | ✅ | ❌ | ❌ |
| View System Revenue Analytics | ✅ | ❌ | ❌ |
| Manage All User Accounts | ✅ | ❌ | ❌ |

---

## 2. Super Administrator Console (`/admin/dashboard`)

Accessed by signing in with `admin@playsport.com` / `Admin@123`.

### Key Widgets:
1. **Metric Overview Cards**:
   - Total Users (with monthly percentage growth).
   - Approved Facility Owners across operational regions.
   - Pending Applictions requiring attention.
   - Total System Revenue across all booking transactions.
2. **Revenue Overview Area Chart**:
   - Monthly and Weekly revenue trendline visualization with smooth emerald green gradients.
3. **Pending Turf Owner Approvals**:
   - Lists applicant business name, owner name, email, and city.
   - `✓ Approve`: Grants the owner instant permission to list turfs and manage grounds.
   - `✕ Reject`: Rejects and purges the application.

---

## 3. Turf Manager Console (`/owner/dashboard`)

Accessed by signing in with `owner.kochi@playsport.com` / `Owner@123`.

### Key Widgets:
1. **Action Bar**:
   - `📅 Manage Slots`: Batch generate hourly slots across dates.
   - `➕ Add New Turf`: Publish a new turf venue.
2. **Recent Bookings Table**:
   - Displays real-time bookings with reference IDs (`#BK-9042`), customer avatar initials, pitch name, time range, and status badges.
3. **Facility Utilization Status**:
   - Real-time indicator lights (`⚽ Turf A (5v5) - Booked until 19:00`, `🏏 Turf B - Available next: 19:00`).
