import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AddUtilityDialog({ open, onOpenChange, properties, onSuccess }) {
  const [formData, setFormData] = useState({
    property_id: '',
    utility_type: 'electricity',
    amount: '',
    due_date: '',
    paid_status: false,
    payment_date: '',
    paid_by: 'owner',
    bill_reference: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      if (formData.paid_status && formData.payment_date) {
        payload.payment_date = new Date(formData.payment_date).toISOString();
      } else if (!formData.paid_status) {
        payload.payment_date = null;
      }
      await axios.post(`${API}/utility-payments`, payload);

      toast.success('Utility payment added successfully');
      setFormData({
        property_id: '',
        utility_type: 'electricity',
        amount: '',
        due_date: '',
        paid_status: false,
        payment_date: '',
        paid_by: 'owner',
        bill_reference: ''
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding utility payment:', error);
      toast.error('Failed to add utility payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white" data-testid="add-utility-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            Add Utility Payment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="property" className="text-[#2E2E2E]">Property *</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                required
              >
                <SelectTrigger className="border-[#E6E2D8]" data-testid="utility-property-select">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount" className="text-[#2E2E2E]">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="utility-amount-input"
              />
            </div>
            <div>
              <Label htmlFor="due_date" className="text-[#2E2E2E]">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="utility-due-date-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="paid_status"
                type="checkbox"
                checked={formData.paid_status}
                onChange={(e) => setFormData({ ...formData, paid_status: e.target.checked })}
                className="h-4 w-4 accent-[#0F172A]"
                data-testid="utility-paid-status-checkbox"
              />
              <Label htmlFor="paid_status" className="text-[#2E2E2E] cursor-pointer">Already paid</Label>
            </div>
            {formData.paid_status && (
              <>
                <div>
                  <Label htmlFor="payment_date" className="text-[#2E2E2E]">Payment Date *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                    className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                    data-testid="utility-payment-date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="paid_by" className="text-[#2E2E2E]">Paid By *</Label>
                  <Select
                    value={formData.paid_by}
                    onValueChange={(value) => setFormData({ ...formData, paid_by: value })}
                  >
                    <SelectTrigger className="border-[#E6E2D8]" data-testid="utility-paid-by-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner (me) — counts as my expense</SelectItem>
                      <SelectItem value="tenant">Tenant — not my expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bill_reference" className="text-[#2E2E2E]">Bank / Bill Reference</Label>
                  <Input
                    id="bill_reference"
                    value={formData.bill_reference}
                    onChange={(e) => setFormData({ ...formData, bill_reference: e.target.value })}
                    className="border-[#E6E2D8] focus:border-[#2C4C3B] font-mono"
                    data-testid="utility-bill-ref-input"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E6E2D8]"
              data-testid="cancel-utility-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
              data-testid="submit-utility-btn"
            >
              {loading ? 'Adding...' : 'Add Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}