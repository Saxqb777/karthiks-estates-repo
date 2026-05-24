import React from 'react';

export default function StatsCard({ icon, label, value, trend, color, testId }) {
  return (
    <div
      className="bg-white border border-[#E6E2D8] rounded-lg p-6 hover:-translate-y-1 hover:shadow-lg hover:border-[#D1CBBF] transition-all duration-200"
      data-testid={testId}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D] mb-3">
            {label}
          </p>
          <p className="text-2xl font-semibold text-[#2E2E2E] mb-2">{value}</p>
          {trend && (
            <p className="text-sm" style={{ color }}>
              {trend}
            </p>
          )}
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}