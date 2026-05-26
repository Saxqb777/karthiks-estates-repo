import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash, Check, X, Drop, Lightning } from '@phosphor-icons/react';
import { Button } from './ui/button';
import ConfirmDialog from './ConfirmDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UtilityPaymentsList({ utilities, properties, onRefresh }) {
  const [deleteId, setDeleteId] = useState(null);

  const handleTogglePaid = async (utilityId, currentStatus) => {
    try {
      await axios.patch(`${API}/utility-payments/${utilityId}`, {
        paid_status: !currentStatus,
        payment_date: !currentStatus ? new Date().toISOString() : null
      });
      toast.success('Payment status updated');
      onRefresh();
    } catch (error) {
      console.error('Error updating utility payment:', error);
      toast.error('Failed to update status');
    }
  };

  const performDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/utility-payments/${deleteId}`);
      toast.success('Payment record deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting utility payment:', error);
      toast.error('Failed to delete payment record');
    } finally {
      setDeleteId(null);
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const isOverdue = (dueDate, paidStatus) => {
    if (paidStatus) return false;
    return new Date(dueDate) < new Date();
  };

  if (utilities.length === 0) {
    return (
      <div className="text-center py-12 text-[#7D7D7D]">
        <p>No utility payments recorded yet. Click "Add Payment" to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="utilities-table">
        <thead>
          <tr className="border-b border-[#E6E2D8]">
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Type
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Property
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Due Date
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Paid By
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Reference
            </th>
            <th className="text-center py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {utilities.map((utility) => (
            <tr
              key={utility.id}
              className={`border-b border-[#E6E2D8] hover:bg-[#F7F5F0]/50 ${
                isOverdue(utility.due_date, utility.paid_status) ? 'bg-[#D96C4E]/5' : ''
              }`}
              data-testid={`utility-row-${utility.id}`}
            >
              <td className="py-4 px-4">
                <div className="flex items-center">
                  {utility.utility_type === 'water' ? (
                    <Drop size={20} className="mr-2 text-[#2C4C3B]" />
                  ) : (
                    <Lightning size={20} className="mr-2 text-[#D96C4E]" />
                  )}
                  <span className="capitalize text-[#2E2E2E] font-medium">
                    {utility.utility_type}
                  </span>
                </div>
              </td>
              <td className="py-4 px-4 text-[#2E2E2E]">
                {getPropertyName(utility.property_id)}
              </td>
              <td className="py-4 px-4 font-semibold text-[#2C4C3B]">
                ₹{utility.amount.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-4 text-[#7D7D7D]">
                {new Date(utility.due_date).toLocaleDateString('en-IN')}
                {isOverdue(utility.due_date, utility.paid_status) && (
                  <span className="ml-2 text-xs text-[#D96C4E] font-medium">(Overdue)</span>
                )}
              </td>
              <td className="py-4 px-4">
                <Button
                  size="sm"
                  variant={utility.paid_status ? 'default' : 'outline'}
                  onClick={() => handleTogglePaid(utility.id, utility.paid_status)}
                  className={utility.paid_status ? 'bg-[#7BA38A] hover:bg-[#6A9279] text-white' : 'border-[#E6E2D8] hover:border-[#D1CBBF]'}
                  data-testid={`toggle-paid-${utility.id}`}
                >
                  {utility.paid_status ? (
                    <>
                      <Check size={16} className="mr-1" />
                      Paid
                    </>
                  ) : (
                    <>
                      <X size={16} className="mr-1" />
                      Unpaid
                    </>
                  )}
                </Button>
              </td>
              <td className="py-4 px-4">
                {utility.paid_status ? (
                  <span
                    className={`inline-block px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${
                      (utility.paid_by || 'owner') === 'tenant'
                        ? 'bg-[#10B981]/10 text-[#047857]'
                        : 'bg-[#0F172A]/10 text-[#0F172A]'
                    }`}
                  >
                    {(utility.paid_by || 'owner') === 'tenant' ? 'Tenant' : 'Owner'}
                  </span>
                ) : (
                  <span className="text-[#94A3B8] text-xs">—</span>
                )}
              </td>
              <td className="py-4 px-4 text-[11px] text-[#64748B] font-mono break-all max-w-[180px]">
                {utility.bill_reference || <span className="text-[#94A3B8]">—</span>}
              </td>
              <td className="py-4 px-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(utility.id)}
                  className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                  data-testid={`delete-utility-${utility.id}`}
                >
                  <Trash size={18} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete this payment record?"
        description="This will permanently remove the utility payment record. This action cannot be undone."
        confirmLabel="Yes, Delete"
        onConfirm={performDelete}
        testId="confirm-delete-utility"
      />
    </div>
  );
}