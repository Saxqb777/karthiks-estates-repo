import React from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash, Check, X } from '@phosphor-icons/react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PropertyTaxList({ taxes, properties, onRefresh }) {
  const handleTogglePaid = async (taxId, currentStatus) => {
    try {
      await axios.patch(`${API}/property-taxes/${taxId}`, {
        paid_status: !currentStatus,
        payment_date: !currentStatus ? new Date().toISOString() : null
      });
      toast.success('Tax payment status updated');
      onRefresh();
    } catch (error) {
      console.error('Error updating tax payment:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (taxId) => {
    if (!window.confirm('Are you sure you want to delete this tax record?')) return;
    
    try {
      await axios.delete(`${API}/property-taxes/${taxId}`);
      toast.success('Tax record deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting tax record:', error);
      toast.error('Failed to delete tax record');
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  if (taxes.length === 0) {
    return (
      <div className="text-center py-12 text-[#7D7D7D]">
        <p>No property tax records yet. Click "Add Tax Record" to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="taxes-table">
        <thead>
          <tr className="border-b border-[#E6E2D8]">
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Property
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Year
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Payment Date
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Status
            </th>
            <th className="text-center py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {taxes.map((tax) => (
            <tr key={tax.id} className="border-b border-[#E6E2D8] hover:bg-[#F7F5F0]/50" data-testid={`tax-row-${tax.id}`}>
              <td className="py-4 px-4 text-[#2E2E2E] font-medium">
                {getPropertyName(tax.property_id)}
              </td>
              <td className="py-4 px-4 text-[#2E2E2E] font-medium">
                {tax.year}
              </td>
              <td className="py-4 px-4 font-semibold text-[#2C4C3B]">
                ₹{tax.amount.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-4 text-[#7D7D7D]">
                {tax.payment_date ? new Date(tax.payment_date).toLocaleDateString('en-IN') : '-'}
              </td>
              <td className="py-4 px-4">
                <Button
                  size="sm"
                  variant={tax.paid_status ? 'default' : 'outline'}
                  onClick={() => handleTogglePaid(tax.id, tax.paid_status)}
                  className={tax.paid_status ? 'bg-[#7BA38A] hover:bg-[#6A9279] text-white' : 'border-[#E6E2D8] hover:border-[#D1CBBF]'}
                  data-testid={`toggle-tax-paid-${tax.id}`}
                >
                  {tax.paid_status ? (
                    <>
                      <Check size={16} className="mr-1" />
                      Paid
                    </>
                  ) : (
                    <>
                      <X size={16} className="mr-1" />
                      Unpaid
                    </>
                  )}
                </Button>
              </td>
              <td className="py-4 px-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tax.id)}
                  className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                  data-testid={`delete-tax-${tax.id}`}
                >
                  <Trash size={18} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}