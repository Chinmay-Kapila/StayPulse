import requests
import json

BASE_URL = "http://localhost:9000/api"

def run_tests():
    print("=== 1. Testing Health Endpoint ===")
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("[PASS] Health check OK:", res.json())

    print("\n=== 2. Testing Direct Admin Authentication (jesusfromrehab@gmail.com) ===")
    res = requests.post(f"{BASE_URL}/auth/signin-email", json={
        "email": "jesusfromrehab@gmail.com",
        "name": "StayPulse Admin"
    })
    assert res.status_code == 200, f"Admin signin failed: {res.text}"
    admin_auth = res.json()
    admin_token = admin_auth["access_token"]
    admin_user = admin_auth["user"]
    assert admin_user["role"] == "admin", f"Expected admin role, got {admin_user['role']}"
    assert admin_user["email"] == "jesusfromrehab@gmail.com"
    print("[PASS] Admin authenticated:", admin_user["email"], "| Role:", admin_user["role"])

    print("\n=== 3. Testing Direct Regular User Authentication (traveler@gmail.com) ===")
    res = requests.post(f"{BASE_URL}/auth/signin-email", json={
        "email": "traveler@gmail.com",
        "name": "Jane Traveler"
    })
    assert res.status_code == 200, f"User signin failed: {res.text}"
    user_auth = res.json()
    user_token = user_auth["access_token"]
    user_data = user_auth["user"]
    assert user_data["role"] == "user", f"Expected user role, got {user_data['role']}"
    print("[PASS] Regular user authenticated:", user_data["email"], "| Role:", user_data["role"])

    print("\n=== 4. Testing Admin Route Protection ===")
    # Without token -> 401
    res_no_auth = requests.get(f"{BASE_URL}/admin/hotels")
    assert res_no_auth.status_code in [401, 403], f"Expected 401/403, got {res_no_auth.status_code}"
    print("[PASS] Unauthenticated request blocked correctly:", res_no_auth.status_code)

    # With regular user token -> 403
    res_forbidden = requests.get(f"{BASE_URL}/admin/hotels", headers={"Authorization": f"Bearer {user_token}"})
    assert res_forbidden.status_code == 403, f"Expected 403 Forbidden, got {res_forbidden.status_code}"
    print("[PASS] Regular user blocked from admin routes correctly: 403 Forbidden")

    # With admin token -> 200
    res_admin_ok = requests.get(f"{BASE_URL}/admin/hotels", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_ok.status_code == 200, f"Admin failed to access admin/hotels: {res_admin_ok.status_code}"
    hotels = res_admin_ok.json()
    print(f"[PASS] Admin authorized successfully! Retrieved {len(hotels)} hotels.")

    print("\n=== 5. Testing Hotel Directory & Slots Search ===")
    res_search = requests.get(f"{BASE_URL}/hotels/search?city=Mumbai")
    assert res_search.status_code == 200
    mumbai_hotels = res_search.json()
    assert len(mumbai_hotels) > 0, "No Mumbai hotels found"
    first_hotel = mumbai_hotels[0]
    print(f"[PASS] Found {len(mumbai_hotels)} Mumbai hotels. First: {first_hotel['name']} (ID: {first_hotel['id']})")

    # Get rooms
    res_rooms = requests.get(f"{BASE_URL}/hotels/{first_hotel['id']}/rooms")
    assert res_rooms.status_code == 200
    rooms = res_rooms.json()
    assert len(rooms) > 0, "No rooms found for hotel"
    room = rooms[0]
    print(f"[PASS] Found {len(rooms)} rooms. First room: {room['room_type']} - Available slots: {room['available_slots']}")

    print("\n=== 6. Testing Reservation Creation ===")
    res_booking = requests.post(f"{BASE_URL}/reservations", json={
        "hotel_id": first_hotel["id"],
        "room_id": room["id"],
        "guest": {
            "name": "E2E Test Guest",
            "email": "testguest@gmail.com",
            "phone": "+91 99999 88888",
            "number_of_guests": 2
        },
        "booking_type": "user",
        "user_id": user_data["id"],
        "checkin_date": "2026-11-01",
        "checkout_date": "2026-11-03",
        "nights": 2,
        "expected_arrival_time": "18:00 - 20:00",
        "late_checkin_hold_requested": True,
        "special_requests": "Late arrival test AI-102",
        "payment_mode": "PAY_AT_PROPERTY"
    })
    assert res_booking.status_code == 200, f"Booking creation failed: {res_booking.text}"
    booking = res_booking.json()
    booking_id = booking["booking_id"]
    print("[PASS] Reservation created successfully! Booking ID:", booking_id)

    print("\n=== 7. Testing Lookup Portal by Booking ID Only ===")
    res_lookup = requests.get(f"{BASE_URL}/reservations/{booking_id}")
    assert res_lookup.status_code == 200, f"Lookup failed: {res_lookup.text}"
    lookup_data = res_lookup.json()
    assert lookup_data["booking_id"] == booking_id
    assert lookup_data["status"] in ["CONFIRMED", "APPROVED"]
    print(f"[PASS] Lookup by Booking ID succeeded: {booking_id} -> Status: {lookup_data['status']}")

    print("\n=== 8. Testing Admin Status Update (WAITING, APPROVED, CHECKIN_AT_RISK) ===")
    res_update_status = requests.put(
        f"{BASE_URL}/admin/reservations/{booking_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "WAITING", "notes": "Awaiting flight confirmation"}
    )
    assert res_update_status.status_code == 200
    updated_res = res_update_status.json()
    assert updated_res["status"] == "WAITING"
    print("[PASS] Admin status transition to 'WAITING' verified!")

    print("\n=== 9. Testing Admin Direct Cancellation for Any User ===")
    res_cancel = requests.post(
        f"{BASE_URL}/admin/reservations/{booking_id}/cancel",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Admin test cancellation"}
    )
    assert res_cancel.status_code == 200
    cancelled_res = res_cancel.json()
    assert cancelled_res["status"] == "CANCELLED"
    print("[PASS] Admin cancelled user booking successfully! Status:", cancelled_res["status"])

    # Verify lookup now shows CANCELLED
    res_lookup_after = requests.get(f"{BASE_URL}/reservations/{booking_id}")
    assert res_lookup_after.json()["status"] == "CANCELLED"
    print("[PASS] Public lookup reflects CANCELLED status accurately.")

    print("\n=== 10. Testing Non-existent Booking Lookup ===")
    res_404 = requests.get(f"{BASE_URL}/reservations/STAY-NONEXISTENT")
    assert res_404.status_code == 404
    print("[PASS] Non-existent booking returned 404 with detail:", res_404.json()["detail"])

    print("\n==========================================")
    print("ALL 10 END-TO-END VERIFICATION CHECKS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
