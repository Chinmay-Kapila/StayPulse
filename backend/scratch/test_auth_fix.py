import requests

BASE_URL = "http://localhost:9000/api"

def test_auth():
    print("Testing /api/auth/signin-email with admin email: jesusfromrehab@gmail.com")
    res = requests.post(f"{BASE_URL}/auth/signin-email", json={
        "email": "jesusfromrehab@gmail.com",
        "name": "Admin Tester"
    })
    print(f"Status: {res.status_code}")
    data = res.json()
    print("Response user:", data.get("user"))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert data["user"]["role"] == "admin", f"Expected admin, got {data['user']['role']}"
    assert "access_token" in data, "Expected access_token"
    admin_token = data["access_token"]
    print("SUCCESS: Admin signin passed with role='admin'!")

    print("\nTesting /api/auth/signin-email with regular user: john.traveler@gmail.com")
    res2 = requests.post(f"{BASE_URL}/auth/signin-email", json={
        "email": "john.traveler@gmail.com",
        "name": "John Traveler"
    })
    data2 = res2.json()
    print(f"Status: {res2.status_code}")
    print("Response user:", data2.get("user"))
    assert res2.status_code == 200
    assert data2["user"]["role"] == "user", f"Expected user, got {data2['user']['role']}"
    user_token = data2["access_token"]
    print("SUCCESS: Regular user signin passed with role='user'!")

    print("\nTesting /api/admin/reservations with admin token:")
    res_admin = requests.get(f"{BASE_URL}/admin/reservations", headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Status: {res_admin.status_code}")
    assert res_admin.status_code == 200
    print(f"Admin access granted! Total reservations: {len(res_admin.json())}")

    print("\nTesting /api/admin/reservations with regular user token (should be 403 Forbidden):")
    res_user = requests.get(f"{BASE_URL}/admin/reservations", headers={"Authorization": f"Bearer {user_token}"})
    print(f"Status: {res_user.status_code}")
    assert res_user.status_code == 403
    print("SUCCESS: Regular user properly blocked with 403 from admin endpoints!")

if __name__ == "__main__":
    test_auth()
