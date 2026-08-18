# Architecture & System Design Document
### PLAYSPORT — Sports Facility Management System (MCA Minor Project)

---

## 1. System Overview

PLAYSPORT is designed around a modern decoupled client-server architecture:
- **Client Tier**: Single Page Application (SPA) built with React 18, Vite, and Tailwind CSS.
- **Application Tier**: Asynchronous REST API developed in FastAPI (Python) adhering to OpenAPI 3.0 standards.
- **Data Tier**: Relational schema managed via SQLAlchemy 2.0 ORM with connection pooling, transaction isolation, and foreign key integrity.

```mermaid
graph TD
    subgraph Client [Client Presentation Tier]
        React[React 18 + Vite SPA]
        Tailwind[Tailwind CSS Design System]
        Recharts[Recharts Analytics Engine]
    end

    subgraph Backend [FastAPI Service Tier]
        AuthGuard[JWT Auth & RBAC Middleware]
        Router[FastAPI Route Handlers]
        ConcurrencyGuard[Slot Row Locker & Collision Guard]
    end

    subgraph Data [Relational Persistence Tier]
        SQLAlchemy[SQLAlchemy ORM]
        DB[(PostgreSQL / SQLite Storage)]
    end

    React -->|HTTP / JSON REST| AuthGuard
    AuthGuard --> Router
    Router --> ConcurrencyGuard
    ConcurrencyGuard --> SQLAlchemy
    SQLAlchemy --> DB
```

---

## 2. Concurrency Control & Double-Booking Safeguard

The primary transactional challenge in sports facility reservation systems is preventing **double booking** (two customers attempting to book the same ground at the same date and time slot simultaneously).

### Safeguard Workflow:
1. **Pessimistic Row Locking**: When a reservation request enters `/api/bookings/create`, the transaction requests locks on the target `time_slots` rows (`SELECT ... FOR UPDATE`).
2. **Atomic Verification**: The transaction verifies that every slot has `status == 'AVAILABLE'`.
3. **Collision Detection**: If any slot in the array is already `BOOKED` or `BLOCKED`, the transaction rolls back immediately and returns `HTTP 409 Conflict`.
4. **Atomic Commit**: All selected slot records have their status changed to `BOOKED` and linked to the new `booking_id` in a single atomic database commit.

```mermaid
sequenceDiagram
    autonumber
    actor Customer1 as Customer A
    actor Customer2 as Customer B
    participant API as FastAPI Backend
    participant DB as Database Engine

    Customer1->>API: POST /api/bookings/create (Slot #12)
    Customer2->>API: POST /api/bookings/create (Slot #12)
    
    API->>DB: BEGIN TRANSACTION (Customer A)
    API->>DB: SELECT * FROM time_slots WHERE id=12 FOR UPDATE
    DB-->>API: Status = AVAILABLE (Locked for Customer A)
    
    API->>DB: BEGIN TRANSACTION (Customer B)
    API->>DB: SELECT * FROM time_slots WHERE id=12 FOR UPDATE
    Note over DB,API: Customer B waits for Lock or inspects updated status

    API->>DB: UPDATE time_slots SET status='BOOKED' WHERE id=12 (Customer A)
    API->>DB: INSERT INTO bookings, payments (Customer A)
    API->>DB: COMMIT TRANSACTION (Customer A)
    API-->>Customer1: HTTP 201 Created (Booking STC-78429 Confirmed)

    DB-->>API: Slot #12 is now status='BOOKED' (Customer B)
    API->>DB: ROLLBACK TRANSACTION (Customer B)
    API-->>Customer2: HTTP 409 Conflict (Slot already booked!)
```

---

## 3. Open Match Participant Guard

In the Open Match Arena, individual athletes join matches up to a fixed player capacity (`max_players`).

```mermaid
flowchart TD
    JoinReq[Customer Clicks Join Match] --> CheckAuth{Authenticated?}
    CheckAuth -- No --> AuthModal[Prompt Sign In]
    CheckAuth -- Yes --> FetchMatch[Fetch OpenMatch Record]
    FetchMatch --> CheckCapacity{current_players >= max_players?}
    CheckCapacity -- Yes --> Reject[Return HTTP 400 Match is FULL]
    CheckCapacity -- No --> CheckJoined{User already joined?}
    CheckJoined -- Yes --> RejectDup[Return HTTP 400 Already Joined]
    CheckJoined -- No --> AddPart[Insert MatchParticipant]
    AddPart --> Increment[Increment current_players]
    Increment --> CheckNewCap{current_players == max_players?}
    CheckNewCap -- Yes --> SetFull[Set Match status = FULL]
    CheckNewCap -- No --> Save[Commit Transaction]
    SetFull --> Save
    Save --> Success[Return HTTP 200 Joined + Send In-App Notification]
```

---

## 4. Extensibility for Future Major Project

Although the current Minor Project intentionally excludes AI/ML per project guidelines, the database schema and service layers are designed to be plug-and-play for the future Major Project:
- Booking history timestamps and weather/city tags allow demand forecasting.
- Review comment embeddings can be indexed for sentiment analysis.
- Match player rosters support skill-based ELO rating algorithms.
