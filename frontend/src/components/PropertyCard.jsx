import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { MapPin, Calendar, TrendUp, PencilSimple, Trash, House } from '@phosphor-icons/react';
import { Button } from './ui/button';
import ConfirmDialog from './ConfirmDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PropertyCard({ property, onRefresh, onEdit }) {
  const [showDelete, setShowDelete] = useState(false);

  const calculateCurrentValue = () => {
    const purchaseDate = new Date(property.purchase_date);
    const now = new Date();
    const yearsHeld = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25);
    const appreciationRate = property.appreciation_rate / 100;
    return property.purchase_price * Math.pow(1 + appreciationRate, yearsHeld);
  };

  const currentValue = calculateCurrentValue();
  const appreciation = currentValue - property.purchase_price;
  const appreciationPercent = (appreciation / property.purchase_price) * 100;

  const performDelete = async () => {
    try {
      await axios.delete(`${API}/properties/${property.id}`);
      toast.success('Property deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  return (
    <div
      className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-[#D1CBBF] transition-all duration-200"
      data-testid={`property-card-${property.id}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#2C4C3B]/10 rounded-lg">
              <House size={28} className="text-[#2C4C3B]" weight="duotone" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#2C4C3B]">{property.name}</h3>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Townhouse</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(property)}
              className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
              data-testid={`edit-property-${property.id}`}
            >
              <PencilSimple size={18} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDelete(true)}
              className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
              data-testid={`delete-property-${property.id}`}
            >
              <Trash size={18} />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-[#7D7D7D]">
            <MapPin size={16} className="mr-2" />
            {property.address}
          </div>
          <div className="flex items-center text-sm text-[#7D7D7D]">
            <Calendar size={16} className="mr-2" />
            Purchased: {new Date(property.purchase_date).toLocaleDateString('en-IN')}
          </div>
        </div>

        <div className="border-t border-[#E6E2D8] pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Purchase Price
            </span>
            <span className="text-base font-semibold text-[#2E2E2E]">
              ₹{property.purchase_price.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Current Value
            </span>
            <span className="text-base font-semibold text-[#2C4C3B]">
              ₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Appreciation
            </span>
            <div className="flex items-center text-[#7BA38A]">
              <TrendUp size={16} className="mr-1" />
              <span className="text-base font-semibold">
                ₹{appreciation.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({appreciationPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Annual Rate
            </span>
            <span className="text-base font-semibold text-[#2E2E2E]">
              {property.appreciation_rate}%
            </span>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete "${property.name}"?`}
        description="This will permanently remove the property and all associated records. This action cannot be undone."
        confirmLabel="Yes, Delete Property"
        onConfirm={performDelete}
        testId={`confirm-delete-property-${property.id}`}
      />
    </div>
  );
}
