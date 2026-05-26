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

const emptyForm = {
  property_id: '',
  amount: '',
  due_date: '',
  paid_by: 'owner'
};

export default function AddUtilityDialog({ open, onOpenChange, properties, onSuccess }) {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isoDue = new Date(formData.due_date).toISOString();
      await axios.post(`${API}/utility-payments`, {
        property_id: formData.property_id,
        utility_type: 'electricity',
        amount: parseFloat(formData.amount),
        due_date: isoDue,
        paid_status: true,
        payment_date: isoDue,
        paid_by: formData.paid_by,
        bill_reference: ''
      });

      toast.success(`Payment recorded · paid by ${formData.paid_by}`);
      setFormData(emptyForm);
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
      <DialogContent className="sm:max-w-[480px] bg-white" data-testid="add-utility-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172A]">
            Add Utility Payment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="property" className="text-[#0F172A]">Property *</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                required
              >
                <SelectTrigger className="border-[#E5E2DA]" data-testid="utility-property-select">
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
              <Label htmlFor="amount" className="text-[#0F172A]">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="border-[#E5E2DA]"
                data-testid="utility-amount-input"
              />
            </div>

            <div>
              <Label htmlFor="due_date" className="text-[#0F172A]">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="border-[#E5E2DA]"
                data-testid="utility-due-date-input"
              />
            </div>

            <div>
              <Label htmlFor="paid_by" className="text-[#0F172A]">Paid By *</Label>
              <Select
                value={formData.paid_by}
                onValueChange={(value) => setFormData({ ...formData, paid_by: value })}
              >
                <SelectTrigger className="border-[#E5E2DA]" data-testid="utility-paid-by-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner — counts as my expense</SelectItem>
                  <SelectItem value="tenant">Tenant — not my expense</SelectItem>
                </SelectContent>
              </Select>
              <p className={`text-[11px] mt-1.5 font-medium ${formData.paid_by === 'owner' ? 'text-[#B91C1C]' : 'text-[#047857]'}`}>
                {formData.paid_by === 'owner'
                  ? '↘ This amount will be added to your total expenses.'
                  : '↗ Tenant covered this — your expenses are unaffected.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E5E2DA]"
              data-testid="cancel-utility-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white"
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
