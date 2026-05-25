import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  House, TrendUp, CurrencyInr, ChartLine, Plus, Users, Receipt, Drop, Lightning,
  FileText, Buildings, ChartBar
} from '@phosphor-icons/react';
import StatsCard from '../components/StatsCard';
import PropertyCard from '../components/PropertyCard';
import TenantList from '../components/TenantList';
import ExpenseList from '../components/ExpenseList';
import UtilityPaymentsList from '../components/UtilityPaymentsList';
import PropertyTaxList from '../components/PropertyTaxList';
import PaymentReminders from '../components/PaymentReminders';
import AddPropertyDialog from '../components/AddPropertyDialog';
import AddTenantDialog from '../components/AddTenantDialog';
import AddExpenseDialog from '../components/AddExpenseDialog';
import AddUtilityDialog from '../components/AddUtilityDialog';
import AddTaxDialog from '../components/AddTaxDialog';
import RecordRentPaymentDialog from '../components/RecordRentPaymentDialog';
import PaymentHistoryDialog from '../components/PaymentHistoryDialog';
import CloseLeaseDialog from '../components/CloseLeaseDialog';
import {
  MonthlyFlowChart, CashFlowChart, ExpenseBreakdownChart, VacancyCard
} from '../components/AnalyticsCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [rentPayments, setRentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddUtility, setShowAddUtility] = useState(false);
  const [showAddTax, setShowAddTax] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showCloseLease, setShowCloseLease] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [paymentTenant, setPaymentTenant] = useState(null);
  const [closeLeaseTenant, setCloseLeaseTenant] = useState(null);

  const handleEditProperty = (p) => { setEditingProperty(p); setShowAddProperty(true); };
  const handleClosePropertyDialog = (o) => { setShowAddProperty(o); if (!o) setEditingProperty(null); };
  const handleEditTenant = (t) => { setEditingTenant(t); setShowAddTenant(true); };
  const handleCloseTenantDialog = (o) => { setShowAddTenant(o); if (!o) setEditingTenant(null); };
  const handleRecordPayment = (t) => { setPaymentTenant(t); setShowRecordPayment(true); };
  const handleViewHistory = (t) => { setPaymentTenant(t); setShowPaymentHistory(true); };
  const handleCloseLease = (t) => { setCloseLeaseTenant(t); setShowCloseLease(true); };

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/properties`),
        axios.get(`${API}/tenants`),
        axios.get(`${API}/expenses`),
        axios.get(`${API}/utility-payments`),
        axios.get(`${API}/property-taxes`),
        axios.get(`${API}/reminders`),
        axios.get(`${API}/rent-payments`)
      ]);

      const [s, p, t, e, u, tx, r, rp] = results;
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (p.status === 'fulfilled') setProperties(p.value.data);
      if (t.status === 'fulfilled') setTenants(t.value.data);
      if (e.status === 'fulfilled') setExpenses(e.value.data);
      if (u.status === 'fulfilled') setUtilities(u.value.data);
      if (tx.status === 'fulfilled') setTaxes(tx.value.data);
      if (r.status === 'fulfilled') setReminders(r.value.data);
      if (rp.status === 'fulfilled') setRentPayments(rp.value.data);

      const failed = results.filter(x => x.status === 'rejected').length;
      if (failed > 0) toast.error(`Failed to load ${failed} section(s)`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="text-center">
          <div className="inline-block w-1 h-8 bg-[#B89D5F] animate-pulse"></div>
          <p className="mt-4 text-sm uppercase tracking-[0.22em] font-semibold text-[#64748B]">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E2DA]">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="serif-display text-2xl text-[#0F172A]" data-testid="dashboard-title">
                Pattukottai Estates
              </h1>
              <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[#64748B] mt-0.5">
                Property Portfolio · Tamil Nadu
              </p>
            </div>
            <div className="hidden md:flex items-center gap-6 text-xs">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#64748B]">Properties Owned</p>
                <p className="text-base font-semibold text-[#0F172A] tabular-nums">{stats?.properties_count || 0}</p>
              </div>
              <div className="w-px h-8 bg-[#E5E2DA]"></div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#64748B]">Active Tenants</p>
                <p className="text-base font-semibold text-[#0F172A] tabular-nums">{stats?.tenants_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Headline KPIs */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#B89D5F]">01</span>
            <h2 className="text-sm uppercase tracking-[0.18em] font-bold text-[#0F172A]">Business Performance</h2>
            <div className="flex-1 h-px bg-[#E5E2DA]"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              icon={<House size={18} />}
              label="Total Property Value"
              value={`₹${(stats?.total_property_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              testId="stat-property-value"
            />
            <StatsCard
              icon={<TrendUp size={18} />}
              label="Capital Appreciation"
              value={`₹${(stats?.total_appreciation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              color="#047857"
              accent
              testId="stat-appreciation"
            />
            <StatsCard
              icon={<CurrencyInr size={18} />}
              label="Rent Collected"
              value={`₹${(stats?.total_rental_income || 0).toLocaleString('en-IN')}`}
              testId="stat-rental-income"
            />
            <StatsCard
              icon={<Receipt size={18} />}
              label="Total Expenses"
              value={`₹${(stats?.total_expenses || 0).toLocaleString('en-IN')}`}
              color="#B91C1C"
              accent
              testId="stat-expenses"
            />
            <StatsCard
              icon={<ChartLine size={18} />}
              label="Net Profit"
              value={`₹${(stats?.net_profit || 0).toLocaleString('en-IN')}`}
              color={(stats?.net_profit || 0) >= 0 ? '#047857' : '#B91C1C'}
              accent
              testId="stat-net-profit"
            />
            <StatsCard
              icon={<Users size={18} />}
              label="Security Deposits"
              value={`₹${(stats?.total_security_deposits || 0).toLocaleString('en-IN')}`}
              testId="stat-security-deposits"
            />
          </div>
        </section>

        {/* Reminders */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#B89D5F]">02</span>
            <h2 className="text-sm uppercase tracking-[0.18em] font-bold text-[#0F172A]">Action Items</h2>
            <div className="flex-1 h-px bg-[#E5E2DA]"></div>
          </div>
          <PaymentReminders reminders={reminders} onRefresh={fetchAllData} />
        </section>

        {/* Analytics */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#B89D5F]">03</span>
            <h2 className="text-sm uppercase tracking-[0.18em] font-bold text-[#0F172A]">Analytics & Growth</h2>
            <div className="flex-1 h-px bg-[#E5E2DA]"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <MonthlyFlowChart />
            <CashFlowChart />
          </div>
          <div className="mb-4">
            <ExpenseBreakdownChart />
          </div>
          <VacancyCard />
        </section>

        {/* Properties */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#B89D5F]">04</span>
            <h2 className="text-sm uppercase tracking-[0.18em] font-bold text-[#0F172A]">Properties</h2>
            <div className="flex-1 h-px bg-[#E5E2DA]"></div>
            <Button
              onClick={() => setShowAddProperty(true)}
              size="sm"
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs"
              data-testid="add-property-btn"
            >
              <Plus size={14} className="mr-1" />
              Add Property
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onRefresh={fetchAllData}
                onEdit={handleEditProperty}
              />
            ))}
          </div>
        </section>

        {/* Operations */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#B89D5F]">05</span>
            <h2 className="text-sm uppercase tracking-[0.18em] font-bold text-[#0F172A]">Operations</h2>
            <div className="flex-1 h-px bg-[#E5E2DA]"></div>
          </div>
          <Tabs defaultValue="tenants" className="w-full">
            <TabsList className="bg-white border border-[#E5E2DA] mb-4">
              <TabsTrigger value="tenants" data-testid="tab-tenants"><Users size={16} className="mr-1.5" />Tenants</TabsTrigger>
              <TabsTrigger value="expenses" data-testid="tab-expenses"><Receipt size={16} className="mr-1.5" />Expenses</TabsTrigger>
              <TabsTrigger value="utilities" data-testid="tab-utilities"><Lightning size={16} className="mr-1.5" />Utilities</TabsTrigger>
              <TabsTrigger value="taxes" data-testid="tab-taxes"><FileText size={16} className="mr-1.5" />Property Tax</TabsTrigger>
            </TabsList>

            <TabsContent value="tenants">
              <div className="bg-white border border-[#E5E2DA] rounded-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-[#0F172A]">Tenant Management</h3>
                  <Button onClick={() => setShowAddTenant(true)} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs" data-testid="add-tenant-btn">
                    <Plus size={14} className="mr-1" />Add Tenant
                  </Button>
                </div>
                <TenantList
                  tenants={tenants}
                  properties={properties}
                  rentPayments={rentPayments}
                  onRefresh={fetchAllData}
                  onEdit={handleEditTenant}
                  onRecordPayment={handleRecordPayment}
                  onViewHistory={handleViewHistory}
                  onCloseLease={handleCloseLease}
                />
              </div>
            </TabsContent>

            <TabsContent value="expenses">
              <div className="bg-white border border-[#E5E2DA] rounded-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-[#0F172A]">Expenses</h3>
                  <Button onClick={() => setShowAddExpense(true)} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs" data-testid="add-expense-btn">
                    <Plus size={14} className="mr-1" />Add Expense
                  </Button>
                </div>
                <ExpenseList expenses={expenses} properties={properties} onRefresh={fetchAllData} />
              </div>
            </TabsContent>

            <TabsContent value="utilities">
              <div className="bg-white border border-[#E5E2DA] rounded-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-[#0F172A]">Utility Payments</h3>
                  <Button onClick={() => setShowAddUtility(true)} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs" data-testid="add-utility-btn">
                    <Plus size={14} className="mr-1" />Add Payment
                  </Button>
                </div>
                <UtilityPaymentsList utilities={utilities} properties={properties} onRefresh={fetchAllData} />
              </div>
            </TabsContent>

            <TabsContent value="taxes">
              <div className="bg-white border border-[#E5E2DA] rounded-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-[#0F172A]">Property Tax</h3>
                  <Button onClick={() => setShowAddTax(true)} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs" data-testid="add-tax-btn">
                    <Plus size={14} className="mr-1" />Add Tax Record
                  </Button>
                </div>
                <PropertyTaxList taxes={taxes} properties={properties} onRefresh={fetchAllData} />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Dialogs */}
      <AddPropertyDialog open={showAddProperty} onOpenChange={handleClosePropertyDialog} onSuccess={fetchAllData} editProperty={editingProperty} />
      <AddTenantDialog open={showAddTenant} onOpenChange={handleCloseTenantDialog} properties={properties} onSuccess={fetchAllData} editTenant={editingTenant} />
      <AddExpenseDialog open={showAddExpense} onOpenChange={setShowAddExpense} properties={properties} onSuccess={fetchAllData} />
      <AddUtilityDialog open={showAddUtility} onOpenChange={setShowAddUtility} properties={properties} onSuccess={fetchAllData} />
      <AddTaxDialog open={showAddTax} onOpenChange={setShowAddTax} properties={properties} onSuccess={fetchAllData} />
      <RecordRentPaymentDialog open={showRecordPayment} onOpenChange={setShowRecordPayment} tenant={paymentTenant} onSuccess={fetchAllData} />
      <PaymentHistoryDialog open={showPaymentHistory} onOpenChange={setShowPaymentHistory} tenant={paymentTenant} onUpdated={fetchAllData} />
      <CloseLeaseDialog open={showCloseLease} onOpenChange={(o) => { setShowCloseLease(o); if (!o) setCloseLeaseTenant(null); }} tenant={closeLeaseTenant} onSuccess={fetchAllData} />
    </div>
  );
}
