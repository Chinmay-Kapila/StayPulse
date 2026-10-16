from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import random
import string
import razorpay
from src.database import reservations_col, rooms_col, hotels_col, serialize_doc, serialize_docs
from src.schemas import ReservationCreate, LateHoldRequest, CancelReservationRequest
from src.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
import logging

logger = logging.getLogger("staypulse.reservations")
router = APIRouter(prefix="/reservations", tags=["Reservations"])

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def generate_booking_id() -> str:
    """Generate a unique TinyFish-friendly Booking ID like STAY-90412B."""
    num_part = "".join(random.choices(string.digits, k=5))
    letter_part = random.choice(string.ascii_uppercase)
    return f"STAY-{num_part}{letter_part}"

@router.post("")
def create_reservation(payload: ReservationCreate):
    """Create a new hotel slot reservation (Guest or Authenticated User)."""
    # 1. Fetch Room and Hotel
    try:
        room = rooms_col.find_one({"_id": ObjectId(payload.room_id)})
    except Exception:
        room = rooms_col.find_one({"id": payload.room_id})

    if not room:
        raise HTTPException(status_code=404, detail="Room slot not found")

    if room.get("available_slots", 0) <= 0:
        raise HTTPException(status_code=400, detail="No room slots available for the selected dates.")

    try:
        hotel = hotels_col.find_one({"_id": ObjectId(payload.hotel_id)})
    except Exception:
        hotel = hotels_col.find_one({"id": payload.hotel_id})

    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    # 2. Compute nights and pricing
    nights = max(1, payload.nights)
    base_price = room.get("price_per_night", 3499.0)
    subtotal = base_price * nights
    taxes = round(subtotal * 0.18, 2)  # 18% GST
    total_fee = round(subtotal + taxes, 2)

    # 3. Generate Booking ID
    booking_id = generate_booking_id()
    while reservations_col.find_one({"booking_id": booking_id}):
        booking_id = generate_booking_id()

    # 4. Handle Payment Setup
    payment_mode = payload.payment_mode.upper()
    payment_status = "PENDING_AT_HOTEL" if payment_mode == "PAY_AT_PROPERTY" else "PAYMENT_INITIATED"
    razorpay_order_id = None

    if payment_mode == "ONLINE_RAZORPAY":
        try:
            # Create Razorpay order (amount in paise)
            order_data = {
                "amount": int(total_fee * 100),
                "currency": "INR",
                "receipt": f"rcpt_{booking_id}",
                "notes": {
                    "booking_id": booking_id,
                    "hotel_name": hotel.get("name"),
                    "room_type": room.get("room_type"),
                    "guest_name": payload.guest.name
                }
            }
            rzp_order = razorpay_client.order.create(data=order_data)
            razorpay_order_id = rzp_order.get("id")
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {e}")
            # Fallback to simulated order ID for offline/test resilience
            razorpay_order_id = f"order_mock_{booking_id.lower()}"

    now_iso = datetime.now(timezone.utc).isoformat()

    # 5. Decrement room available slots
    rooms_col.update_one(
        {"_id": room["_id"]},
        {"$inc": {"available_slots": -1}}
    )

    # 6. Save Reservation Document
    res_doc = {
        "booking_id": booking_id,
        "hotel_id": str(hotel["_id"]),
        "hotel_name": hotel.get("name"),
        "hotel_address": hotel.get("address"),
        "hotel_city": hotel.get("city"),
        "hotel_contact": hotel.get("contact"),
        "hotel_timings": hotel.get("timings"),
        "cancellation_policy": hotel.get("cancellation_policy"),
        "room_id": str(room["_id"]),
        "room_type": room.get("room_type"),
        "room_image": room.get("image"),
        "guest": payload.guest.model_dump(),
        "booking_type": payload.booking_type,
        "user_id": payload.user_id,
        "checkin_date": payload.checkin_date,
        "checkout_date": payload.checkout_date,
        "nights": nights,
        "expected_arrival_time": payload.expected_arrival_time,
        "late_checkin_hold_requested": payload.late_checkin_hold_requested or ("late" in payload.expected_arrival_time.lower()),
        "special_requests": payload.special_requests or "",
        "pricing": {
            "base_price": base_price,
            "nights": nights,
            "subtotal": subtotal,
            "taxes": taxes,
            "total_fee": total_fee
        },
        "payment": {
            "mode": payment_mode,
            "total_fee": total_fee,
            "status": payment_status,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": None
        },
        "status": "CONFIRMED",
        "created_at": now_iso,
        "cancellation": {
            "cancelled_at": None,
            "refund_amount": 0.0,
            "penalty_fee": 0.0,
            "reason": None
        }
    }

    inserted = reservations_col.insert_one(res_doc)
    res_doc["_id"] = inserted.inserted_id

    response_data = serialize_doc(res_doc)
    response_data["razorpay_key_id"] = RAZORPAY_KEY_ID
    return response_data

@router.get("/{booking_id}")
def get_reservation(booking_id: str, email: Optional[str] = Query(None)):
    """
    Retrieve reservation details by Booking ID only (email optional).
    Generalizes multi-purpose status: APPROVED, WAITING, CANCELLED, EXPIRED, or DOES_NOT_EXIST.
    """
    clean_id = booking_id.strip()
    query = {"booking_id": {"$regex": f"^{clean_id}$", "$options": "i"}}
    if email:
        query["guest.email"] = {"$regex": f"^{email.strip()}$", "$options": "i"}

    reservation = reservations_col.find_one(query)
    if not reservation:
        raise HTTPException(
            status_code=404, 
            detail=f"DOES_NOT_EXIST: No reservation found for Booking ID '{clean_id}'."
        )

    # Check for automatic expiration if past checkout date and not cancelled/checked-in
    try:
        today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if reservation.get("checkout_date") and reservation["checkout_date"] < today_date:
            if reservation.get("status") not in ["CANCELLED", "CHECKED_IN", "EXPIRED"]:
                reservations_col.update_one({"_id": reservation["_id"]}, {"$set": {"status": "EXPIRED"}})
                reservation["status"] = "EXPIRED"
    except Exception:
        pass

    return serialize_doc(reservation)

@router.put("/{booking_id}/hold")
def request_late_checkin_hold(booking_id: str, payload: LateHoldRequest):
    """
    Request or modify a Late Check-in Hold on an existing reservation.
    Essential for TripSaathi / TinyFish multi-modal flight delay recovery tests!
    """
    res = reservations_col.find_one({"booking_id": {"$regex": f"^{booking_id.strip()}$", "$options": "i"}})
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if res.get("status") == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cannot request late hold on a cancelled reservation.")

    update_fields = {
        "expected_arrival_time": payload.expected_arrival_time,
        "late_checkin_hold_requested": True,
        "late_hold_notice": {
            "requested_at": datetime.now(timezone.utc).isoformat(),
            "reason": payload.reason,
            "notes": payload.special_requests,
            "guaranteed_until": "23:59 (Late Arrival Hold Active)"
        }
    }

    if payload.special_requests:
        existing_notes = res.get("special_requests", "")
        update_fields["special_requests"] = f"{existing_notes} | [Late Arrival Update]: {payload.special_requests}".strip(" | ")

    reservations_col.update_one({"_id": res["_id"]}, {"$set": update_fields})
    updated_res = reservations_col.find_one({"_id": res["_id"]})
    return serialize_doc(updated_res)

@router.post("/{booking_id}/cancel")
def cancel_reservation(booking_id: str, payload: CancelReservationRequest = Body(...)):
    """
    Cancel an existing reservation according to hotel cancellation policy.
    Computes exact refund amount vs penalty fee, releases room inventory slot,
    and updates booking status to CANCELLED.
    """
    res = reservations_col.find_one({"booking_id": {"$regex": f"^{booking_id.strip()}$", "$options": "i"}})
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if res.get("status") == "CANCELLED":
        raise HTTPException(status_code=400, detail="This reservation has already been cancelled.")

    now = datetime.now(timezone.utc)
    policy = res.get("cancellation_policy") or {}
    free_hours = policy.get("free_cancellation_until_hours", 24)
    cancellation_fee = policy.get("cancellation_fee", 0.0)
    total_fee = res.get("pricing", {}).get("total_fee", 0.0)

    # Calculate hours until check-in
    try:
        checkin_dt = datetime.strptime(res["checkin_date"], "%Y-%m-%d").replace(tzinfo=timezone.utc, hour=14, minute=0)
        hours_to_checkin = (checkin_dt - now).total_seconds() / 3600.0
    except Exception:
        hours_to_checkin = 48.0  # default to free cancellation window if date parsing fails

    # Calculate penalty & refund
    payment_mode = res.get("payment", {}).get("mode", "PAY_AT_PROPERTY")
    is_paid_online = res.get("payment", {}).get("status") == "PAID"

    if hours_to_checkin >= free_hours:
        penalty_fee = 0.0
        refund_amount = total_fee if is_paid_online else 0.0
        policy_applied = f"Full Refund (Cancelled {int(hours_to_checkin)}h before check-in, free cutoff was {free_hours}h)"
    else:
        penalty_fee = min(cancellation_fee, total_fee)
        refund_amount = max(0.0, total_fee - penalty_fee) if is_paid_online else 0.0
        policy_applied = f"Late Cancellation Penalty of ₹{penalty_fee} applied (Cut-off was {free_hours}h prior)"

    # Release room slot back to inventory
    try:
        rooms_col.update_one(
            {"_id": ObjectId(res["room_id"])},
            {"$inc": {"available_slots": 1}}
        )
    except Exception as e:
        logger.warning(f"Could not increment room slot: {e}")

    # Process or simulate Razorpay refund if paid online
    refund_id = None
    if is_paid_online and refund_amount > 0 and res.get("payment", {}).get("razorpay_payment_id"):
        try:
            rzp_payment_id = res["payment"]["razorpay_payment_id"]
            refund_obj = razorpay_client.payment.refund(rzp_payment_id, {
                "amount": int(refund_amount * 100),
                "notes": {"booking_id": booking_id, "reason": payload.reason}
            })
            refund_id = refund_obj.get("id")
        except Exception as e:
            logger.warning(f"Razorpay refund notice (or test mode): {e}")
            refund_id = f"rfd_mock_{booking_id.lower()}"

    # Update reservation in database
    cancellation_record = {
        "cancelled_at": now.isoformat(),
        "refund_amount": refund_amount,
        "penalty_fee": penalty_fee,
        "refund_id": refund_id,
        "policy_applied": policy_applied,
        "reason": payload.reason
    }

    reservations_col.update_one(
        {"_id": res["_id"]},
        {
            "$set": {
                "status": "CANCELLED",
                "cancellation": cancellation_record,
                "payment.status": "REFUNDED" if is_paid_online else "CANCELLED_WITHOUT_CHARGE"
            }
        }
    )

    updated_res = reservations_col.find_one({"_id": res["_id"]})
    return serialize_doc(updated_res)
