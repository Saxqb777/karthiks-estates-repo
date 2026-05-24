import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function RecordRentPaymentDialog({ open, onOpenChange, tenant, onSuccess }) {
  const today = new Date();
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: today.toISOString().split('T')[0],
    month: (today.getMonth() + 1).toString(),
    year: today.getFullYear().toString(),
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant && open) {
      const now = new Date();
      setFormData({
        amount: tenant.monthly_rent?.toString() || '',
        payment_date: now.toISOString().split('T')[0],
        month: (now.getMonth() + 1).toString(),
        year: now.getFullYear().toString(),
        notes: ''
      });
    }
  }, [tenant, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);

    try {
      await axios.post(`${API}/rent-payments`, {
        tenant_id: tenant.id,
        property_id: tenant.property_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        notes: formData.notes
      });

      toast.success(`Rent payment recorded for ${tenant.name}`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) => (today.getFullYear() - i).toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white" data-testid="record-payment-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            Record Rent Payment
          </DialogTitle>
          <DialogDescription className="text-[#7D7D7D]">
            Recording payment for <span className="font-semibold text-[#2C4C3B]">{tenant?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount" className="text-[#2E2E2E]">Amount Paid (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="payment-amount-input"
              />
            </div>
            <div>
              <Label htmlFor="payment_date" className="text-[#2E2E2E]">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="payment-date-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month" className="text-[#2E2E2E]">Rent for Month *</Label>
                <Select
                  value={formData.month}
                  onValueChange={(value) => setFormData({ ...formData, month: value })}
                >
                  <SelectTrigger className="border-[#E6E2D8]" data-testid="payment-month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year" className="text-[#2E2E2E]">Year *</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => setFormData({ ...formData, year: value })}
                >
                  <SelectTrigger className="border-[#E6E2D8]" data-testid="payment-year-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-[#2E2E2E]">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., paid via UPI, partial payment, etc."
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="payment-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E6E2D8]"
              data-testid="cancel-payment-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
              data-testid="submit-payment-btn"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
