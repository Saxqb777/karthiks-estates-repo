from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import resend
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# IST timezone for India-based property management
IST = ZoneInfo("Asia/Kolkata")

def now_ist():
    """Return current datetime in IST timezone."""
    return datetime.now(IST)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    purchase_price: float
    purchase_date: str
    appreciation_rate: float  # Annual percentage
    image_url: str
    highest_offer: float = 0.0
    highest_offer_date: Optional[str] = ""
    highest_offer_notes: Optional[str] = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PropertyCreate(BaseModel):
    name: str
    address: str
    purchase_price: float
    purchase_date: str
    appreciation_rate: float
    image_url: str
    highest_offer: float = 0.0
    highest_offer_date: Optional[str] = ""
    highest_offer_notes: Optional[str] = ""

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[str] = None
    appreciation_rate: Optional[float] = None
    image_url: Optional[str] = None
    highest_offer: Optional[float] = None
    highest_offer_date: Optional[str] = None
    highest_offer_notes: Optional[str] = None

class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    name: str
    contact: str
    monthly_rent: float
    security_deposit: float = 0.0
    rent_due_day: int = 1  # Day of month rent is due (1-31)
    lease_start: str
    lease_end: Optional[str] = ""
    # Lease close-out fields
    lease_status: str = "active"  # "active" | "ended"
    lease_end_date: Optional[str] = ""
    pending_dues_at_exit: float = 0.0
    deposit_refunded: float = 0.0
    deposit_withheld: float = 0.0
    exit_notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CloseLeaseInput(BaseModel):
    lease_end_date: str
    pending_dues_at_exit: float = 0.0
    deposit_refunded: float = 0.0
    deposit_withheld: float = 0.0
    exit_notes: str = ""

class TenantCreate(BaseModel):
    property_id: str
    name: str
    contact: str
    monthly_rent: float
    security_deposit: float = 0.0
    rent_due_day: int = 1
    lease_start: str
    lease_end: Optional[str] = ""

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    monthly_rent: Optional[float] = None
    security_deposit: Optional[float] = None
    rent_due_day: Optional[int] = None
    lease_start: Optional[str] = None
    lease_end: Optional[str] = None

class RentPayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    property_id: str
    amount: float
    payment_date: str
    month: int  # 1-12
    year: int
    notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RentPaymentCreate(BaseModel):
    tenant_id: str
    property_id: str
    amount: float
    payment_date: str
    month: int
    year: int
    notes: str = ""

class RentPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[str] = None
    month: Optional[int] = None
    year: Optional[int] = None
    notes: Optional[str] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: Optional[str] = ""  # Empty string = portfolio-wide expense
    category: str  # "maintenance", "repairs", "professional"
    amount: float
    date: str
    description: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExpenseCreate(BaseModel):
    property_id: Optional[str] = ""
    category: str
    amount: float
    date: str
    description: str

class UtilityPayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    utility_type: str  # "water", "electricity"
    amount: float
    due_date: str
    paid_status: bool
    payment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UtilityPaymentCreate(BaseModel):
    property_id: str
    utility_type: str
    amount: float
    due_date: str
    paid_status: bool = False
    payment_date: Optional[str] = None

class UtilityPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    due_date: Optional[str] = None
    paid_status: Optional[bool] = None
    payment_date: Optional[str] = None

class PropertyTax(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    amount: float
    year: int
    paid_status: bool
    payment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PropertyTaxCreate(BaseModel):
    property_id: str
    amount: float
    year: int
    paid_status: bool = False
    payment_date: Optional[str] = None

class PropertyTaxUpdate(BaseModel):
    amount: Optional[float] = None
    year: Optional[int] = None
    paid_status: Optional[bool] = None
    payment_date: Optional[str] = None

class DashboardStats(BaseModel):
    total_property_value: float
    total_appreciation: float
    total_rental_income: float
    total_expenses: float
    net_profit: float
    total_security_deposits: float
    properties_count: int
    tenants_count: int

# ============ PROPERTY ROUTES ============

@api_router.post("/properties", response_model=Property)
async def create_property(input: PropertyCreate):
    property_obj = Property(**input.model_dump())
    doc = property_obj.model_dump()
    await db.properties.insert_one(doc)
    return property_obj

@api_router.get("/properties", response_model=List[Property])
async def get_properties():
    properties = await db.properties.find({}, {"_id": 0}).to_list(1000)
    return properties

@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_doc

@api_router.get("/analytics/vacancy")
async def get_vacancy_stats():
    """Calculate vacancy days and unrealized rent loss per property since purchase."""
    properties = await db.properties.find({}, {"_id": 0}).to_list(1000)
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    today = now_ist()
    
    results = []
    for prop in properties:
        try:
            purchase_date = datetime.fromisoformat(prop['purchase_date'])
            if purchase_date.tzinfo is None:
                purchase_date = purchase_date.replace(tzinfo=IST)
        except (ValueError, KeyError):
            continue
        
        total_owned_days = max(0, (today - purchase_date).days)
        
        # Collect occupancy intervals for this property
        prop_tenants = [t for t in tenants if t.get('property_id') == prop['id']]
        intervals = []
        for t in prop_tenants:
            try:
                start = datetime.fromisoformat(t['lease_start'])
                if start.tzinfo is None:
                    start = start.replace(tzinfo=IST)
            except (ValueError, KeyError):
                continue
            
            # End: lease_end_date if ended, else today
            if t.get('lease_status') == 'ended' and t.get('lease_end_date'):
                try:
                    end = datetime.fromisoformat(t['lease_end_date'])
                    if end.tzinfo is None:
                        end = end.replace(tzinfo=IST)
                except (ValueError, KeyError):
                    end = today
            else:
                end = today
            
            # Clamp to purchase_date and today
            start = max(start, purchase_date)
            end = min(end, today)
            if end > start:
                intervals.append((start, end, t.get('monthly_rent', 0)))
        
        # Sort intervals and merge overlapping ones for occupied days
        intervals.sort(key=lambda x: x[0])
        occupied_days = 0
        last_end = purchase_date
        avg_rent_sum = 0
        avg_rent_count = 0
        for start, end, rent in intervals:
            effective_start = max(start, last_end)
            if end > effective_start:
                occupied_days += (end - effective_start).days
                last_end = end
                avg_rent_sum += rent
                avg_rent_count += 1
        
        vacant_days = max(0, total_owned_days - occupied_days)
        avg_monthly_rent = (avg_rent_sum / avg_rent_count) if avg_rent_count > 0 else 0
        daily_rent = avg_monthly_rent / 30.0 if avg_monthly_rent > 0 else 0
        unrealized_loss = vacant_days * daily_rent
        
        # Currently occupied?
        is_currently_occupied = any(
            t.get('lease_status') != 'ended' and
            datetime.fromisoformat(t['lease_start']).replace(tzinfo=IST if datetime.fromisoformat(t['lease_start']).tzinfo is None else None) <= today
            for t in prop_tenants if t.get('lease_start')
        )
        
        results.append({
            "property_id": prop['id'],
            "property_name": prop['name'],
            "purchase_date": prop['purchase_date'],
            "total_owned_days": total_owned_days,
            "occupied_days": occupied_days,
            "vacant_days": vacant_days,
            "occupancy_rate": round((occupied_days / total_owned_days * 100), 1) if total_owned_days > 0 else 0,
            "avg_monthly_rent": avg_monthly_rent,
            "unrealized_loss": round(unrealized_loss, 2),
            "is_currently_occupied": is_currently_occupied
        })
    
    return results

@api_router.get("/analytics/monthly-flow")
async def get_monthly_flow(months: int = 12):
    """Return monthly rent collected and expenses for the last N months."""
    today = now_ist()
    result = []
    
    rent_payments = await db.rent_payments.find({}, {"_id": 0}).to_list(10000)
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    utility_payments = await db.utility_payments.find({}, {"_id": 0}).to_list(10000)
    property_taxes = await db.property_taxes.find({}, {"_id": 0}).to_list(10000)
    
    # Build last N months
    cursor_year = today.year
    cursor_month = today.month
    month_list = []
    for _ in range(months):
        month_list.append((cursor_month, cursor_year))
        cursor_month -= 1
        if cursor_month < 1:
            cursor_month = 12
            cursor_year -= 1
    month_list.reverse()
    
    for (m, y) in month_list:
        rent_total = sum(p.get('amount', 0) for p in rent_payments if p.get('month') == m and p.get('year') == y)
        
        exp_total = 0
        for e in expenses:
            try:
                dt = datetime.fromisoformat(e.get('date', ''))
                if dt.month == m and dt.year == y:
                    exp_total += e.get('amount', 0)
            except (ValueError, AttributeError):
                pass
        
        # Paid utilities by payment_date
        for u in utility_payments:
            if not u.get('paid_status') or not u.get('payment_date'):
                continue
            try:
                dt = datetime.fromisoformat(u['payment_date'])
                if dt.month == m and dt.year == y:
                    exp_total += u.get('amount', 0)
            except (ValueError, AttributeError):
                pass
        
        # Paid taxes by payment_date
        for t in property_taxes:
            if not t.get('paid_status') or not t.get('payment_date'):
                continue
            try:
                dt = datetime.fromisoformat(t['payment_date'])
                if dt.month == m and dt.year == y:
                    exp_total += t.get('amount', 0)
            except (ValueError, AttributeError):
                pass
        
        result.append({
            "month": m,
            "year": y,
            "label": f"{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} {str(y)[2:]}",
            "rent_collected": round(rent_total, 2),
            "expenses": round(exp_total, 2),
            "net": round(rent_total - exp_total, 2)
        })
    
    return result

@api_router.get("/analytics/expense-breakdown")
async def get_expense_breakdown():
    """Return expense totals grouped by category."""
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    utility_payments = await db.utility_payments.find({}, {"_id": 0}).to_list(10000)
    property_taxes = await db.property_taxes.find({}, {"_id": 0}).to_list(10000)
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    
    breakdown = {}
    for e in expenses:
        cat = e.get('category', 'other').capitalize()
        breakdown[cat] = breakdown.get(cat, 0) + e.get('amount', 0)
    
    paid_utilities = sum(u.get('amount', 0) for u in utility_payments if u.get('paid_status'))
    if paid_utilities > 0:
        breakdown['Utilities'] = paid_utilities
    
    paid_taxes = sum(t.get('amount', 0) for t in property_taxes if t.get('paid_status'))
    if paid_taxes > 0:
        breakdown['Property Tax'] = paid_taxes
    
    unrecovered_dues = sum(
        max(0, (t.get('pending_dues_at_exit', 0) or 0) - (t.get('deposit_withheld', 0) or 0))
        for t in tenants if t.get('lease_status') == 'ended'
    )
    if unrecovered_dues > 0:
        breakdown['Unrecovered Dues'] = unrecovered_dues
    
    return [{"category": k, "amount": round(v, 2)} for k, v in breakdown.items() if v > 0]

@api_router.get("/analytics/property-projections")
async def get_property_projections(years: int = 5):
    """Project property value growth for N years using each property's appreciation rate."""
    properties = await db.properties.find({}, {"_id": 0}).to_list(1000)
    today = now_ist()
    
    result = []
    for year_offset in range(years + 1):
        point = {"year": today.year + year_offset, "label": f"Year {year_offset}" if year_offset > 0 else "Now"}
        for prop in properties:
            try:
                purchase_date = datetime.fromisoformat(prop['purchase_date'])
                if purchase_date.tzinfo is None:
                    purchase_date = purchase_date.replace(tzinfo=IST)
            except (ValueError, KeyError):
                continue
            
            target_date = today.replace(year=today.year + year_offset)
            years_held = (target_date - purchase_date).days / 365.25
            rate = prop.get('appreciation_rate', 0) / 100
            value = prop['purchase_price'] * ((1 + rate) ** max(0, years_held))
            point[prop['name']] = round(value, 0)
        result.append(point)
    
    return result

@api_router.patch("/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, input: PropertyUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.properties.update_one(
        {"id": property_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    updated_property = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return updated_property

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str):
    result = await db.properties.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted successfully"}

# ============ TENANT ROUTES ============

@api_router.post("/tenants", response_model=Tenant)
async def create_tenant(input: TenantCreate):
    tenant_obj = Tenant(**input.model_dump())
    doc = tenant_obj.model_dump()
    await db.tenants.insert_one(doc)
    return tenant_obj

@api_router.get("/tenants", response_model=List[Tenant])
async def get_tenants(property_id: Optional[str] = None):
    query = {"property_id": property_id} if property_id else {}
    tenants = await db.tenants.find(query, {"_id": 0}).to_list(1000)
    return tenants

@api_router.get("/tenants/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str):
    tenant_doc = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant_doc:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant_doc

@api_router.patch("/tenants/{tenant_id}", response_model=Tenant)
async def update_tenant(tenant_id: str, input: TenantUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    updated_tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    return updated_tenant

@api_router.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str):
    result = await db.tenants.delete_one({"id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"message": "Tenant deleted successfully"}

@api_router.get("/tenants/{tenant_id}/pending-dues-estimate")
async def estimate_pending_dues(tenant_id: str):
    """Auto-calculate pending dues by comparing total expected rent vs total received.
    Handles partial payments correctly (e.g., ₹2,000 paid when ₹4,000 was due).
    """
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    monthly_rent = tenant.get('monthly_rent', 0)
    
    try:
        lease_start = datetime.fromisoformat(tenant['lease_start'])
        if lease_start.tzinfo is None:
            lease_start = lease_start.replace(tzinfo=IST)
    except (ValueError, KeyError):
        return {
            "expected_months": 0,
            "total_expected": 0.0,
            "total_received": 0.0,
            "estimated_amount": 0.0,
            "monthly_rent": monthly_rent,
            "month_breakdown": []
        }
    
    today = now_ist()
    
    # Build list of months from lease_start to today (inclusive)
    expected_months = []
    cursor = datetime(lease_start.year, lease_start.month, 1, tzinfo=IST)
    end = datetime(today.year, today.month, 1, tzinfo=IST)
    while cursor <= end:
        expected_months.append((cursor.month, cursor.year))
        if cursor.month == 12:
            cursor = cursor.replace(year=cursor.year + 1, month=1)
        else:
            cursor = cursor.replace(month=cursor.month + 1)
    
    # Get all payments for this tenant
    payments = await db.rent_payments.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(10000)
    
    # Sum payments by (month, year)
    received_by_month = {}
    for p in payments:
        key = (p['month'], p['year'])
        received_by_month[key] = received_by_month.get(key, 0) + (p.get('amount', 0) or 0)
    
    # Per-month breakdown showing expected vs received vs balance
    month_breakdown = []
    for (m, y) in expected_months:
        received = received_by_month.get((m, y), 0)
        balance = monthly_rent - received
        month_breakdown.append({
            "month": m,
            "year": y,
            "expected": monthly_rent,
            "received": received,
            "balance": balance
        })
    
    total_expected = monthly_rent * len(expected_months)
    total_received = sum(received_by_month.values())
    pending = max(0, total_expected - total_received)
    
    return {
        "expected_months": len(expected_months),
        "total_expected": total_expected,
        "total_received": total_received,
        "estimated_amount": pending,
        "monthly_rent": monthly_rent,
        "month_breakdown": month_breakdown
    }

@api_router.post("/tenants/{tenant_id}/close-lease", response_model=Tenant)
async def close_lease(tenant_id: str, input: CloseLeaseInput):
    """Close out a tenant's lease - marks as ended without deleting records."""
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    update_data = {
        "lease_status": "ended",
        "lease_end_date": input.lease_end_date,
        "pending_dues_at_exit": input.pending_dues_at_exit,
        "deposit_refunded": input.deposit_refunded,
        "deposit_withheld": input.deposit_withheld,
        "exit_notes": input.exit_notes,
    }
    
    await db.tenants.update_one({"id": tenant_id}, {"$set": update_data})
    updated = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    return updated

@api_router.post("/tenants/{tenant_id}/reopen-lease", response_model=Tenant)
async def reopen_lease(tenant_id: str):
    """Reopen a closed lease (in case it was closed by mistake)."""
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"lease_status": "active"},
         "$unset": {"lease_end_date": "", "pending_dues_at_exit": "", "deposit_refunded": "", "deposit_withheld": "", "exit_notes": ""}}
    )
    updated = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    return updated




# ============ RENT PAYMENT ROUTES ============

@api_router.post("/rent-payments", response_model=RentPayment)
async def create_rent_payment(input: RentPaymentCreate):
    payment_obj = RentPayment(**input.model_dump())
    doc = payment_obj.model_dump()
    await db.rent_payments.insert_one(doc)
    return payment_obj

@api_router.get("/rent-payments", response_model=List[RentPayment])
async def get_rent_payments(tenant_id: Optional[str] = None, property_id: Optional[str] = None):
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if property_id:
        query["property_id"] = property_id
    payments = await db.rent_payments.find(query, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    return payments

@api_router.patch("/rent-payments/{payment_id}", response_model=RentPayment)
async def update_rent_payment(payment_id: str, input: RentPaymentUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.rent_payments.update_one(
        {"id": payment_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rent payment not found")
    
    updated_payment = await db.rent_payments.find_one({"id": payment_id}, {"_id": 0})
    return updated_payment

@api_router.delete("/rent-payments/{payment_id}")
async def delete_rent_payment(payment_id: str):
    result = await db.rent_payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rent payment not found")
    return {"message": "Rent payment deleted successfully"}


# ============ EXPENSE ROUTES ============

@api_router.post("/expenses", response_model=Expense)
async def create_expense(input: ExpenseCreate):
    expense_obj = Expense(**input.model_dump())
    doc = expense_obj.model_dump()
    await db.expenses.insert_one(doc)
    return expense_obj

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(property_id: Optional[str] = None):
    query = {"property_id": property_id} if property_id else {}
    expenses = await db.expenses.find(query, {"_id": 0}).to_list(1000)
    return expenses

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# ============ UTILITY PAYMENT ROUTES ============

@api_router.post("/utility-payments", response_model=UtilityPayment)
async def create_utility_payment(input: UtilityPaymentCreate):
    payment_obj = UtilityPayment(**input.model_dump())
    doc = payment_obj.model_dump()
    await db.utility_payments.insert_one(doc)
    return payment_obj

@api_router.get("/utility-payments", response_model=List[UtilityPayment])
async def get_utility_payments(property_id: Optional[str] = None):
    query = {"property_id": property_id} if property_id else {}
    payments = await db.utility_payments.find(query, {"_id": 0}).to_list(1000)
    return payments

@api_router.patch("/utility-payments/{payment_id}", response_model=UtilityPayment)
async def update_utility_payment(payment_id: str, input: UtilityPaymentUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.utility_payments.update_one(
        {"id": payment_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    updated_payment = await db.utility_payments.find_one({"id": payment_id}, {"_id": 0})
    return updated_payment

@api_router.delete("/utility-payments/{payment_id}")
async def delete_utility_payment(payment_id: str):
    result = await db.utility_payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully"}

# ============ PROPERTY TAX ROUTES ============

@api_router.post("/property-taxes", response_model=PropertyTax)
async def create_property_tax(input: PropertyTaxCreate):
    tax_obj = PropertyTax(**input.model_dump())
    doc = tax_obj.model_dump()
    await db.property_taxes.insert_one(doc)
    return tax_obj

@api_router.get("/property-taxes", response_model=List[PropertyTax])
async def get_property_taxes(property_id: Optional[str] = None):
    query = {"property_id": property_id} if property_id else {}
    taxes = await db.property_taxes.find(query, {"_id": 0}).to_list(1000)
    return taxes

@api_router.patch("/property-taxes/{tax_id}", response_model=PropertyTax)
async def update_property_tax(tax_id: str, input: PropertyTaxUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.property_taxes.update_one(
        {"id": tax_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tax record not found")
    
    updated_tax = await db.property_taxes.find_one({"id": tax_id}, {"_id": 0})
    return updated_tax

@api_router.delete("/property-taxes/{tax_id}")
async def delete_property_tax(tax_id: str):
    result = await db.property_taxes.delete_one({"id": tax_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tax record not found")
    return {"message": "Tax record deleted successfully"}

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    properties = await db.properties.find({}, {"_id": 0}).to_list(1000)
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    rent_payments = await db.rent_payments.find({}, {"_id": 0}).to_list(10000)
    utility_payments = await db.utility_payments.find({}, {"_id": 0}).to_list(1000)
    property_taxes = await db.property_taxes.find({}, {"_id": 0}).to_list(1000)
    
    total_purchase_price = sum(p.get('purchase_price', 0) for p in properties)
    
    # Calculate appreciation for each property (using IST)
    total_current_value = 0
    for prop in properties:
        purchase_date = datetime.fromisoformat(prop['purchase_date'])
        if purchase_date.tzinfo is None:
            purchase_date = purchase_date.replace(tzinfo=IST)
        years_held = (now_ist() - purchase_date).days / 365.25
        appreciation_rate = prop.get('appreciation_rate', 0) / 100
        current_value = prop['purchase_price'] * ((1 + appreciation_rate) ** years_held)
        total_current_value += current_value
    
    total_appreciation = total_current_value - total_purchase_price
    # Actual collected rent (sum of all recorded rent payments)
    total_rental_income = sum(rp.get('amount', 0) for rp in rent_payments)
    
    # Pending dues from closed leases NET of deposit withheld (only unrecovered amount = real loss)
    pending_dues_from_closed = sum(
        max(0, (t.get('pending_dues_at_exit', 0) or 0) - (t.get('deposit_withheld', 0) or 0))
        for t in tenants if t.get('lease_status') == 'ended'
    )
    
    # All actual money spent
    direct_expenses = sum(e.get('amount', 0) for e in expenses)
    paid_utilities = sum(u.get('amount', 0) for u in utility_payments if u.get('paid_status'))
    paid_taxes = sum(t.get('amount', 0) for t in property_taxes if t.get('paid_status'))
    total_expenses_amount = direct_expenses + paid_utilities + paid_taxes + pending_dues_from_closed
    
    # Active security deposits only (closed tenants' deposits are settled, not held)
    total_security_deposits = sum(
        t.get('security_deposit', 0) for t in tenants if t.get('lease_status') != 'ended'
    )
    
    net_profit = total_rental_income - total_expenses_amount
    
    return DashboardStats(
        total_property_value=total_current_value,
        total_appreciation=total_appreciation,
        total_rental_income=total_rental_income,
        total_expenses=total_expenses_amount,
        net_profit=net_profit,
        total_security_deposits=total_security_deposits,
        properties_count=len(properties),
        tenants_count=sum(1 for t in tenants if t.get('lease_status') != 'ended')
    )

# ============ PAYMENT REMINDERS ============

@api_router.get("/reminders")
async def get_payment_reminders():
    reminders = []
    today = now_ist()
    current_month = today.month
    current_year = today.year
    
    # Check overdue rent: for each tenant, if today is past rent_due_day and no payment for current month exists
    tenants = await db.tenants.find({"lease_status": {"$ne": "ended"}}, {"_id": 0}).to_list(1000)
    for tenant in tenants:
        rent_due_day = tenant.get('rent_due_day', 1)
        if today.day < rent_due_day:
            continue  # Not yet due this month
        
        # Check if payment exists for this tenant for current month/year
        existing_payment = await db.rent_payments.find_one({
            "tenant_id": tenant['id'],
            "month": current_month,
            "year": current_year
        }, {"_id": 0})
        
        if not existing_payment:
            reminders.append({
                "type": "rent",
                "priority": "high",
                "message": f"Rent unpaid for {tenant['name']} ({current_month}/{current_year}) - ₹{tenant['monthly_rent']} (due on day {rent_due_day})",
                "tenant_id": tenant['id'],
                "property_id": tenant['property_id']
            })
    
    # Check unpaid utilities
    utilities = await db.utility_payments.find({"paid_status": False}, {"_id": 0}).to_list(1000)
    for utility in utilities:
        due_date = datetime.fromisoformat(utility['due_date'])
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=IST)
        if due_date < today:
            reminders.append({
                "type": "utility",
                "priority": "medium",
                "message": f"Overdue {utility['utility_type']} bill - ₹{utility['amount']}",
                "utility_id": utility['id'],
                "property_id": utility['property_id']
            })
    
    # Check unpaid property taxes
    taxes = await db.property_taxes.find({"paid_status": False}, {"_id": 0}).to_list(1000)
    for tax in taxes:
        reminders.append({
            "type": "tax",
            "priority": "high",
            "message": f"Property tax {tax['year']} unpaid - ₹{tax['amount']}",
            "tax_id": tax['id'],
            "property_id": tax['property_id']
        })
    
    return reminders

# ============ EMAIL NOTIFICATIONS ============

def build_reminder_email_html(reminders: list) -> str:
    """Build an HTML email body summarizing payment reminders."""
    if not reminders:
        return """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2C4C3B;">Property Dashboard - All Clear!</h2>
            <p style="color: #2E2E2E;">Great news - no pending payments or overdue items at this time.</p>
            <p style="color: #7D7D7D; font-size: 12px; margin-top: 30px;">Pattukottai Property Dashboard</p>
        </div>
        """

    rows_html = ""
    for r in reminders:
        priority_color = "#D96C4E" if r.get("priority") == "high" else "#7D7D7D"
        rows_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #E6E2D8;">
                <span style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: {priority_color}; letter-spacing: 2px;">{r.get('type', '').upper()}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #E6E2D8; color: #2E2E2E;">{r.get('message', '')}</td>
        </tr>
        """

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F7F5F0;">
        <div style="background-color: #FFFFFF; padding: 24px; border: 1px solid #E6E2D8; border-radius: 8px;">
            <h2 style="color: #2C4C3B; margin: 0 0 8px 0;">Property Payment Reminders</h2>
            <p style="color: #7D7D7D; margin: 0 0 20px 0;">Pattukottai, Tamil Nadu &middot; {len(reminders)} pending item(s)</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #F7F5F0;">
                        <th style="text-align: left; padding: 12px; color: #7D7D7D; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Type</th>
                        <th style="text-align: left; padding: 12px; color: #7D7D7D; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html}
                </tbody>
            </table>
            <p style="color: #7D7D7D; font-size: 12px; margin-top: 24px;">Sent from your Property Dashboard</p>
        </div>
    </div>
    """


@api_router.post("/send-reminders-email")
async def send_reminders_email():
    """Send a manual email with all current payment reminders."""
    if not resend.api_key:
        raise HTTPException(status_code=500, detail="Resend API key not configured")
    if not NOTIFICATION_EMAIL:
        raise HTTPException(status_code=500, detail="Notification email not configured")

    # Reuse the same logic as /reminders
    reminders = []
    today = now_ist()
    current_month = today.month
    current_year = today.year

    tenants = await db.tenants.find({"lease_status": {"$ne": "ended"}}, {"_id": 0}).to_list(1000)
    for tenant in tenants:
        rent_due_day = tenant.get('rent_due_day', 1)
        if today.day < rent_due_day:
            continue
        existing_payment = await db.rent_payments.find_one({
            "tenant_id": tenant['id'],
            "month": current_month,
            "year": current_year
        }, {"_id": 0})
        if not existing_payment:
            reminders.append({
                "type": "rent",
                "priority": "high",
                "message": f"Rent unpaid for {tenant['name']} ({current_month}/{current_year}) - ₹{tenant['monthly_rent']}",
            })

    utilities = await db.utility_payments.find({"paid_status": False}, {"_id": 0}).to_list(1000)
    for utility in utilities:
        due_date = datetime.fromisoformat(utility['due_date'])
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=IST)
        if due_date < today:
            reminders.append({
                "type": "utility",
                "priority": "medium",
                "message": f"Overdue {utility['utility_type']} bill - ₹{utility['amount']}",
            })

    taxes = await db.property_taxes.find({"paid_status": False}, {"_id": 0}).to_list(1000)
    for tax in taxes:
        reminders.append({
            "type": "tax",
            "priority": "high",
            "message": f"Property tax {tax['year']} unpaid - ₹{tax['amount']}",
        })

    html_content = build_reminder_email_html(reminders)
    subject = f"Property Reminders - {len(reminders)} pending item(s)" if reminders else "Property Reminders - All Clear"

    params = {
        "from": SENDER_EMAIL,
        "to": [NOTIFICATION_EMAIL],
        "subject": subject,
        "html": html_content,
    }

    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "status": "success",
            "message": f"Email sent to {NOTIFICATION_EMAIL}",
            "email_id": email.get("id"),
            "reminders_count": len(reminders),
        }
    except Exception as e:
        logger.error(f"Failed to send reminder email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")



# ============ CSV EXPORT ============

@api_router.get("/export/expenses")
async def export_expenses():
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    if expenses:
        writer = csv.DictWriter(output, fieldnames=expenses[0].keys())
        writer.writeheader()
        writer.writerows(expenses)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )

@api_router.get("/export/tenants")
async def export_tenants():
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    if tenants:
        writer = csv.DictWriter(output, fieldnames=tenants[0].keys())
        writer.writeheader()
        writer.writerows(tenants)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tenants.csv"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()