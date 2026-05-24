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

export default function AddTaxDialog({ open, onOpenChange, properties, onSuccess }) {
  const [formData, setFormData] = useState({
    property_id: '',
    amount: '',
    year: new Date().getFullYear(),
    paid_status: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/property-taxes`, {
        ...formData,
        amount: parseFloat(formData.amount),
        year: parseInt(formData.year)
      });

      toast.success('Property tax record added successfully');
      setFormData({
        property_id: '',
        amount: '',
        year: new Date().getFullYear(),
        paid_status: false
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding property tax:', error);
      toast.error('Failed to add property tax record');
    } finally {
      setLoading(false);
    }
  };

  // Generate year options (current year and previous 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white" data-testid="add-tax-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            Add Property Tax Record
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
                <SelectTrigger className="border-[#E6E2D8]" data-testid="tax-property-select">
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
              <Label htmlFor="year" className="text-[#2E2E2E]">Tax Year *</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
              >
                <SelectTrigger className="border-[#E6E2D8]" data-testid="tax-year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
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
                data-testid="tax-amount-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E6E2D8]"
              data-testid="cancel-tax-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
              data-testid="submit-tax-btn"
            >
              {loading ? 'Adding...' : 'Add Tax Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}