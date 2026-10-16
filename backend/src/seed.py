from datetime import datetime, timezone
from src.database import hotels_col, rooms_col, users_col, chains_col, reservations_col
import logging

logger = logging.getLogger("staypulse.seed")

def seed_database(force: bool = False):
    """Seed database with realistic Indian luxury and boutique hotels, rooms, and chains."""
    hotel_count = hotels_col.count_documents({})
    if hotel_count > 0 and not force:
        logger.info(f"Database already populated ({hotel_count} hotels found). Skipping seed.")
        return

    logger.info("Seeding database with hotels, room slots, and chains...")
    
    if force:
        hotels_col.delete_many({})
        rooms_col.delete_many({})
        chains_col.delete_many({})
        users_col.delete_many({})
        reservations_col.delete_many({})
        logger.info("Cleared existing database collections for fresh seed.")

    # 1. Seed Hotel Chains
    chains = [
        {
            "name": "IHCL (Taj)",
            "logo": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&auto=format&fit=crop&q=80",
            "tier": "Luxury Heritage & Modern",
            "hotel_count": 2
        },
        {
            "name": "The Leela Palaces",
            "logo": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&auto=format&fit=crop&q=80",
            "tier": "Ultra Luxury",
            "hotel_count": 1
        },
        {
            "name": "Marriott Luxury",
            "logo": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&auto=format&fit=crop&q=80",
            "tier": "Global Luxury",
            "hotel_count": 2
        },
        {
            "name": "Bloom Hotel Group",
            "logo": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=200&auto=format&fit=crop&q=80",
            "tier": "Boutique & Value",
            "hotel_count": 1
        },
        {
            "name": "Lemon Tree Hotels",
            "logo": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=200&auto=format&fit=crop&q=80",
            "tier": "Upper Midscale",
            "hotel_count": 1
        }
    ]
    chains_col.insert_many(chains)

    # 2. Seed Official Admin
    now = datetime.now(timezone.utc).isoformat()
    users = [
        {
            "email": "jesusfromrehab@gmail.com",
            "name": "StayPulse Admin",
            "profile_pic": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80",
            "role": "admin",
            "created_at": now
        }
    ]
    users_col.insert_many(users)

    # 3. Seed 8 Hotels with detailed policies and rooms
    hotels_data = [
        # 1. Taj Lands End, Mumbai
        {
            "name": "Taj Lands End",
            "brand": "IHCL",
            "city": "Mumbai",
            "address": "Bandstand, BJ Road, Bandra West, Mumbai, Maharashtra 400050",
            "star_rating": 5,
            "starting_price": 7499.0,
            "images": [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 22 6668 1234",
                "email": "landsend.mumbai@tajhotels.com"
            },
            "timings": {
                "standard_checkin": "14:00",
                "standard_checkout": "12:00",
                "cutoff_time": "20:00",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 24,
                "cancellation_fee": 1500.0,
                "policy_text": "Free cancellation up to 24 hours before check-in date. Late arrival notice must be provided before 20:00 to prevent room release. Pay at Property available."
            },
            "amenities": ["Free High-Speed WiFi", "Infinity Swimming Pool", "24/7 Front Desk", "Sea-View Lounge", "Airport Shuttle", "Spa & Wellness", "Valet Parking"],
            "description": "Perched on the historic Bandstand waterfront overlooking the Arabian Sea and the Bandra-Worli Sea Link, Taj Lands End is the quintessential luxury hotel in Mumbai.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Deluxe Sea-View King Room",
                    "description": "Spacious 380 sq ft room with panoramic Arabian Sea views, signature Taj king-size posturepedic bed, and Italian marble bath.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed",
                    "room_size": "380 sq ft",
                    "price_per_night": 7499.0,
                    "total_slots": 15,
                    "available_slots": 5,
                    "amenities": ["Free High-Speed WiFi", "Buffet Breakfast Included", "Mini Bar", "Work Desk", "4K Smart TV", "Ocean View"],
                    "image": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Executive Sea-View Suite",
                    "description": "Ultra-luxury 650 sq ft suite with separate living parlor, ocean-facing balcony, butler service, and complimentary cocktail hours.",
                    "capacity": {"adults": 3, "children": 2},
                    "bed_type": "1 King Bed + 1 Rollaway",
                    "room_size": "650 sq ft",
                    "price_per_night": 14999.0,
                    "total_slots": 6,
                    "available_slots": 2,
                    "amenities": ["Taj Club Lounge Access", "Roundtrip Airport Transfer", "Butler Service", "Complimentary High Tea", "Jacuzzi"],
                    "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80"
                }
            ]
        },
        # 2. The Lalit Mumbai
        {
            "name": "The Lalit Mumbai",
            "brand": "The Lalit",
            "city": "Mumbai",
            "address": "Sahar Airport Road, Andheri East, Mumbai, Maharashtra 400059",
            "star_rating": 4,
            "starting_price": 5299.0,
            "images": [
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 22 6699 2222",
                "email": "mumbai@thelalit.com"
            },
            "timings": {
                "standard_checkin": "14:00",
                "standard_checkout": "12:00",
                "cutoff_time": "23:59",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 12,
                "cancellation_fee": 1000.0,
                "policy_text": "Free cancellation up to 12 hours prior to arrival date. 24/7 Front desk check-in available. Seamless airport transit hold."
            },
            "amenities": ["24/7 Front Desk", "Free Airport Shuttle", "Outdoor Pool", "Fitness Center", "Multi-Cuisine Buffet", "Soundproof Rooms"],
            "description": "Minutes away from Chhatrapati Shivaji Maharaj International Airport (T2), featuring the largest atrium lobby in Asia and world-class hospitality.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Deluxe Airport View Room",
                    "description": "320 sq ft soundproof room with sleek ergonomic workspace and runway skyline view.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed or 2 Twins",
                    "room_size": "320 sq ft",
                    "price_per_night": 5299.0,
                    "total_slots": 20,
                    "available_slots": 8,
                    "amenities": ["Free High-Speed WiFi", "Soundproof Double Glazing", "Tea/Coffee Maker", "Express Check-in"],
                    "image": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Premier Club Suite",
                    "description": "520 sq ft suite with private check-in lounge access, bathtub, and complimentary express breakfast.",
                    "capacity": {"adults": 2, "children": 2},
                    "bed_type": "1 King Bed",
                    "room_size": "520 sq ft",
                    "price_per_night": 8999.0,
                    "total_slots": 8,
                    "available_slots": 4,
                    "amenities": ["Free Breakfast Buffet", "Club Lounge Access", "Late Checkout 15:00", "Premium Toiletries"],
                    "image": "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop&q=80"
                }
            ]
        },
        # 3. The Leela Palace, New Delhi
        {
            "name": "The Leela Palace New Delhi",
            "brand": "The Leela Palaces",
            "city": "New Delhi",
            "address": "Diplomatic Enclave, Chanakyapuri, New Delhi, Delhi 110023",
            "star_rating": 5,
            "starting_price": 9999.0,
            "images": [
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 11 3933 1234",
                "email": "concierge.delhi@theleela.com"
            },
            "timings": {
                "standard_checkin": "14:00",
                "standard_checkout": "12:00",
                "cutoff_time": "21:00",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 48,
                "cancellation_fee": 2500.0,
                "policy_text": "Free cancellation up to 48h prior to check-in. Front desk closes check-in at 21:00 without prior notice. Late check-in hold requires flight details."
            },
            "amenities": ["Rooftop Heated Infinity Pool", "Michelin-Inspired Dining", "Royal Spa", "24/7 Front Desk", "High-Speed WiFi", "Limousine Service"],
            "description": "An architectural marvel blending Lutyens architectural grandeur with royal Indian heritage in the prestigious Diplomatic Enclave.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Grand Deluxe Heritage Room",
                    "description": "550 sq ft royal room with plush hand-tufted carpets, gold-plated fixtures, and views of lush Lutyens gardens.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed",
                    "room_size": "550 sq ft",
                    "price_per_night": 9999.0,
                    "total_slots": 12,
                    "available_slots": 4,
                    "amenities": ["Free High-Speed WiFi", "Lavazza Espresso Machine", "Marble Bath with Soak Tub", "24/7 In-Room Dining"],
                    "image": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Royal Palace Suite",
                    "description": "980 sq ft imperial suite featuring private salon, walk-in closets, dining table for 4, and 24-hour dedicated butler.",
                    "capacity": {"adults": 3, "children": 2},
                    "bed_type": "1 King Bed + Living Divan",
                    "room_size": "980 sq ft",
                    "price_per_night": 21999.0,
                    "total_slots": 4,
                    "available_slots": 1,
                    "amenities": ["Private Butler Service", "Complimentary Breakfast", "Rolls-Royce Chauffeur Transfer", "Luxury Bar"],
                    "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80"
                }
            ]
        },
        # 4. Bloomrooms @ Janpath, New Delhi
        {
            "name": "Bloomrooms @ Janpath",
            "brand": "Bloom Hotel Group",
            "city": "New Delhi",
            "address": "1 Janpath Lane, Connaught Place, New Delhi, Delhi 110001",
            "star_rating": 3,
            "starting_price": 3199.0,
            "images": [
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 11 4122 3344",
                "email": "janpath@bloomrooms.com"
            },
            "timings": {
                "standard_checkin": "14:00",
                "standard_checkout": "11:00",
                "cutoff_time": "20:30",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 24,
                "cancellation_fee": 800.0,
                "policy_text": "Strict 20:30 cut-off! Reservations not checked in or held by 20:30 may be released to waiting walk-in guests. Free cancellation up to 24h before."
            },
            "amenities": ["Free High-Speed WiFi", "CloudBeds Mattress", "Rain Shower", "Cafe Bloom", "Keycard Security", "Luggage Storage"],
            "description": "Crisp, vibrant, and minimalist boutique stay located walking distance from Connaught Place and Janpath flea market.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Standard Queen Pod Room",
                    "description": "Compact 220 sq ft modern room engineered with custom CloudBeds, Grohe rain shower, and silent air-conditioning.",
                    "capacity": {"adults": 2, "children": 0},
                    "bed_type": "1 Queen Bed",
                    "room_size": "220 sq ft",
                    "price_per_night": 3199.0,
                    "total_slots": 25,
                    "available_slots": 7,
                    "amenities": ["High-Speed WiFi", "Grohe Rain Shower", "Work Desk", "Laptop Safe", "Complimentary Water"],
                    "image": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Bloom Superior King Room",
                    "description": "Sunny 290 sq ft bright room with garden views, sitting nook, and complimentary continental breakfast.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed",
                    "room_size": "290 sq ft",
                    "price_per_night": 4299.0,
                    "total_slots": 14,
                    "available_slots": 4,
                    "amenities": ["Free Breakfast", "High-Speed WiFi", "Smart TV", "Tea/Coffee Station"],
                    "image": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80"
                }
            ]
        },
        # 5. The Ritz-Carlton, Bangalore
        {
            "name": "The Ritz-Carlton Bangalore",
            "brand": "Marriott Luxury",
            "city": "Bangalore",
            "address": "99 Residency Road, Shanthala Nagar, Bangalore, Karnataka 560025",
            "star_rating": 5,
            "starting_price": 8499.0,
            "images": [
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 80 4914 8000",
                "email": "rc.blr@ritzcarlton.com"
            },
            "timings": {
                "standard_checkin": "15:00",
                "standard_checkout": "12:00",
                "cutoff_time": "22:00",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 24,
                "cancellation_fee": 1800.0,
                "policy_text": "Free cancellation until 18:00 one day prior to arrival. Late check-in guaranteed upon flight number notification."
            },
            "amenities": ["Ritz-Carlton Spa", "Rooftop Bar BANG", "Outdoor Thermal Pool", "24/7 Front Desk", "Valet Parking", "Club Lounge"],
            "description": "Centrally located on Residency Road, combining contemporary elegance with traditional Jaali screens and contemporary Indian artwork.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Deluxe Garden View Room",
                    "description": "420 sq ft room featuring marble bathroom with built-in TV mirror, duck feather pillows, and garden views.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed",
                    "room_size": "420 sq ft",
                    "price_per_night": 8499.0,
                    "total_slots": 16,
                    "available_slots": 6,
                    "amenities": ["Free High-Speed WiFi", "Marble Bath with TV in Mirror", "Nespresso Maker", "Turn-down Service"],
                    "image": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Executive Club Suite",
                    "description": "780 sq ft suite with private check-in, all-day culinary presentations at the Club Lounge, and luxury soaking tub.",
                    "capacity": {"adults": 3, "children": 1},
                    "bed_type": "1 King Bed + Lounge Sofa",
                    "room_size": "780 sq ft",
                    "price_per_night": 16499.0,
                    "total_slots": 6,
                    "available_slots": 2,
                    "amenities": ["Ritz Club Lounge Access", "Complimentary High Tea & Cocktails", "Executive Workstation", "Deep Soaking Tub"],
                    "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80"
                }
            ]
        },
        # 6. Lemon Tree Premier, Bangalore
        {
            "name": "Lemon Tree Premier Ulsoor",
            "brand": "Lemon Tree Hotels",
            "city": "Bangalore",
            "address": "2/1 St. John's Road, Ulsoor, Bangalore, Karnataka 560042",
            "star_rating": 4,
            "starting_price": 4199.0,
            "images": [
                "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 80 4480 2000",
                "email": "hi.blr@lemontreehotels.com"
            },
            "timings": {
                "standard_checkin": "14:00",
                "standard_checkout": "12:00",
                "cutoff_time": "21:30",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 24,
                "cancellation_fee": 900.0,
                "policy_text": "Free cancellation up to 24h before check-in. Cut-off time 21:30 without prior flight delay notification."
            },
            "amenities": ["Rooftop Swimming Pool", "Citrus Cafe 24/7", "Sl莽 Bar", "Fitness Center", "Free WiFi", "Business Center"],
            "description": "Overlooking the tranquil waters of Ulsoor Lake, providing upbeat, spirited hospitality in the heart of the silicon city.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Superior Lake-View Room",
                    "description": "310 sq ft cheery room with large bay windows framing panoramic views of Ulsoor Lake.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed or 2 Twins",
                    "room_size": "310 sq ft",
                    "price_per_night": 4199.0,
                    "total_slots": 18,
                    "available_slots": 6,
                    "amenities": ["Free High-Speed WiFi", "Lake View", "Ergonomic Work Desk", "Minibar", "Electronic Safe"],
                    "image": "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Executive Suite with Balcony",
                    "description": "500 sq ft suite with private sit-out balcony overlooking the lake and landscaped gardens.",
                    "capacity": {"adults": 2, "children": 2},
                    "bed_type": "1 King Bed",
                    "room_size": "500 sq ft",
                    "price_per_night": 6999.0,
                    "total_slots": 8,
                    "available_slots": 3,
                    "amenities": ["Private Balcony", "Free Buffet Breakfast", "Late Checkout", "Bath Tub"],
                    "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80"
                }
            ]
        },
        # 7. W Goa, Vagator Beach
        {
            "name": "W Goa Vagator Beach",
            "brand": "Marriott Luxury",
            "city": "Goa",
            "address": "Vagator Beach, Bardez, Goa 403509",
            "star_rating": 5,
            "starting_price": 9499.0,
            "images": [
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 832 671 8888",
                "email": "w.goa@whotels.com"
            },
            "timings": {
                "standard_checkin": "15:00",
                "standard_checkout": "12:00",
                "cutoff_time": "22:00",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 48,
                "cancellation_fee": 2000.0,
                "policy_text": "Free cancellation up to 48 hours before arrival. Beachfront front desk supports late night check-in holds past 22:00."
            },
            "amenities": ["WET Outdoor Pool", "Rockpool Sunset Bar", "AWAY Spa", "Direct Beach Access", "24/7 Concierge", "Free High-Speed WiFi"],
            "description": "Tucked away under the canopy of Chapora Fort, W Goa sets the scene for vibrant beach nightlife, epic sunsets, and chic chalets.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Wonderful King Chalet",
                    "description": "480 sq ft bohemian luxury chalet with private patio, outdoor terrazzo tub, and rainforest shower.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed",
                    "room_size": "480 sq ft",
                    "price_per_night": 9499.0,
                    "total_slots": 14,
                    "available_slots": 4,
                    "amenities": ["Free High-Speed WiFi", "Outdoor Terrazzo Tub", "Bose Bluetooth Audio", "W MixBar", "Patio"],
                    "image": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Marvelous Sea-View Villa",
                    "description": "950 sq ft private villa with secluded plunge pool, panoramic Arabian Sea vistas, and personalized Whatever/Whenever service.",
                    "capacity": {"adults": 3, "children": 2},
                    "bed_type": "1 King Bed + Cabana",
                    "room_size": "950 sq ft",
                    "price_per_night": 22499.0,
                    "total_slots": 5,
                    "available_slots": 2,
                    "amenities": ["Private Plunge Pool", "Sea View Deck", "Sunset Cocktails", "Butler Assistance", "Espresso Bar"],
                    "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80"
                }
            ]
        },
        # 8. Taj Fort Aguada Resort, Goa
        {
            "name": "Taj Fort Aguada Resort & Spa",
            "brand": "IHCL",
            "city": "Goa",
            "address": "Sinquerim, Candolim, Bardez, Goa 403515",
            "star_rating": 5,
            "starting_price": 8999.0,
            "images": [
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80"
            ],
            "contact": {
                "phone": "+91 832 664 5858",
                "email": "fortaguada.goa@tajhotels.com"
            },
            "timings": {
                "standard_checkin": "14:00",
                "standard_checkout": "12:00",
                "cutoff_time": "21:00",
                "allow_late_checkin": True
            },
            "cancellation_policy": {
                "free_cancellation_until_hours": 24,
                "cancellation_fee": 1500.0,
                "policy_text": "Free cancellation up to 24h before check-in. Late arrival hold available past 21:00 with prior desk registration."
            },
            "amenities": ["Heritage 16th-century Ramparts", "Beachfront Swimming Pool", "J Wellness Circle Spa", "Water Sports", "24/7 Front Desk", "Pay at Property Available"],
            "description": "Built on the ramparts of a 16th-century Portuguese fortress facing the Arabian Sea, Goa's legendary premier luxury resort.",
            "created_at": now,
            "rooms": [
                {
                    "room_type": "Superior Portuguese Heritage Room",
                    "description": "350 sq ft colonial-style room with terracotta accents, dark wood furnishings, and private garden patio.",
                    "capacity": {"adults": 2, "children": 1},
                    "bed_type": "1 King Bed",
                    "room_size": "350 sq ft",
                    "price_per_night": 8999.0,
                    "total_slots": 15,
                    "available_slots": 5,
                    "amenities": ["Free High-Speed WiFi", "Garden Terrace", "Forest Essentials Amenities", "Complimentary Breakfast"],
                    "image": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"
                },
                {
                    "room_type": "Aguada Sunset Sea-Facing Villa",
                    "description": "680 sq ft standalone coastal villa offering uninhibited views of the Aguada fortress and coastline.",
                    "capacity": {"adults": 3, "children": 2},
                    "bed_type": "1 King Bed + Sofa Bed",
                    "room_size": "680 sq ft",
                    "price_per_night": 17999.0,
                    "total_slots": 6,
                    "available_slots": 2,
                    "amenities": ["Panoramic Sea View", "Private Sundeck", "Jiva Spa Voucher", "Airport Limousine", "Breakfast Buffet"],
                    "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80"
                }
            ]
        }
    ]

    for h_data in hotels_data:
        rooms_list = h_data.pop("rooms")
        hotel_result = hotels_col.insert_one(h_data)
        hotel_id = hotel_result.inserted_id

        for r in rooms_list:
            r["hotel_id"] = str(hotel_id)
            rooms_col.insert_one(r)

    logger.info("Successfully seeded 8 hotels and room slots into MongoDB staypulse_db!")

if __name__ == "__main__":
    seed_database(force=True)
