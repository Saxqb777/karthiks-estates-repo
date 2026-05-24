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

export default function AddTenantDialog({ open, onOpenChange, properties, onSuccess }) {
  const [formData, setFormData] = useState({
    property_id: '',
    name: '',
    contact: '',
    email: '',
    monthly_rent: '',
    lease_start: '',
    lease_end: '',
    payment_status: 'pending'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/tenants`, {
        ...formData,
        monthly_rent: parseFloat(formData.monthly_rent)
      });

      toast.success('Tenant added successfully');
      setFormData({
        property_id: '',
        name: '',
        contact: '',
        email: '',
        monthly_rent: '',
        lease_start: '',
        lease_end: '',
        payment_status: 'pending'
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast.error('Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white" data-testid="add-tenant-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            Add New Tenant
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
                <SelectTrigger className="border-[#E6E2D8]" data-testid="tenant-property-select">
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
              <Label htmlFor="name" className="text-[#2E2E2E]">Tenant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="tenant-name-input"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-[#2E2E2E]">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="tenant-email-input"
              />
            </div>
            <div>
              <Label htmlFor="contact" className="text-[#2E2E2E]">Contact Number *</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="tenant-contact-input"
              />
            </div>
            <div>
              <Label htmlFor="monthly_rent" className="text-[#2E2E2E]">Monthly Rent (₹) *</Label>
              <Input
                id="monthly_rent"
                type="number"
                step="0.01"
                value={formData.monthly_rent}
                onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="tenant-rent-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lease_start" className="text-[#2E2E2E]">Lease Start *</Label>
                <Input
                  id="lease_start"
                  type="date"
                  value={formData.lease_start}
                  onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                  required
                  className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                  data-testid="tenant-lease-start-input"
                />
              </div>
              <div>
                <Label htmlFor="lease_end" className="text-[#2E2E2E]">Lease End *</Label>
                <Input
                  id="lease_end"
                  type="date"
                  value={formData.lease_end}
                  onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                  required
                  className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                  data-testid="tenant-lease-end-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="payment_status" className="text-[#2E2E2E]">Payment Status *</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
              >
                <SelectTrigger className="border-[#E6E2D8]" data-testid="tenant-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E6E2D8]"
              data-testid="cancel-tenant-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
              data-testid="submit-tenant-btn"
            >
              {loading ? 'Adding...' : 'Add Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}