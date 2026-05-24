import React from 'react';
import { MapPin, Calendar, TrendUp } from '@phosphor-icons/react';

export default function PropertyCard({ property, onRefresh }) {
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

  return (
    <div
      className="bg-white border border-[#E6E2D8] rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-[#D1CBBF] transition-all duration-200"
      data-testid={`property-card-${property.id}`}
    >
      <img
        src={property.image_url}
        alt={property.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-[#2C4C3B] mb-2">{property.name}</h3>
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
    </div>
  );
}