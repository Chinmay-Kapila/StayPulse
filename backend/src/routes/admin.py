from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
from src.database import hotels_col, rooms_col, reservations_col, users_col, serialize_doc, serialize_docs
from src.schemas import HotelCreate, HotelUpdate, RoomCreate, RoomUpdate, StatusUpdateRequest
from src.seed import seed_database
from src.auth import get_admin_user
import logging

logger = logging.getLogger("staypulse.admin")
router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(get_admin_user)])

@router.get("/hotels")
def admin_list_hotels():
    """List all hotels with room count and inventory summary."""
    hotels = list(hotels_col.find({}).sort("name", 1))
    results = []
    for h in hotels:
        h_id_str = str(h["_id"])
        rooms = list(rooms_col.find({"hotel_id": h_id_str}))
        h_data = serialize_doc(h)
        h_data["rooms"] = serialize_docs(rooms)
        h_data["total_rooms"] = len(rooms)
        h_data["total_slots"] = sum(r.get("total_slots", 0) for r in rooms)
        h_data["available_slots"] = sum(r.get("available_slots", 0) for r in rooms)
        results.append(h_data)
    return results

@router.post("/hotels")
def admin_create_hotel(payload: HotelCreate):
    """Add a new hotel listing."""
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    inserted = hotels_col.insert_one(doc)
    doc["_id"] = inserted.inserted_id
    return serialize_doc(doc)

@router.put("/hotels/{id}")
def admin_update_hotel(id: str, payload: HotelUpdate):
    """Update hotel information, policies, or timings."""
    try:
        query = {"_id": ObjectId(id)}
    except Exception:
        query = {"id": id}

    hotel = hotels_col.find_one(query)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        hotels_col.update_one(query, {"$set": update_data})

    updated = hotels_col.find_one(query)
    return serialize_doc(updated)

@router.delete("/hotels/{id}")
def admin_delete_hotel(id: str):
    """
    Delete a hotel from management.
    Per business rules: all reservations attached to this hotel are NOT deleted,
    but are marked as CANCELLED with full refund authorized, keeping historical records intact.
    """
    try:
        query = {"_id": ObjectId(id)}
    except Exception:
        query = {"id": id}

    hotel = hotels_col.find_one(query)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    hotel_id_str = str(hotel["_id"])
    now_iso = datetime.now(timezone.utc).isoformat()

    # Cancel all active reservations attached to this hotel
    res_query = {
        "$or": [
            {"hotel_id": hotel_id_str},
            {"hotel_id": id}
        ],
        "status": {"$ne": "CANCELLED"}
    }
    
    active_reservations = list(reservations_col.find(res_query))
    cancelled_count = len(active_reservations)

    for r in active_reservations:
        total_fee = r.get("pricing", {}).get("total_fee", 0.0)
        is_paid = r.get("payment", {}).get("status") == "PAID"
        reservations_col.update_one(
            {"_id": r["_id"]},
            {
                "$set": {
                    "status": "CANCELLED",
                    "cancellation": {
                        "cancelled_at": now_iso,
                        "refund_amount": total_fee if is_paid else 0.0,
                        "penalty_fee": 0.0,
                        "policy_applied": "Hotel property decommissioned by administrator",
                        "reason": f"Hotel '{hotel.get('name')}' removed by administrator"
                    },
                    "payment.status": "CANCELLED_DUE_TO_HOTEL_REMOVAL"
                }
            }
        )

    # Delete hotel and room inventory
    hotels_col.delete_one(query)
    rooms_col.delete_many({"hotel_id": hotel_id_str})

    return {
        "success": True,
        "message": f"Hotel deleted. {cancelled_count} associated user reservation(s) were transitioned to CANCELLED."
    }

@router.post("/hotels/{id}/rooms")
def admin_create_room(id: str, payload: RoomCreate):
    """Add a room slot to a hotel."""
    try:
        hotel = hotels_col.find_one({"_id": ObjectId(id)})
    except Exception:
        hotel = hotels_col.find_one({"id": id})

    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    doc = payload.model_dump()
    doc["hotel_id"] = str(hotel["_id"])
    inserted = rooms_col.insert_one(doc)
    doc["_id"] = inserted.inserted_id
    return serialize_doc(doc)

@router.put("/rooms/{room_id}")
def admin_update_room(room_id: str, payload: RoomUpdate):
    """Update room slot capacity, pricing, or available inventory."""
    try:
        query = {"_id": ObjectId(room_id)}
    except Exception:
        query = {"id": room_id}

    room = rooms_col.find_one(query)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        rooms_col.update_one(query, {"$set": update_data})

    updated = rooms_col.find_one(query)
    return serialize_doc(updated)

@router.delete("/rooms/{room_id}")
def admin_delete_room(room_id: str):
    """Delete a room slot."""
    try:
        query = {"_id": ObjectId(room_id)}
    except Exception:
        query = {"id": room_id}

    room = rooms_col.find_one(query)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    rooms_col.delete_one(query)
    return {"success": True, "message": "Room slot deleted"}

@router.get("/reservations")
def admin_list_reservations(
    status: Optional[str] = Query(None),
    hotel_id: Optional[str] = Query(None),
    limit: int = 100
):
    """
    List all hotel registrations and arrival log.
    Allows testing disruption triggers and updating statuses.
    """
    query = {}
    if status and status != "ALL":
        query["status"] = status
    if hotel_id:
        query["hotel_id"] = hotel_id

    reservations = list(reservations_col.find(query).sort("created_at", -1).limit(limit))
    return serialize_docs(reservations)

@router.put("/reservations/{id}/status")
def admin_update_reservation_status(id: str, payload: StatusUpdateRequest):
    """
    Admin action to mark or update reservation status:
    WAITING, APPROVED, CONFIRMED, CHECKIN_AT_RISK, LATE_ARRIVAL_APPROVED, CANCELLED, EXPIRED, CHECKED_IN, NO_SHOW.
    """
    try:
        query = {"_id": ObjectId(id)}
    except Exception:
        query = {"booking_id": id}

    res = reservations_col.find_one(query)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")

    target_status = payload.status.upper()
    now_iso = datetime.now(timezone.utc).isoformat()
    update_fields = {
        "status": target_status,
        "admin_status_updated_at": now_iso
    }
    if payload.notes:
        update_fields["admin_notes"] = payload.notes

    # If transitioning to CANCELLED, release room inventory
    if target_status == "CANCELLED" and res.get("status") != "CANCELLED":
        try:
            rooms_col.update_one({"_id": ObjectId(res["room_id"])}, {"$inc": {"available_slots": 1}})
        except Exception:
            pass
        
        total_fee = res.get("pricing", {}).get("total_fee", 0.0)
        is_paid = res.get("payment", {}).get("status") == "PAID"
        update_fields["cancellation"] = {
            "cancelled_at": now_iso,
            "refund_amount": total_fee if is_paid else 0.0,
            "penalty_fee": 0.0,
            "policy_applied": "Administrative cancellation by Front Desk",
            "reason": payload.notes or "Cancelled by Administrator"
        }
        update_fields["payment.status"] = "REFUNDED" if is_paid else "CANCELLED_WITHOUT_CHARGE"

    reservations_col.update_one({"_id": res["_id"]}, {"$set": update_fields})
    updated = reservations_col.find_one({"_id": res["_id"]})
    return serialize_doc(updated)

@router.post("/reservations/{id}/cancel")
def admin_cancel_reservation(id: str, reason: str = Body(default="Cancelled by StayPulse Administrator", embed=True)):
    """Admin action to immediately cancel any user booking with full refund calculation."""
    try:
        query = {"_id": ObjectId(id)}
    except Exception:
        query = {"booking_id": id}

    res = reservations_col.find_one(query)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if res.get("status") == "CANCELLED":
        return serialize_doc(res)

    now_iso = datetime.now(timezone.utc).isoformat()
    total_fee = res.get("pricing", {}).get("total_fee", 0.0)
    is_paid = res.get("payment", {}).get("status") == "PAID"

    try:
        rooms_col.update_one({"_id": ObjectId(res["room_id"])}, {"$inc": {"available_slots": 1}})
    except Exception:
        pass

    reservations_col.update_one(
        {"_id": res["_id"]},
        {
            "$set": {
                "status": "CANCELLED",
                "cancellation": {
                    "cancelled_at": now_iso,
                    "refund_amount": total_fee if is_paid else 0.0,
                    "penalty_fee": 0.0,
                    "policy_applied": "Full refund authorized by Administrator",
                    "reason": reason
                },
                "payment.status": "REFUNDED" if is_paid else "CANCELLED_WITHOUT_CHARGE"
            }
        }
    )

    updated = reservations_col.find_one({"_id": res["_id"]})
    return serialize_doc(updated)

@router.post("/seed/reset")
def admin_reset_seed():
    """Reset database to initial pristine seeded state."""
    seed_database(force=True)
    return {"success": True, "message": "Database reset to initial state with 8 hotels and 16 room slots."}
