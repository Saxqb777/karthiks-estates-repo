import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emptyForm = {
  property_id: '',
  name: '',
  contact: '',
  monthly_rent: '',
  security_deposit: '',
  rent_due_day: '1',
  lease_start: ''
};

export default function AddTenantDialog({ open, onOpenChange, properties, onSuccess, editTenant }) {
  const isEditMode = !!editTenant;
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTenant) {
      setFormData({
        property_id: editTenant.property_id || '',
        name: editTenant.name || '',
        contact: editTenant.contact || '',
        monthly_rent: editTenant.monthly_rent?.toString() || '',
        security_deposit: editTenant.security_deposit?.toString() || '0',
        rent_due_day: editTenant.rent_due_day?.toString() || '1',
        lease_start: editTenant.lease_start ? editTenant.lease_start.split('T')[0] : ''
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editTenant, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: parseFloat(formData.security_deposit) || 0,
        rent_due_day: parseInt(formData.rent_due_day) || 1,
        lease_end: ''
      };

      if (isEditMode) {
        const { property_id, ...updatePayload } = payload;
        await axios.patch(`${API}/tenants/${editTenant.id}`, updatePayload);
        toast.success('Tenant updated successfully');
      } else {
        await axios.post(`${API}/tenants`, payload);
        toast.success('Tenant added successfully');
      }

      setFormData(emptyForm);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast.error(isEditMode ? 'Failed to update tenant' : 'Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };

  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto" data-testid="add-tenant-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            {isEditMode ? 'Edit Tenant' : 'Add New Tenant'}
          </DialogTitle>
          <DialogDescription className="text-[#7D7D7D]">
            {isEditMode ? 'Update tenant details.' : 'Enter the details of your new tenant.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="property" className="text-[#2E2E2E]">Property *</Label>
              <Select
                value={formData.property_id}
                onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                required
                disabled={isEditMode}
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
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="security_deposit" className="text-[#2E2E2E]">Security Deposit (₹) *</Label>
                <Input
                  id="security_deposit"
                  type="number"
                  step="0.01"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  required
                  placeholder="Refundable on exit"
                  className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                  data-testid="tenant-deposit-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rent_due_day" className="text-[#2E2E2E]">Rent Due Day of Month *</Label>
              <Select
                value={formData.rent_due_day}
                onValueChange={(value) => setFormData({ ...formData, rent_due_day: value })}
              >
                <SelectTrigger className="border-[#E6E2D8]" data-testid="tenant-due-day-select">
                  <SelectValue placeholder="Day of month rent is due" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {dayOptions.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}{day === '1' ? 'st' : day === '2' ? 'nd' : day === '3' ? 'rd' : 'th'} of every month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Tenant' : 'Add Tenant')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
