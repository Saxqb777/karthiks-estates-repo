import React from 'react';
import { Bell, X } from '@phosphor-icons/react';

export default function PaymentReminders({ reminders, onRefresh }) {
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

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-lg p-6" data-testid="payment-reminders">
      <div className="flex items-center mb-4">
        <Bell size={24} className="text-[#D96C4E] mr-3" />
        <h3 className="text-xl font-semibold text-[#2C4C3B]">Payment Reminders</h3>
        <span className="ml-3 bg-[#D96C4E] text-white text-xs font-bold px-2 py-1 rounded-full">
          {reminders.length}
        </span>
      </div>
      <div className="space-y-3">
        {reminders.map((reminder, index) => (
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
        ))}
      </div>
    </div>
  );
}