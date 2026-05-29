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
      console.error(error);
      toast.error('Failed to delete property');
    }
  };

  return (
    <div
      className="bg-white border border-[#E5E2DA] rounded-lg card-hover"
      data-testid={`property-card-${property.id}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0F172A] rounded-md flex items-center justify-center">
              <House size={20} className="text-[#B89D5F]" weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">{property.name}</h3>
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">Townhouse</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(property)}
              className="h-8 w-8 p-0 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4EF]"
              data-testid={`edit-property-${property.id}`}
            >
              <PencilSimple size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDelete(true)}
              className="h-8 w-8 p-0 text-[#B91C1C] hover:text-[#7F1D1D] hover:bg-[#FEE2E2]"
              data-testid={`delete-property-${property.id}`}
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 mb-5">
          <div className="flex items-center text-xs text-[#64748B]">
            <MapPin size={14} className="mr-1.5" />
            {property.address}
          </div>
          <div className="flex items-center text-xs text-[#64748B]">
            <Calendar size={14} className="mr-1.5" />
            Purchased {new Date(property.purchase_date).toLocaleDateString('en-IN')}
          </div>
          {property.consumer_number && (
            <div className="flex items-center text-xs text-[#64748B] pt-1">
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#94A3B8] mr-2">TNPDCL</span>
              <span className="font-mono text-[#0F172A] tabular-nums">{property.consumer_number}</span>
              <a
                href="https://www.tnebnet.org/qwp/qpay"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-[10px] uppercase tracking-[0.15em] font-bold text-[#B89D5F] hover:text-[#9A7F47] hover:underline"
              >
                Pay Bill
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-[#E5E2DA] pt-4 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">Purchase Price</span>
            <span className="text-sm font-semibold text-[#0F172A] tabular-nums">
              ₹{property.purchase_price.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">Current Value</span>
            <span className="text-base font-semibold text-[#0F172A] tabular-nums">
              ₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">Appreciation</span>
            <div className="flex items-center text-[#047857]">
              <TrendUp size={14} className="mr-1" />
              <span className="text-sm font-semibold tabular-nums">
                ₹{appreciation.toLocaleString('en-IN', { maximumFractionDigits: 0 })} · {appreciationPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">Annual Rate</span>
            <span className="text-sm font-semibold text-[#B89D5F] tabular-nums">
              {property.appreciation_rate}%
            </span>
          </div>
          {property.highest_offer > 0 && (
            <div className="mt-2 pt-3 border-t border-dashed border-[#E5E2DA]">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#B89D5F]">Highest Offer Received</span>
                <span className="text-base font-semibold text-[#0F172A] tabular-nums">
                  ₹{property.highest_offer.toLocaleString('en-IN')}
                </span>
              </div>
              {(() => {
                const delta = property.highest_offer - currentValue;
                const isAbove = delta >= 0;
                return (
                  <p className="text-[11px] text-[#64748B]">
                    {isAbove ? (
                      <span className="text-[#047857] font-medium">
                        ₹{Math.abs(delta).toLocaleString('en-IN', { maximumFractionDigits: 0 })} above calculated value
                      </span>
                    ) : (
                      <span className="text-[#B91C1C] font-medium">
                        ₹{Math.abs(delta).toLocaleString('en-IN', { maximumFractionDigits: 0 })} below calculated value
                      </span>
                    )}
                    {property.highest_offer_date && (
                      <> · {new Date(property.highest_offer_date).toLocaleDateString('en-IN')}</>
                    )}
                  </p>
                );
              })()}
              {property.highest_offer_notes && (
                <p className="text-[11px] text-[#94A3B8] italic mt-1">"{property.highest_offer_notes}"</p>
              )}
            </div>
          )}
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
