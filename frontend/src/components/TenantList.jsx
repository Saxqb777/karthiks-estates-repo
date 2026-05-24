import React from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash, Phone, PencilSimple } from '@phosphor-icons/react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TenantList({ tenants, properties, onRefresh, onEdit }) {
  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await axios.patch(`${API}/tenants/${tenantId}`, {
        payment_status: newStatus
      });
      toast.success('Payment status updated');
      onRefresh();
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;
    
    try {
      await axios.delete(`${API}/tenants/${tenantId}`);
      toast.success('Tenant deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Failed to delete tenant');
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-[#7BA38A] bg-[#7BA38A]/10';
      case 'pending':
        return 'text-[#D96C4E] bg-[#D96C4E]/10';
      case 'overdue':
        return 'text-[#D96C4E] bg-[#D96C4E]/20';
      default:
        return 'text-[#7D7D7D] bg-gray-100';
    }
  };

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-[#7D7D7D]">
        <p>No tenants added yet. Click "Add Tenant" to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="tenants-table">
        <thead>
          <tr className="border-b border-[#E6E2D8]">
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Name
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Property
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Contact
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Monthly Rent
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Lease Period
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="border-b border-[#E6E2D8] hover:bg-[#F7F5F0]/50" data-testid={`tenant-row-${tenant.id}`}>
              <td className="py-4 px-4">
                <p className="font-medium text-[#2E2E2E]">{tenant.name}</p>
              </td>
              <td className="py-4 px-4 text-[#2E2E2E]">
                {getPropertyName(tenant.property_id)}
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center text-sm text-[#7D7D7D]">
                  <Phone size={14} className="mr-1" />
                  {tenant.contact}
                </div>
              </td>
              <td className="py-4 px-4 font-semibold text-[#2C4C3B]">
                ₹{tenant.monthly_rent.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-4 text-sm text-[#7D7D7D]">
                {new Date(tenant.lease_start).toLocaleDateString('en-IN')} - {new Date(tenant.lease_end).toLocaleDateString('en-IN')}
              </td>
              <td className="py-4 px-4">
                <Select
                  value={tenant.payment_status}
                  onValueChange={(value) => handleStatusChange(tenant.id, value)}
                >
                  <SelectTrigger className="w-32 border-[#E6E2D8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(tenant)}
                    className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
                    data-testid={`edit-tenant-${tenant.id}`}
                  >
                    <PencilSimple size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tenant.id)}
                    className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                    data-testid={`delete-tenant-${tenant.id}`}
                  >
                    <Trash size={18} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}