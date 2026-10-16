from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ContactInfo(BaseModel):
    phone: str
    email: str

class TimingsInfo(BaseModel):
    standard_checkin: str = "14:00"
    standard_checkout: str = "12:00"
    cutoff_time: str = "20:00"
    allow_late_checkin: bool = True

class CancellationPolicy(BaseModel):
    free_cancellation_until_hours: int = 24
    cancellation_fee: float = 0.0
    policy_text: str = "Free cancellation up to 24h before check-in date. Late arrival notice must be provided before 20:00 to prevent room release."

class HotelBase(BaseModel):
    name: str
    brand: Optional[str] = "Independent"
    city: str
    address: str
    star_rating: int = 4
    images: List[str] = []
    contact: ContactInfo
    timings: TimingsInfo
    cancellation_policy: CancellationPolicy
    amenities: List[str] = ["Free WiFi", "Swimming Pool", "24/7 Front Desk", "Restaurant"]
    starting_price: Optional[float] = 3499.0
    description: Optional[str] = ""

class HotelCreate(HotelBase):
    pass

class HotelUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    star_rating: Optional[int] = None
    images: Optional[List[str]] = None
    contact: Optional[ContactInfo] = None
    timings: Optional[TimingsInfo] = None
    cancellation_policy: Optional[CancellationPolicy] = None
    amenities: Optional[List[str]] = None
    starting_price: Optional[float] = None
    description: Optional[str] = None

class Capacity(BaseModel):
    adults: int = 2
    children: int = 1

class RoomBase(BaseModel):
    hotel_id: str
    room_type: str
    description: str
    capacity: Capacity = Field(default_factory=Capacity)
    bed_type: str = "King Bed"
    room_size: str = "320 sq ft"
    price_per_night: float
    total_slots: int = 10
    available_slots: int = 10
    amenities: List[str] = ["Free High-Speed WiFi", "Buffet Breakfast Included", "Work Desk", "Air Conditioning"]
    image: str

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_type: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[Capacity] = None
    bed_type: Optional[str] = None
    room_size: Optional[str] = None
    price_per_night: Optional[float] = None
    total_slots: Optional[int] = None
    available_slots: Optional[int] = None
    amenities: Optional[List[str]] = None
    image: Optional[str] = None

class Guest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    number_of_guests: int = 2

class PaymentInfo(BaseModel):
    mode: str = "PAY_AT_PROPERTY"  # PAY_AT_PROPERTY or ONLINE_RAZORPAY
    total_fee: float
    status: str = "PENDING_AT_HOTEL"  # PENDING_AT_HOTEL, PAID, REFUNDED
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None

class ReservationCreate(BaseModel):
    hotel_id: str
    room_id: str
    guest: Guest
    booking_type: str = "guest"  # guest or user
    user_id: Optional[str] = None
    checkin_date: str
    checkout_date: str
    nights: int = 1
    expected_arrival_time: str = "14:00 - 16:00"
    late_checkin_hold_requested: bool = False
    special_requests: Optional[str] = ""
    payment_mode: str = "PAY_AT_PROPERTY"  # PAY_AT_PROPERTY or ONLINE_RAZORPAY

class LateHoldRequest(BaseModel):
    expected_arrival_time: str
    special_requests: Optional[str] = ""
    reason: Optional[str] = "Flight / Travel Delay"

class CancelReservationRequest(BaseModel):
    reason: Optional[str] = "Change of travel plans"

class StatusUpdateRequest(BaseModel):
    status: str  # CONFIRMED, CHECKIN_AT_RISK, LATE_ARRIVAL_APPROVED, CANCELLED, NO_SHOW, CHECKED_IN
    notes: Optional[str] = ""

class GoogleAuthRequest(BaseModel):
    credential: str

class EmailSignInRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class DevTokenRequest(BaseModel):
    email: str
    name: Optional[str] = "Developer"
    role: Optional[str] = "user"  # user or admin

class RazorpayVerifyRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
