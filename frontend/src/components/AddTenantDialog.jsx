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
  lease_start: '',
  lease_end: '',
  payment_status: 'pending'
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
        lease_start: editTenant.lease_start ? editTenant.lease_start.split('T')[0] : '',
        lease_end: editTenant.lease_end ? editTenant.lease_end.split('T')[0] : '',
        payment_status: editTenant.payment_status || 'pending'
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
        monthly_rent: parseFloat(formData.monthly_rent)
      };

      if (isEditMode) {
        // For edit, exclude property_id (not in TenantUpdate model)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white" data-testid="add-tenant-dialog">
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
              {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Tenant' : 'Add Tenant')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
