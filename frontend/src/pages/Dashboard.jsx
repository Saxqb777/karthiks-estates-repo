import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  House,
  TrendUp,
  CurrencyInr,
  ChartLine,
  Plus,
  Download,
  Upload,
  Users,
  Receipt,
  Drop,
  Lightning,
  FileText,
  Bell
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
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [paymentTenant, setPaymentTenant] = useState(null);

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowAddProperty(true);
  };

  const handleClosePropertyDialog = (open) => {
    setShowAddProperty(open);
    if (!open) setEditingProperty(null);
  };

  const handleEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setShowAddTenant(true);
  };

  const handleCloseTenantDialog = (open) => {
    setShowAddTenant(open);
    if (!open) setEditingTenant(null);
  };

  const handleRecordPayment = (tenant) => {
    setPaymentTenant(tenant);
    setShowRecordPayment(true);
  };

  const handleViewHistory = (tenant) => {
    setPaymentTenant(tenant);
    setShowPaymentHistory(true);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

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

      const [statsRes, propsRes, tenantsRes, expensesRes, utilsRes, taxesRes, remindersRes, rentPaymentsRes] = results;

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      else console.error('Failed to load stats:', statsRes.reason);

      if (propsRes.status === 'fulfilled') setProperties(propsRes.value.data);
      else console.error('Failed to load properties:', propsRes.reason);

      if (tenantsRes.status === 'fulfilled') setTenants(tenantsRes.value.data);
      else console.error('Failed to load tenants:', tenantsRes.reason);

      if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value.data);
      else console.error('Failed to load expenses:', expensesRes.reason);

      if (utilsRes.status === 'fulfilled') setUtilities(utilsRes.value.data);
      else console.error('Failed to load utilities:', utilsRes.reason);

      if (taxesRes.status === 'fulfilled') setTaxes(taxesRes.value.data);
      else console.error('Failed to load taxes:', taxesRes.reason);

      if (remindersRes.status === 'fulfilled') setReminders(remindersRes.value.data);
      else console.error('Failed to load reminders:', remindersRes.reason);

      if (rentPaymentsRes.status === 'fulfilled') setRentPayments(rentPaymentsRes.value.data);
      else console.error('Failed to load rent payments:', rentPaymentsRes.reason);

      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        toast.error(`Failed to load ${failedCount} data section(s)`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExpenses = async () => {
    try {
      const response = await axios.get(`${API}/export/expenses`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Expenses exported successfully');
    } catch (error) {
      console.error('Error exporting expenses:', error);
      toast.error('Failed to export expenses');
    }
  };

  const handleExportTenants = async () => {
    try {
      const response = await axios.get(`${API}/export/tenants`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tenants.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Tenants exported successfully');
    } catch (error) {
      console.error('Error exporting tenants:', error);
      toast.error('Failed to export tenants');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C4C3B] mx-auto"></div>
          <p className="mt-4 text-[#7D7D7D]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <header className="bg-white border-b border-[#E6E2D8]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#2C4C3B]" data-testid="dashboard-title">
                Property Dashboard
              </h1>
              <p className="text-sm text-[#7D7D7D] mt-1">Pattukottai, Tamil Nadu</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleExportExpenses}
                variant="outline"
                className="border-[#E6E2D8] hover:border-[#D1CBBF] transition-all duration-200"
                data-testid="export-expenses-btn"
              >
                <Download size={18} className="mr-2" />
                Export Expenses
              </Button>
              <Button
                onClick={handleExportTenants}
                variant="outline"
                className="border-[#E6E2D8] hover:border-[#D1CBBF] transition-all duration-200"
                data-testid="export-tenants-btn"
              >
                <Download size={18} className="mr-2" />
                Export Tenants
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <StatsCard
            icon={<House size={24} />}
            label="Total Property Value"
            value={`₹${(stats?.total_property_value || 0).toLocaleString('en-IN')}`}
            color="#2C4C3B"
            testId="stat-property-value"
          />
          <StatsCard
            icon={<TrendUp size={24} />}
            label="Total Appreciation"
            value={`₹${(stats?.total_appreciation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            color="#7BA38A"
            testId="stat-appreciation"
          />
          <StatsCard
            icon={<CurrencyInr size={24} />}
            label="Rent Collected"
            value={`₹${(stats?.total_rental_income || 0).toLocaleString('en-IN')}`}
            color="#2C4C3B"
            testId="stat-rental-income"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={<Receipt size={24} />}
            label="Total Expenses"
            value={`₹${(stats?.total_expenses || 0).toLocaleString('en-IN')}`}
            color="#D96C4E"
            testId="stat-expenses"
          />
          <StatsCard
            icon={<ChartLine size={24} />}
            label="Net Profit"
            value={`₹${(stats?.net_profit || 0).toLocaleString('en-IN')}`}
            color={stats?.net_profit >= 0 ? '#7BA38A' : '#D96C4E'}
            testId="stat-net-profit"
          />
          <StatsCard
            icon={<Users size={24} />}
            label="Security Deposits Held"
            value={`₹${(stats?.total_security_deposits || 0).toLocaleString('en-IN')}`}
            trend="Refundable on exit"
            color="#7BA38A"
            testId="stat-security-deposits"
          />
        </div>

        {/* Payment Reminders */}
        <div className="mb-8">
          <PaymentReminders reminders={reminders} onRefresh={fetchAllData} />
        </div>

        {/* Properties Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2C4C3B]">
              My Properties
            </h2>
            <Button
              onClick={() => setShowAddProperty(true)}
              className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white transition-all duration-200"
              data-testid="add-property-btn"
            >
              <Plus size={20} className="mr-2" />
              Add Property
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Tabs for detailed sections */}
        <Tabs defaultValue="tenants" className="w-full">
          <TabsList className="bg-white border border-[#E6E2D8] mb-6">
            <TabsTrigger value="tenants" data-testid="tab-tenants">
              <Users size={18} className="mr-2" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">
              <Receipt size={18} className="mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="utilities" data-testid="tab-utilities">
              <Lightning size={18} className="mr-2" />
              Utilities
            </TabsTrigger>
            <TabsTrigger value="taxes" data-testid="tab-taxes">
              <FileText size={18} className="mr-2" />
              Property Tax
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants">
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#2C4C3B]">Tenants</h3>
                <Button
                  onClick={() => setShowAddTenant(true)}
                  size="sm"
                  className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
                  data-testid="add-tenant-btn"
                >
                  <Plus size={18} className="mr-2" />
                  Add Tenant
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
              />
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#2C4C3B]">Expenses</h3>
                <Button
                  onClick={() => setShowAddExpense(true)}
                  size="sm"
                  className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
                  data-testid="add-expense-btn"
                >
                  <Plus size={18} className="mr-2" />
                  Add Expense
                </Button>
              </div>
              <ExpenseList expenses={expenses} properties={properties} onRefresh={fetchAllData} />
            </div>
          </TabsContent>

          <TabsContent value="utilities">
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#2C4C3B]">Utility Payments</h3>
                <Button
                  onClick={() => setShowAddUtility(true)}
                  size="sm"
                  className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
                  data-testid="add-utility-btn"
                >
                  <Plus size={18} className="mr-2" />
                  Add Payment
                </Button>
              </div>
              <UtilityPaymentsList utilities={utilities} properties={properties} onRefresh={fetchAllData} />
            </div>
          </TabsContent>

          <TabsContent value="taxes">
            <div className="bg-white border border-[#E6E2D8] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#2C4C3B]">Property Tax</h3>
                <Button
                  onClick={() => setShowAddTax(true)}
                  size="sm"
                  className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
                  data-testid="add-tax-btn"
                >
                  <Plus size={18} className="mr-2" />
                  Add Tax Record
                </Button>
              </div>
              <PropertyTaxList taxes={taxes} properties={properties} onRefresh={fetchAllData} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <AddPropertyDialog
        open={showAddProperty}
        onOpenChange={handleClosePropertyDialog}
        onSuccess={fetchAllData}
        editProperty={editingProperty}
      />
      <AddTenantDialog
        open={showAddTenant}
        onOpenChange={handleCloseTenantDialog}
        properties={properties}
        onSuccess={fetchAllData}
        editTenant={editingTenant}
      />
      <RecordRentPaymentDialog
        open={showRecordPayment}
        onOpenChange={setShowRecordPayment}
        tenant={paymentTenant}
        onSuccess={fetchAllData}
      />
      <PaymentHistoryDialog
        open={showPaymentHistory}
        onOpenChange={setShowPaymentHistory}
        tenant={paymentTenant}
        onUpdated={fetchAllData}
      />
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        properties={properties}
        onSuccess={fetchAllData}
      />
      <AddUtilityDialog
        open={showAddUtility}
        onOpenChange={setShowAddUtility}
        properties={properties}
        onSuccess={fetchAllData}
      />
      <AddTaxDialog
        open={showAddTax}
        onOpenChange={setShowAddTax}
        properties={properties}
        onSuccess={fetchAllData}
      />
    </div>
  );
}