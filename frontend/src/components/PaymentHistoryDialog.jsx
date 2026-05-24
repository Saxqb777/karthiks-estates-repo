import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Trash, PencilSimple } from '@phosphor-icons/react';
import ConfirmDialog from './ConfirmDialog';
import RecordRentPaymentDialog from './RecordRentPaymentDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PaymentHistoryDialog({ open, onOpenChange, tenant, onUpdated }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const fetchPayments = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/rent-payments?tenant_id=${tenant.id}`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && tenant) {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenant]);

  const performDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/rent-payments/${deleteId}`);
      toast.success('Payment deleted');
      fetchPayments();
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    } finally {
      setDeleteId(null);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto" data-testid="payment-history-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            Rent Payment History
          </DialogTitle>
          <DialogDescription className="text-[#7D7D7D]">
            All payments received from <span className="font-semibold text-[#2C4C3B]">{tenant?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-4 bg-[#F7F5F0] rounded-lg border border-[#E6E2D8]">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Total Collected</span>
              <span className="text-xl font-semibold text-[#2C4C3B]">₹{totalCollected.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Total Payments</span>
              <span className="text-sm text-[#2E2E2E]">{payments.length} record(s)</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-[#7D7D7D]">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-[#7D7D7D]">
              No payments recorded yet. Use "Record Payment" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E6E2D8]">
                    <th className="text-left py-3 px-2 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">For Month</th>
                    <th className="text-left py-3 px-2 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Paid On</th>
                    <th className="text-right py-3 px-2 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Amount</th>
                    <th className="text-left py-3 px-2 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Notes</th>
                    <th className="text-center py-3 px-2 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-[#E6E2D8]" data-testid={`payment-row-${payment.id}`}>
                      <td className="py-3 px-2 text-[#2E2E2E] font-medium">
                        {monthNames[payment.month - 1]} {payment.year}
                      </td>
                      <td className="py-3 px-2 text-[#7D7D7D]">
                        {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-[#2C4C3B]">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-sm text-[#7D7D7D]">
                        {payment.notes || '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditPayment(payment); setShowEdit(true); }}
                            className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
                            data-testid={`edit-payment-${payment.id}`}
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(payment.id)}
                            className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                            data-testid={`delete-payment-${payment.id}`}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => { if (!open) setDeleteId(null); }}
          title="Delete this payment record?"
          description="This will permanently remove the rent payment record. This action cannot be undone."
          confirmLabel="Yes, Delete"
          onConfirm={performDelete}
          testId="confirm-delete-payment"
        />
        <RecordRentPaymentDialog
          open={showEdit}
          onOpenChange={(o) => { setShowEdit(o); if (!o) setEditPayment(null); }}
          tenant={tenant}
          editPayment={editPayment}
          onSuccess={() => { fetchPayments(); if (onUpdated) onUpdated(); }}
        />
      </DialogContent>
    </Dialog>
  );
}
