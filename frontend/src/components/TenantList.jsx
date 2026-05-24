import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash, Phone, PencilSimple, CurrencyInr, Receipt } from '@phosphor-icons/react';
import { Button } from './ui/button';
import ConfirmDialog from './ConfirmDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TenantList({ tenants, properties, rentPayments, onRefresh, onEdit, onRecordPayment, onViewHistory }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const performDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API}/tenants/${deleteTarget.id}`);
      toast.success('Tenant deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Failed to delete tenant');
    } finally {
      setDeleteTarget(null);
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getLastPayment = (tenantId) => {
    if (!rentPayments) return null;
    const payments = rentPayments
      .filter(p => p.tenant_id === tenantId)
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    return payments.length > 0 ? payments[0] : null;
  };

  const getNextDueInfo = (tenant) => {
    const now = new Date();
    const dueDay = tenant.rent_due_day || 1;

    // Always return the next upcoming due date (in the future)
    let nextDue;
    if (now.getDate() < dueDay) {
      // Due day hasn't arrived this month yet
      nextDue = new Date(now.getFullYear(), now.getMonth(), dueDay);
    } else {
      // Due day has passed this month - next due is next month
      nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    }
    return { date: nextDue };
  };

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-[#7D7D7D]">
        <p>No tenants added yet. Click "Add Tenant" to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="tenants-table">
        <thead>
          <tr className="border-b border-[#E6E2D8]">
            <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Name</th>
            <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Property</th>
            <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Contact</th>
            <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Lease Start</th>
            <th className="text-right py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Monthly Rent</th>
            <th className="text-right py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Security Deposit</th>
            <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Last Payment Date</th>
            <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Next Payment Date</th>
            <th className="text-center py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => {
            const lastPayment = getLastPayment(tenant.id);
            const nextDue = getNextDueInfo(tenant);
            return (
              <tr key={tenant.id} className="border-b border-[#E6E2D8] hover:bg-[#F7F5F0]/50" data-testid={`tenant-row-${tenant.id}`}>
                <td className="py-4 px-3">
                  <p className="font-medium text-[#2E2E2E]">{tenant.name}</p>
                </td>
                <td className="py-4 px-3 text-sm text-[#2E2E2E]">
                  {getPropertyName(tenant.property_id)}
                </td>
                <td className="py-4 px-3">
                  <div className="flex items-center text-sm text-[#7D7D7D]">
                    <Phone size={14} className="mr-1" />
                    {tenant.contact}
                  </div>
                </td>
                <td className="py-4 px-3 text-sm text-[#2E2E2E]">
                  {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString('en-IN') : '-'}
                </td>
                <td className="py-4 px-3 text-right font-semibold text-[#2C4C3B]">
                  ₹{tenant.monthly_rent.toLocaleString('en-IN')}
                </td>
                <td className="py-4 px-3 text-right">
                  <span className="font-medium text-[#7BA38A]">
                    ₹{(tenant.security_deposit || 0).toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="py-4 px-3 text-sm">
                  {lastPayment ? (
                    <div>
                      <p className="text-[#2E2E2E]">{new Date(lastPayment.payment_date).toLocaleDateString('en-IN')}</p>
                      <p className="text-xs text-[#7D7D7D]">₹{lastPayment.amount.toLocaleString('en-IN')}</p>
                    </div>
                  ) : (
                    <span className="text-[#7D7D7D] italic">No payments</span>
                  )}
                </td>
                <td className="py-4 px-3 text-sm">
                  <p className="text-[#2E2E2E]">{nextDue.date.toLocaleDateString('en-IN')}</p>
                </td>
                <td className="py-4 px-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRecordPayment(tenant)}
                      className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
                      title="Record Payment"
                      data-testid={`record-payment-${tenant.id}`}
                    >
                      <CurrencyInr size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewHistory(tenant)}
                      className="text-[#7BA38A] hover:text-[#6A9279] hover:bg-[#7BA38A]/10"
                      title="Payment History"
                      data-testid={`view-history-${tenant.id}`}
                    >
                      <Receipt size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(tenant)}
                      className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
                      title="Edit Tenant"
                      data-testid={`edit-tenant-${tenant.id}`}
                    >
                      <PencilSimple size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(tenant)}
                      className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                      title="Delete Tenant"
                      data-testid={`delete-tenant-${tenant.id}`}
                    >
                      <Trash size={18} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Delete tenant "${deleteTarget?.name}"?`}
        description={
          deleteTarget && deleteTarget.security_deposit > 0
            ? `This will permanently remove all tenant records.\n\n⚠️ A security deposit of ₹${deleteTarget.security_deposit.toLocaleString('en-IN')} may need to be refunded to this tenant.`
            : 'This will permanently remove all tenant records. This action cannot be undone.'
        }
        confirmLabel="Yes, Delete Tenant"
        onConfirm={performDelete}
        testId="confirm-delete-tenant"
      />
    </div>
  );
}
