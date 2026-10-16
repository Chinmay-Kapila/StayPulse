from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from bson import ObjectId
import re
from src.database import hotels_col, rooms_col, chains_col, serialize_doc, serialize_docs

router = APIRouter(prefix="/hotels", tags=["Hotels"])

@router.get("/cities")
def get_cities():
    """Retrieve list of distinct cities and their hotel counts."""
    pipeline = [
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    cities_agg = list(hotels_col.aggregate(pipeline))
    return [{"city": item["_id"], "count": item["count"]} for item in cities_agg if item["_id"]]

@router.get("/chains")
def get_chains():
    """Retrieve list of luxury hotel chains."""
    chains = list(chains_col.find({}))
    return serialize_docs(chains)

@router.get("/search")
def search_hotels(
    city: Optional[str] = Query(None, description="Destination city, e.g. Mumbai, New Delhi, Goa, Bangalore"),
    checkin: Optional[str] = Query(None, description="Check-in date YYYY-MM-DD"),
    checkout: Optional[str] = Query(None, description="Check-out date YYYY-MM-DD"),
    guests: Optional[int] = Query(None, description="Number of guests"),
    rooms: Optional[int] = Query(1, description="Number of rooms requested"),
    min_price: Optional[float] = Query(None, description="Minimum price per night"),
    max_price: Optional[float] = Query(None, description="Maximum price per night"),
    star_rating: Optional[int] = Query(None, description="Minimum star rating (1-5)"),
    brand: Optional[str] = Query(None, description="Brand/Chain name"),
    free_cancellation: Optional[bool] = Query(None, description="Filter free cancellation"),
    sort: Optional[str] = Query("recommended", description="Sort by: price_asc, price_desc, rating_desc, recommended")
):
    """Search and filter hotels for TinyFish crawlers and human travelers."""
    query = {}

    if city and city.strip() and city.lower() != "all":
        # Case insensitive exact or substring match
        clean_city = city.strip()
        query["city"] = {"$regex": f"^{re.escape(clean_city)}$", "$options": "i"}

    if star_rating:
        query["star_rating"] = {"$gte": star_rating}

    if brand and brand.strip() and brand.lower() != "all":
        query["brand"] = {"$regex": re.escape(brand.strip()), "$options": "i"}

    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["starting_price"] = price_query

    # Fetch hotels
    cursor = hotels_col.find(query)

    # Sort
    if sort == "price_asc":
        cursor = cursor.sort("starting_price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("starting_price", -1)
    elif sort == "rating_desc":
        cursor = cursor.sort("star_rating", -1)
    else:
        cursor = cursor.sort("star_rating", -1)

    hotels = list(cursor)

    # Attach live room summary and compute capacity eligibility
    results = []
    for h in hotels:
        h_id_str = str(h["_id"])
        room_query = {"hotel_id": h_id_str}
        
        # Room inventory
        hotel_rooms = list(rooms_col.find(room_query))
        serialized_rooms = serialize_docs(hotel_rooms)
        
        # Check if any room has availability and matches guest capacity
        total_available_slots = sum(r.get("available_slots", 0) for r in hotel_rooms)
        min_room_price = min([r.get("price_per_night", 99999) for r in hotel_rooms]) if hotel_rooms else h.get("starting_price", 3499.0)

        # If guests requested, check if any room fits
        if guests:
            matching_rooms = [r for r in hotel_rooms if (r.get("capacity", {}).get("adults", 2) + r.get("capacity", {}).get("children", 0)) >= guests]
            if not matching_rooms and hotel_rooms:
                # If no single room fits, still show if multiple rooms requested
                pass

        serialized_h = serialize_doc(h)
        serialized_h["total_available_slots"] = total_available_slots
        serialized_h["min_price"] = min_room_price
        serialized_h["room_count"] = len(hotel_rooms)
        serialized_h["rooms"] = serialized_rooms

        results.append(serialized_h)

    return results

@router.get("/{id}")
def get_hotel_detail(id: str):
    """Get full details for a hotel including room slots and check-in policies."""
    try:
        hotel = hotels_col.find_one({"_id": ObjectId(id)})
    except Exception:
        hotel = hotels_col.find_one({"id": id})

    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    hotel_data = serialize_doc(hotel)
    
    # Fetch rooms for this hotel
    rooms = list(rooms_col.find({"hotel_id": str(hotel["_id"])}))
    hotel_data["rooms"] = serialize_docs(rooms)
    
    return hotel_data

@router.get("/{id}/rooms")
def get_hotel_rooms(id: str):
    """Retrieve available room slots for a specific hotel."""
    rooms = list(rooms_col.find({"hotel_id": id}))
    if not rooms:
        # Check by ObjectId string
        try:
            rooms = list(rooms_col.find({"hotel_id": str(ObjectId(id))}))
        except Exception:
            pass
    return serialize_docs(rooms)
