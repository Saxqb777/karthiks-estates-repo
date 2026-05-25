import React from 'react';

export default function StatsCard({ icon, label, value, trend, color, testId, accent, subValue }) {
  return (
    <div
      className="bg-white border border-[#E5E2DA] rounded-lg p-6 card-hover"
      data-testid={testId}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">
          {label}
        </p>
        {icon && (
          <div className="text-[#94A3B8]">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-[#0F172A] tabular-nums" style={accent ? { color } : {}}>
        {value}
      </p>
      {subValue && (
        <p className="text-[11px] text-[#64748B] mt-1 tabular-nums">
          {subValue}
        </p>
      )}
      {trend && (
        <p className="text-xs text-[#64748B] mt-2">
          {trend}
        </p>
      )}
    </div>
  );
}
