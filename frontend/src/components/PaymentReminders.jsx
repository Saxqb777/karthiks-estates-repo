import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bell, EnvelopeSimple, CheckCircle, CurrencyInr } from '@phosphor-icons/react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PaymentReminders({ reminders, onRefresh }) {
  const [sending, setSending] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-[#B91C1C] bg-[#FEE2E2]/40';
      case 'medium': return 'border-[#B89D5F] bg-[#B89D5F]/10';
      default: return 'border-[#E5E2DA] bg-[#F4F4EF]';
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const response = await axios.post(`${API}/send-reminders-email`);
      toast.success(`Email sent! ${response.data.reminders_count} reminder(s) delivered.`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleMarkRentPaid = async (reminder) => {
    if (!reminder.tenant_id || !reminder.property_id) return;
    // Extract month/year from message like "Rent unpaid for X (5/2026)..."
    const match = reminder.message.match(/\((\d+)\/(\d+)\)/);
    if (!match) {
      toast.error('Could not parse month/year from reminder');
      return;
    }
    const month = parseInt(match[1]);
    const year = parseInt(match[2]);
    // Extract amount
    const amtMatch = reminder.message.match(/₹([\d,\.]+)/);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 0;

    setResolvingId(`${reminder.tenant_id}-${month}-${year}`);
    try {
      await axios.post(`${API}/rent-payments`, {
        tenant_id: reminder.tenant_id,
        property_id: reminder.property_id,
        amount,
        payment_date: new Date().toISOString().split('T')[0],
        month,
        year,
        notes: 'Marked paid from reminder'
      });
      toast.success(`Marked ${monthNames[month - 1]} ${year} as paid`);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark as paid');
    } finally {
      setResolvingId(null);
    }
  };

  const handleMarkUtilityPaid = async (reminder) => {
    if (!reminder.utility_id) return;
    setResolvingId(reminder.utility_id);
    try {
      await axios.patch(`${API}/utility-payments/${reminder.utility_id}`, {
        paid_status: true,
        payment_date: new Date().toISOString()
      });
      toast.success('Utility payment marked as paid');
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark as paid');
    } finally {
      setResolvingId(null);
    }
  };

  const handleMarkTaxPaid = async (reminder) => {
    if (!reminder.tax_id) return;
    setResolvingId(reminder.tax_id);
    try {
      await axios.patch(`${API}/property-taxes/${reminder.tax_id}`, {
        paid_status: true,
        payment_date: new Date().toISOString()
      });
      toast.success('Property tax marked as paid');
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark as paid');
    } finally {
      setResolvingId(null);
    }
  };

  const resolveHandler = (reminder) => {
    if (reminder.type === 'rent') return () => handleMarkRentPaid(reminder);
    if (reminder.type === 'utility') return () => handleMarkUtilityPaid(reminder);
    if (reminder.type === 'tax') return () => handleMarkTaxPaid(reminder);
    return null;
  };

  return (
    <div className="bg-white border border-[#E5E2DA] rounded-lg p-6" data-testid="payment-reminders">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bell size={20} className="text-[#B89D5F] mr-3" />
          <h3 className="text-base font-semibold text-[#0F172A]">Pending Actions</h3>
          {reminders.length > 0 && (
            <span className="ml-3 bg-[#0F172A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums">
              {reminders.length}
            </span>
          )}
        </div>
        <Button
          onClick={handleSendEmail}
          disabled={sending}
          size="sm"
          variant="outline"
          className="border-[#E5E2DA] hover:border-[#0F172A] text-xs"
          data-testid="send-reminders-email-btn"
        >
          <EnvelopeSimple size={14} className="mr-1.5" />
          {sending ? 'Sending...' : 'Email Me'}
        </Button>
      </div>
      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#64748B]">
            All caught up — no pending actions at this time.
          </div>
        ) : (
          reminders.map((reminder, index) => {
            const handler = resolveHandler(reminder);
            const reminderKey = `${reminder.tenant_id || reminder.utility_id || reminder.tax_id || index}-${reminder.message}`;
            const isResolving = resolvingId && (resolvingId === reminder.utility_id || resolvingId === reminder.tax_id || resolvingId.includes(reminder.tenant_id || ''));
            return (
              <div
                key={reminderKey}
                className={`p-4 border rounded-md flex items-center justify-between gap-4 ${getPriorityColor(reminder.priority)}`}
                data-testid={`reminder-${index}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {reminder.type === 'rent' && <CurrencyInr size={18} className="text-[#B91C1C] flex-shrink-0" />}
                  {reminder.type === 'utility' && <Bell size={18} className="text-[#B89D5F] flex-shrink-0" />}
                  {reminder.type === 'tax' && <Bell size={18} className="text-[#B91C1C] flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B] block mb-0.5">
                      {reminder.type} · {reminder.priority} priority
                    </span>
                    <p className="text-sm text-[#0F172A] truncate">{reminder.message}</p>
                  </div>
                </div>
                {handler && (
                  <Button
                    onClick={handler}
                    disabled={isResolving}
                    size="sm"
                    className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs flex-shrink-0"
                    data-testid={`resolve-reminder-${index}`}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    {isResolving ? 'Saving...' : 'Mark Paid'}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
