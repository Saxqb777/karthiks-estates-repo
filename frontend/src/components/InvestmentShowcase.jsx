import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendUp, Sparkle } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatINR = (v) => `₹${(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const formatLakhs = (v) => {
  if (!v) return '₹0';
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
};

export default function InvestmentShowcase() {
  const [properties, setProperties] = useState([]);
  const [rentalIncome, setRentalIncome] = useState(0);

  useEffect(() => {
    axios.get(`${API}/properties`)
      .then(r => setProperties(r.data))
      .catch(e => console.error('Showcase load error:', e));
    axios.get(`${API}/dashboard/stats`)
      .then(r => setRentalIncome(r.data?.total_rental_income || 0))
      .catch(e => console.error('Stats load error:', e));
  }, []);

  const withOffers = properties.filter(p => (p.highest_offer || 0) > 0);
  if (withOffers.length === 0) {
    return null;
  }

  const totalInvested = properties.reduce((s, p) => s + (p.purchase_price || 0), 0);
  const totalBestOffer = properties.reduce((s, p) => s + (p.highest_offer || 0), 0);
  const totalGain = totalBestOffer - totalInvested;
  const totalReturn = totalGain + rentalIncome;
  const multiplier = totalInvested > 0 ? (totalBestOffer + rentalIncome) / totalInvested : 0;
  const roiPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Compute average years held
  const yearsHeldList = properties
    .map(p => {
      try {
        const d = new Date(p.purchase_date);
        return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      } catch { return null; }
    })
    .filter(Boolean);
  const avgYears = yearsHeldList.length > 0 ? yearsHeldList.reduce((a, b) => a + b, 0) / yearsHeldList.length : 0;
  // CAGR = (FV/PV)^(1/n) - 1 — using total return (capital + rental)
  const cagr = (avgYears > 0 && totalInvested > 0)
    ? (Math.pow((totalBestOffer + rentalIncome) / totalInvested, 1 / avgYears) - 1) * 100
    : 0;

  return (
    <div
      className="relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-lg overflow-hidden border border-[#B89D5F]/30"
      data-testid="investment-showcase"
    >
      {/* Gold accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B89D5F] to-transparent" />

      <div className="p-8 lg:p-10">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkle size={18} className="text-[#B89D5F]" weight="fill" />
          <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#B89D5F]">
            Investment Performance
          </span>
        </div>

        {/* Hero: massive multiplier + gain */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-12 items-center mb-10">
          <div className="text-center lg:text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#94A3B8] mb-2">
              Capital Multiplier
            </p>
            <p
              className="text-7xl lg:text-8xl font-bold text-[#B89D5F] tabular-nums leading-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              data-testid="showcase-multiplier"
            >
              {multiplier.toFixed(1)}<span className="text-5xl lg:text-6xl">×</span>
            </p>
            <p className="text-xs text-[#CBD5E1] mt-2 tracking-wide">
              +{roiPct.toFixed(0)}% on original investment
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 lg:border-l lg:border-white/10 lg:pl-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#94A3B8] mb-2">
                Originally Invested
              </p>
              <p className="text-2xl lg:text-3xl font-semibold tabular-nums text-white" data-testid="showcase-invested">
                {formatLakhs(totalInvested)}
              </p>
              <p className="text-[11px] text-[#64748B] mt-1">{formatINR(totalInvested)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#94A3B8] mb-2">
                Best Offer Received
              </p>
              <p className="text-2xl lg:text-3xl font-semibold tabular-nums text-[#B89D5F]" data-testid="showcase-offer">
                {formatLakhs(totalBestOffer)}
              </p>
              <p className="text-[11px] text-[#64748B] mt-1">+{formatLakhs(totalGain)} gain</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#94A3B8] mb-2">
                Rental Income Earned
              </p>
              <p className="text-2xl lg:text-3xl font-semibold tabular-nums text-[#10B981]" data-testid="showcase-rental">
                {formatLakhs(rentalIncome)}
              </p>
              <p className="text-[11px] text-[#64748B] mt-1">while holding the property</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#94A3B8] mb-2">
                Total Return
              </p>
              <p className="text-2xl lg:text-3xl font-semibold tabular-nums text-[#10B981]" data-testid="showcase-total-return">
                +{formatLakhs(totalReturn)}
              </p>
              <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
                <TrendUp size={11} className="text-[#10B981]" /> {cagr.toFixed(1)}% CAGR
              </p>
            </div>
          </div>
        </div>

        {/* Comparison bar visual */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#94A3B8] mb-3">
            Value Growth Visualisation
          </p>

          <div className="space-y-4">
            {/* Invested bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#CBD5E1] tracking-wider">INVESTED</span>
                <span className="text-xs font-semibold text-white tabular-nums">{formatLakhs(totalInvested)}</span>
              </div>
              <div className="w-full bg-white/5 rounded-sm h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#64748B] to-[#94A3B8] transition-all duration-1000"
                  style={{ width: `${(totalInvested / Math.max(totalBestOffer + rentalIncome, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Offer bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#B89D5F] tracking-wider">CURRENT BEST OFFER</span>
                <span className="text-xs font-semibold text-[#B89D5F] tabular-nums">{formatLakhs(totalBestOffer)}</span>
              </div>
              <div className="w-full bg-white/5 rounded-sm h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#B89D5F] to-[#E0C988] transition-all duration-1000"
                  style={{ width: `${(totalBestOffer / Math.max(totalBestOffer + rentalIncome, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Offer + Rental (Total Realisable) bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#10B981] tracking-wider">OFFER + RENTAL EARNED</span>
                <span className="text-xs font-semibold text-[#10B981] tabular-nums">{formatLakhs(totalBestOffer + rentalIncome)}</span>
              </div>
              <div className="w-full bg-white/5 rounded-sm h-3 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-[#B89D5F] to-[#E0C988] transition-all duration-1000"
                  style={{ width: `${(totalBestOffer / Math.max(totalBestOffer + rentalIncome, 1)) * 100}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-1000"
                  style={{ width: `${(rentalIncome / Math.max(totalBestOffer + rentalIncome, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] mt-3 italic">
            Held for ~{avgYears.toFixed(1)} {avgYears < 1.1 ? 'year' : 'years'} · gold = capital appreciation, green = cumulative rental income
          </p>
        </div>

        {/* Per-property breakdown */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#94A3B8] mb-3">
            Per-Property Breakdown
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {properties.map((p) => {
              const off = p.highest_offer || 0;
              const gain = off - (p.purchase_price || 0);
              const mult = p.purchase_price > 0 ? off / p.purchase_price : 0;
              return (
                <div
                  key={p.id}
                  className="bg-white/[0.04] border border-white/10 rounded-md p-4 hover:bg-white/[0.07] transition"
                  data-testid={`showcase-prop-${p.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white tracking-tight">{p.name}</p>
                    {off > 0 && (
                      <span className="text-xs font-bold text-[#B89D5F] tabular-nums">{mult.toFixed(1)}×</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#64748B]">Paid</p>
                      <p className="font-semibold text-white tabular-nums">{formatLakhs(p.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#64748B]">Offer</p>
                      <p className="font-semibold text-[#B89D5F] tabular-nums">{off > 0 ? formatLakhs(off) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[#64748B]">Gain</p>
                      <p className={`font-semibold tabular-nums ${gain > 0 ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                        {gain > 0 ? `+${formatLakhs(gain)}` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
