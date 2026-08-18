# REST API Reference & Specification
### PLAYSPORT — Sports Facility Management System (MCA Minor Project)

---

## Base URLs
- **Local Development**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **OpenAPI JSON Schema**: `http://localhost:8000/openapi.json`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Creates a standard customer account.
- **Request Body**:
```json
{
  "email": "player@example.com",
  "username": "super_striker",
  "full_name": "Rohan Sharma",
  "phone": "9876543210",
  "password": "SecretPassword123"
}
```
- **Response `201 Created`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "user": {
    "id": 12,
    "email": "player@example.com",
    "username": "super_striker",
    "full_name": "Rohan Sharma",
    "role": "CUSTOMER"
  }
}
```

### `POST /api/auth/login`
Authenticates a customer or turf owner.
- **Request Body**: `{"email": "arjun.nair@example.com", "password": "Customer@123"}`
- **Response `200 OK`**: JWT Bearer token + User profile.

### `POST /api/auth/admin-login`
Dedicated login portal for Super Administrators (`role == ADMIN`).

---

## 2. Slot & Booking Endpoints (`/api/slots`, `/api/bookings`)

### `GET /api/slots/by-ground/{ground_id}?days=7`
Retrieves day-grouped time slot objects matching Stitch horizontal date selector.
- **Response `200 OK`**:
```json
[
  {
    "date": "2026-10-14",
    "day_name": "TODAY",
    "display_date": "14 Oct",
    "is_today": true,
    "slots": [
      {
        "id": 1,
        "ground_id": 1,
        "slot_date": "2026-10-14",
        "start_time": "06:00 AM",
        "end_time": "07:00 AM",
        "price": 1200.0,
        "status": "AVAILABLE"
      }
    ]
  }
]
```

### `POST /api/bookings/create`
Reserves one or more time slots atomically with concurrency collision protection.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "turf_id": 1,
  "ground_id": 1,
  "booking_date": "2026-10-14",
  "slot_ids": [1, 2],
  "payment_method": "UPI",
  "customer_notes": "Night game"
}
```
- **Success Response `201 Created`**: Booking detail object matching Stitch confirmation modal.
- **Error Collision Response `409 Conflict`**: `{"detail": "Slot '06:00 AM - 07:00 AM' is already booked. Double-booking prevented."}`

---

## 3. Open Match Arena Endpoints (`/api/open-matches`)

### `GET /api/open-matches`
Lists active open matches with remaining capacity.

### `POST /api/open-matches/{id}/join`
Joins a match as an individual player.
- **Capacity Guard**: Returns `400 Bad Request` if `current_players >= max_players`.

---

## 4. Administrative Endpoints (`/api/admin`)

- `GET /api/admin/metrics`: Returns 4 KPI metric cards (Total Users, Approved Owners, Pending Approvals, Total Revenue).
- `GET /api/admin/revenue-chart?period=monthly`: Returns monthly/weekly revenue trendline points for Recharts visualization.
- `GET /api/admin/pending-owners`: Lists pending turf owner partnership applications.
- `POST /api/admin/pending-owners/{id}/approve`: Approves pending turf owner.
- `POST /api/admin/pending-owners/{id}/reject`: Rejects and removes application.
