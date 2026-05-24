import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bell, EnvelopeSimple } from '@phosphor-icons/react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PaymentReminders({ reminders, onRefresh }) {
  const [sending, setSending] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-[#D96C4E] bg-[#D96C4E]/10';
      case 'medium':
        return 'border-[#D96C4E] bg-[#D96C4E]/5';
      default:
        return 'border-[#7D7D7D] bg-[#7D7D7D]/5';
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const response = await axios.post(`${API}/send-reminders-email`);
      toast.success(`Email sent! ${response.data.reminders_count} reminder(s) delivered.`);
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to send email';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-lg p-6" data-testid="payment-reminders">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bell size={24} className="text-[#D96C4E] mr-3" />
          <h3 className="text-xl font-semibold text-[#2C4C3B]">Payment Reminders</h3>
          <span className="ml-3 bg-[#D96C4E] text-white text-xs font-bold px-2 py-1 rounded-full">
            {reminders.length}
          </span>
        </div>
        <Button
          onClick={handleSendEmail}
          disabled={sending}
          size="sm"
          className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white transition-all duration-200"
          data-testid="send-reminders-email-btn"
        >
          <EnvelopeSimple size={18} className="mr-2" />
          {sending ? 'Sending...' : 'Send Reminders Now'}
        </Button>
      </div>
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-[#7D7D7D]">
            <p>All caught up! No pending payments at this time.</p>
          </div>
        ) : (
          reminders.map((reminder, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg ${getPriorityColor(reminder.priority)}`}
            data-testid={`reminder-${index}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
                    {reminder.type}
                  </span>
                  <span className={`text-xs font-bold uppercase ${
                    reminder.priority === 'high' ? 'text-[#D96C4E]' : 'text-[#7D7D7D]'
                  }`}>
                    {reminder.priority} Priority
                  </span>
                </div>
                <p className="text-[#2E2E2E]">{reminder.message}</p>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
