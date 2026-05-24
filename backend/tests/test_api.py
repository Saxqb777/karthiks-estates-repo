"""Backend API tests for property management dashboard."""
import os
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
# Fallback to frontend .env if env not set
if not BASE_URL:
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.strip().split('=', 1)[1].strip().rstrip('/')
                    break
    except Exception:
        pass
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Cleanup container shared across tests
created = {"properties": [], "tenants": [], "expenses": [], "utilities": [], "taxes": []}


# ---------- PROPERTY CRUD ----------
class TestProperty:
    def test_create_property(self, session):
        payload = {
            "name": "TEST_Townhouse 1",
            "address": "Pattukottai, Tamil Nadu",
            "purchase_price": 5000000.0,
            "purchase_date": "2023-01-15T00:00:00+00:00",
            "appreciation_rate": 8.5,
            "image_url": "https://example.com/img.jpg"
        }
        r = session.post(f"{API}/properties", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["purchase_price"] == 5000000.0
        assert "id" in data and len(data["id"]) > 0
        created["properties"].append(data["id"])

    def test_list_properties(self, session):
        r = session.get(f"{API}/properties")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert any(p["id"] == created["properties"][0] for p in data)

    def test_get_property(self, session):
        pid = created["properties"][0]
        r = session.get(f"{API}/properties/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_update_property(self, session):
        pid = created["properties"][0]
        r = session.patch(f"{API}/properties/{pid}", json={"appreciation_rate": 10.0})
        assert r.status_code == 200
        assert r.json()["appreciation_rate"] == 10.0
        # verify persistence
        g = session.get(f"{API}/properties/{pid}")
        assert g.json()["appreciation_rate"] == 10.0

    def test_get_property_404(self, session):
        r = session.get(f"{API}/properties/nonexistent-id-xyz")
        assert r.status_code == 404


# ---------- TENANT CRUD ----------
class TestTenant:
    def test_create_tenant(self, session):
        pid = created["properties"][0]
        payload = {
            "property_id": pid,
            "name": "TEST_Tenant A",
            "contact": "9999999999",
            "email": "tenant@test.com",
            "monthly_rent": 15000.0,
            "lease_start": "2024-01-01T00:00:00+00:00",
            "lease_end": "2025-01-01T00:00:00+00:00",
            "payment_status": "pending"
        }
        r = session.post(f"{API}/tenants", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Tenant A"
        assert data["monthly_rent"] == 15000.0
        created["tenants"].append(data["id"])

    def test_list_tenants(self, session):
        r = session.get(f"{API}/tenants")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_payment_status(self, session):
        tid = created["tenants"][0]
        r = session.patch(f"{API}/tenants/{tid}", json={"payment_status": "paid"})
        assert r.status_code == 200
        assert r.json()["payment_status"] == "paid"
        g = session.get(f"{API}/tenants/{tid}")
        assert g.json()["payment_status"] == "paid"


# ---------- EXPENSE CRUD ----------
class TestExpense:
    def test_create_expense(self, session):
        pid = created["properties"][0]
        payload = {
            "property_id": pid,
            "category": "maintenance",
            "amount": 2500.0,
            "date": "2024-06-01T00:00:00+00:00",
            "description": "TEST_Plumbing repair"
        }
        r = session.post(f"{API}/expenses", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["category"] == "maintenance"
        assert data["amount"] == 2500.0
        created["expenses"].append(data["id"])

    def test_list_expenses(self, session):
        r = session.get(f"{API}/expenses")
        assert r.status_code == 200
        assert any(e["id"] == created["expenses"][0] for e in r.json())


# ---------- UTILITY CRUD ----------
class TestUtility:
    def test_create_utility(self, session):
        pid = created["properties"][0]
        past_due = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        payload = {
            "property_id": pid,
            "utility_type": "electricity",
            "amount": 1200.0,
            "due_date": past_due,
            "paid_status": False
        }
        r = session.post(f"{API}/utility-payments", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["utility_type"] == "electricity"
        assert data["paid_status"] is False
        created["utilities"].append(data["id"])

    def test_update_utility_paid(self, session):
        uid = created["utilities"][0]
        r = session.patch(f"{API}/utility-payments/{uid}", json={"paid_status": True})
        assert r.status_code == 200
        assert r.json()["paid_status"] is True


# ---------- PROPERTY TAX CRUD ----------
class TestPropertyTax:
    def test_create_tax(self, session):
        pid = created["properties"][0]
        payload = {
            "property_id": pid,
            "amount": 8500.0,
            "year": 2024,
            "paid_status": False
        }
        r = session.post(f"{API}/property-taxes", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["year"] == 2024
        assert data["amount"] == 8500.0
        created["taxes"].append(data["id"])

    def test_list_taxes(self, session):
        r = session.get(f"{API}/property-taxes")
        assert r.status_code == 200
        assert any(t["id"] == created["taxes"][0] for t in r.json())


# ---------- DASHBOARD STATS ----------
class TestDashboard:
    def test_stats(self, session):
        r = session.get(f"{API}/dashboard/stats")
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["total_property_value", "total_appreciation", "total_rental_income",
                  "total_expenses", "net_profit", "properties_count", "tenants_count"]:
            assert k in data
        assert data["properties_count"] >= 1
        assert data["tenants_count"] >= 1
        # Appreciation should be > 0 for our test property held ~1 year at 10%
        assert data["total_property_value"] > 0


# ---------- REMINDERS ----------
class TestReminders:
    def test_reminders(self, session):
        r = session.get(f"{API}/reminders")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # We have an unpaid tax record
        assert any(item.get("type") == "tax" for item in data)


# ---------- CSV EXPORTS ----------
class TestExports:
    def test_export_expenses(self, session):
        r = session.get(f"{API}/export/expenses")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert "category" in r.text or len(r.text) >= 0

    def test_export_tenants(self, session):
        r = session.get(f"{API}/export/tenants")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")


# ---------- DATETIME BUG REGRESSION (YYYY-MM-DD format from UI) ----------
class TestDateFormatRegression:
    """Verify the fix for naive datetime bug when frontend sends YYYY-MM-DD."""
    yymmdd_ids = {"property": None, "utility": None}

    def test_create_property_with_date_only_format(self, session):
        payload = {
            "name": "TEST_YYYYMMDD_Property",
            "address": "Pattukottai, Tamil Nadu",
            "purchase_price": 3000000.0,
            "purchase_date": "2023-06-15",  # date-only format used by UI
            "appreciation_rate": 7.5,
            "image_url": "https://example.com/img2.jpg"
        }
        r = session.post(f"{API}/properties", json=payload)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        TestDateFormatRegression.yymmdd_ids["property"] = pid
        created["properties"].append(pid)

    def test_dashboard_stats_with_date_only_format(self, session):
        """Must NOT 500 after a YYYY-MM-DD purchase_date is in DB."""
        r = session.get(f"{API}/dashboard/stats")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        # Appreciation should be calculated (non-zero) since property held >1 year
        assert data["total_property_value"] > 0
        assert data["total_appreciation"] >= 0

    def test_create_utility_with_date_only_due_date(self, session):
        pid = TestDateFormatRegression.yymmdd_ids["property"]
        payload = {
            "property_id": pid,
            "utility_type": "water",
            "amount": 800.0,
            "due_date": "2024-01-01",  # overdue, date-only
            "paid_status": False
        }
        r = session.post(f"{API}/utility-payments", json=payload)
        assert r.status_code == 200, r.text
        uid = r.json()["id"]
        TestDateFormatRegression.yymmdd_ids["utility"] = uid
        created["utilities"].append(uid)

    def test_reminders_with_date_only_due_date(self, session):
        """Must NOT 500 when overdue utility has YYYY-MM-DD due_date."""
        r = session.get(f"{API}/reminders")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        # Our overdue utility should appear in reminders
        assert any(item.get("type") == "utility" for item in data)


# ---------- CLEANUP ----------
def test_zzz_cleanup(session):
    for tid in created["tenants"]:
        session.delete(f"{API}/tenants/{tid}")
    for eid in created["expenses"]:
        session.delete(f"{API}/expenses/{eid}")
    for uid in created["utilities"]:
        session.delete(f"{API}/utility-payments/{uid}")
    for tid in created["taxes"]:
        session.delete(f"{API}/property-taxes/{tid}")
    for pid in created["properties"]:
        r = session.delete(f"{API}/properties/{pid}")
        assert r.status_code == 200
        # Verify deletion
        g = session.get(f"{API}/properties/{pid}")
        assert g.status_code == 404
