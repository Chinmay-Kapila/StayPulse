# StayPulse Hotels 🏨
### Standalone Hotel Registration & Reservation Portal for TinyFish Crawling & TripSaathi Travel Recovery

**StayPulse** is a complete, production-grade hotel directory, slot reservation, and guest registration web platform designed specifically for autonomous AI browser agents (**TinyFish**) and multi-modal travel recovery testing (**TripSaathi**).

---

## 🚀 Live Demo & Ports
- **Frontend (React + Vite + Tailwind CSS)**: [http://localhost:5000](http://localhost:5000)
- **Backend (FastAPI REST API)**: [http://localhost:9000](http://localhost:9000)
- **Interactive OpenAPI / Swagger Documentation**: [http://localhost:9000/docs](http://localhost:9000/docs)

---

## 🛠️ Tech Stack & Integrations
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, `@react-oauth/google`, Razorpay Checkout SDK.
- **Backend**: Python 3.13, FastAPI, Uvicorn, PyMongo, Pydantic v2, Python-JOSE (JWT), Razorpay SDK, Google Auth.
- **Database**: MongoDB Atlas (`staypulse_db`) — Collections: `hotels`, `rooms`, `reservations`, `users`, `hotel_chains`.
- **Payment Gateway**: **Razorpay Test Mode** (Configured via `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`).
- **OAuth Authentication**: **Google Identity Services (GIS)** (Configured via `GOOGLE_CLIENT_ID` in `.env`).

---

## 🎯 Key Features Engineered for Demo & Crawler Recovery

### 1. TinyFish-Friendly Machine-Readable UI
All interactive elements contain structured `data-testid` attributes for headless AI browser agents:
- `data-testid="hotel-card"`
- `data-testid="hotel-name"`
- `data-testid="hotel-city"`
- `data-testid="hotel-price"`
- `data-testid="checkin-policy"` (Displays exact cut-off deadlines like `Standard Check-in: 14:00 | Desk Cut-off: 20:00`)
- `data-testid="view-slots-btn"`
- `data-testid="select-slot-btn"`
- `data-testid="arrival-time-select"`
- `data-testid="payment-method-pay-at-property"`
- `data-testid="payment-method-razorpay"`
- `data-testid="booking-id"`

### 2. Multi-Modal Disruption & Late Check-in Hold (TripSaathi Testing)
- **Expected Arrival Time Selector**: Options for `14:00 - 16:00`, `16:00 - 18:00`, `18:00 - 20:00`, and `Late Arrival: After 20:00`.
- **Flight Delay Notice Input**: Guests and autonomous agents can supply flight numbers (e.g. `Flight delay AI-804`) to request guaranteed check-in holds until **23:59**.
- **Admin Disruption Triggers (`/admin`)**:
  - Mark reservation as `CHECKIN_AT_RISK` (simulates front desk flagging a no-show risk when guest does not arrive by cut-off time).
  - Mark reservation as `LATE_ARRIVAL_APPROVED` (guarantees desk hold).

### 3. Payment & Cancellation Demo Workflow
- **Option 1: Pay at Property / Pay Later**: Reserves room slots immediately with ₹0 upfront charge (status: `PENDING_AT_HOTEL`).
- **Option 2: Pay Online with Razorpay**: Seamless sandbox payment checkout with automated HMAC-SHA256 signature verification.
- **Option 3: Sandbox Instant Mock Pay**: Built-in mock payment trigger for headless agents and zero-friction demos.
- **Smart Cancellation Policy Engine**:
  - Automatically compares current time against check-in cut-off deadline (`free_cancellation_until_hours`).
  - Calculates exact refund amount vs penalty fee.
  - Releases room slot inventory atomically back to the pool (`available_slots + 1`).
  - Processes or simulates Razorpay refunds for online bookings.

### 4. 1-Click Demo Persona Switcher (Navbar)
Switch personas instantly in the header without logging in manually:
- `[Guest]`: Tests anonymous slot locking with contact info.
- `[Arnesh]`: Tests authenticated user booking linked to dashboard.
- `[Admin Desk]`: Direct access to front desk conflict simulator & inventory management.

---

## 🏨 Pre-Seeded Hotels Across India
1. **Taj Lands End** (Mumbai, Bandra West, 5-Star, Cut-off 20:00)
2. **The Lalit Mumbai** (Mumbai, Airport T2, 4-Star, 24/7 Front Desk)
3. **The Leela Palace** (New Delhi, Chanakyapuri, 5-Star, Cut-off 21:00)
4. **Bloomrooms @ Janpath** (New Delhi, Connaught Place, Boutique 3-Star, Cut-off 20:30)
5. **The Ritz-Carlton** (Bangalore, Residency Road, 5-Star, Cut-off 22:00)
6. **Lemon Tree Premier** (Bangalore, Ulsoor Lake, 4-Star, Cut-off 21:30)
7. **W Goa** (Goa, Vagator Beach, 5-Star, Cut-off 22:00)
8. **Taj Fort Aguada Resort & Spa** (Goa, Candolim Beach, 5-Star, Cut-off 21:00)

---

## 📡 REST API Endpoints Summary

```
POST /api/auth/google                     # Google OAuth GIS login
POST /api/auth/demo-login                 # 1-Click demo persona bypass
GET  /api/auth/me                         # Current authenticated user profile
GET  /api/hotels/search                   # Search & filter hotels (?city, ?checkin, ?checkout, ?guests, ?brand, ?star_rating)
GET  /api/hotels/cities                   # Available cities & count
GET  /api/hotels/chains                   # Luxury chains list
GET  /api/hotels/{id}                     # Full hotel details & room slots
GET  /api/hotels/{id}/rooms               # Available room slots & live pricing
POST /api/reservations                    # Create reservation (Guest or User)
GET  /api/reservations/{booking_id}       # Retrieve reservation by ID + email
PUT  /api/reservations/{booking_id}/hold  # Request / update late arrival check-in hold
POST /api/reservations/{booking_id}/cancel# Cancel reservation & calculate refund/penalty
POST /api/payments/verify                 # Verify Razorpay signature
POST /api/payments/mock-pay/{booking_id}  # Instant demo payment for crawlers

# Admin Operations
GET  /api/admin/hotels                    # List all hotels with room count
POST /api/admin/hotels                    # Add new hotel listing
PUT  /api/admin/hotels/{id}               # Edit hotel listing
DELETE /api/admin/hotels/{id}             # Delete hotel listing
POST /api/admin/hotels/{id}/rooms         # Add room slot to hotel
GET  /api/admin/reservations              # List all registrations
PUT  /api/admin/reservations/{id}/status  # Update status (CONFIRMED, CHECKIN_AT_RISK, LATE_ARRIVAL_APPROVED, CANCELLED)
POST /api/admin/seed/reset                # 1-Click reset database to pristine demo state
```

---

## 🚀 Running the Project Locally

### Start Backend (Port 9000)
```bash
cd backend
python run.py
```

### Start Frontend (Port 5000)
```bash
cd frontend
npm run dev
```
