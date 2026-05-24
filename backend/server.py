from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PropertyCreate(BaseModel):
    name: str
    address: str
    purchase_price: float
    purchase_date: str
    appreciation_rate: float
    image_url: str

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[str] = None
    appreciation_rate: Optional[float] = None
    image_url: Optional[str] = None

class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    name: str
    contact: str
    email: str
    monthly_rent: float
    lease_start: str
    lease_end: str
    payment_status: str  # "paid", "pending", "overdue"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TenantCreate(BaseModel):
    property_id: str
    name: str
    contact: str
    email: str
    monthly_rent: float
    lease_start: str
    lease_end: str
    payment_status: str = "pending"

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    monthly_rent: Optional[float] = None
    lease_start: Optional[str] = None
    lease_end: Optional[str] = None
    payment_status: Optional[str] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    category: str  # "maintenance", "repairs", "insurance", "other"
    amount: float
    date: str
    description: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExpenseCreate(BaseModel):
    property_id: str
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
    
    total_purchase_price = sum(p.get('purchase_price', 0) for p in properties)
    
    # Calculate appreciation for each property
    total_current_value = 0
    for prop in properties:
        purchase_date = datetime.fromisoformat(prop['purchase_date'])
        if purchase_date.tzinfo is None:
            purchase_date = purchase_date.replace(tzinfo=timezone.utc)
        years_held = (datetime.now(timezone.utc) - purchase_date).days / 365.25
        appreciation_rate = prop.get('appreciation_rate', 0) / 100
        current_value = prop['purchase_price'] * ((1 + appreciation_rate) ** years_held)
        total_current_value += current_value
    
    total_appreciation = total_current_value - total_purchase_price
    total_rental_income = sum(t.get('monthly_rent', 0) for t in tenants) * 12  # Annual
    total_expenses_amount = sum(e.get('amount', 0) for e in expenses)
    
    net_profit = total_rental_income - total_expenses_amount
    
    return DashboardStats(
        total_property_value=total_current_value,
        total_appreciation=total_appreciation,
        total_rental_income=total_rental_income,
        total_expenses=total_expenses_amount,
        net_profit=net_profit,
        properties_count=len(properties),
        tenants_count=len(tenants)
    )

# ============ PAYMENT REMINDERS ============

@api_router.get("/reminders")
async def get_payment_reminders():
    reminders = []
    
    # Check overdue rent
    tenants = await db.tenants.find({"payment_status": "pending"}, {"_id": 0}).to_list(1000)
    for tenant in tenants:
        reminders.append({
            "type": "rent",
            "priority": "high",
            "message": f"Rent pending from {tenant['name']} - ₹{tenant['monthly_rent']}",
            "tenant_id": tenant['id'],
            "property_id": tenant['property_id']
        })
    
    # Check unpaid utilities
    utilities = await db.utility_payments.find({"paid_status": False}, {"_id": 0}).to_list(1000)
    today = datetime.now(timezone.utc)
    for utility in utilities:
        due_date = datetime.fromisoformat(utility['due_date'])
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)
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