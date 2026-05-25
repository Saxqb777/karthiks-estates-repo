import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#B89D5F', '#0F172A', '#047857', '#B91C1C', '#1D4ED8', '#7C3AED', '#9F1239'];

const formatINR = (v) => `₹${(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const ChartCard = ({ title, subtitle, children, testId, action }) => (
  <div className="bg-white border border-[#E5E2DA] rounded-lg p-6 card-hover" data-testid={testId}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E2DA',
  borderRadius: '6px',
  fontSize: '12px',
  fontFamily: 'Inter, sans-serif'
};

export function PropertyGrowthChart() {
  const [data, setData] = useState([]);
  const [propertyNames, setPropertyNames] = useState([]);

  useEffect(() => {
    axios.get(`${API}/analytics/property-projections?years=5`)
      .then(r => {
        setData(r.data);
        if (r.data.length > 0) {
          const names = Object.keys(r.data[0]).filter(k => k !== 'year' && k !== 'label');
          setPropertyNames(names);
        }
      })
      .catch(e => console.error('Projection error:', e));
  }, []);

  return (
    <ChartCard
      title="Property Value Projection"
      subtitle="5-year appreciation forecast based on current annual rates"
      testId="chart-property-growth"
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DA" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {propertyNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 4, fill: COLORS[i % COLORS.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Helper: Indian Financial Year (April-March)
const getCurrentFY = () => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};
const FY_OPTIONS = [2024, 2025, 2026].filter(y => y <= getCurrentFY());
const fyLabel = (y) => `FY ${y}–${String(y + 1).slice(2)}`;

const FYDropdown = ({ value, onChange, testIdPrefix }) => (
  <Select value={String(value)} onValueChange={(v) => onChange(parseInt(v))}>
    <SelectTrigger
      className="w-[140px] h-8 text-xs border-[#E5E2DA] bg-white text-[#0F172A] focus:ring-0 focus:ring-offset-0"
      data-testid={`${testIdPrefix}-fy-dropdown`}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {FY_OPTIONS.map((y) => (
        <SelectItem key={y} value={String(y)} data-testid={`${testIdPrefix}-fy-${y}`}>
          {fyLabel(y)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const SummaryRow = ({ label, value, color, dotColor, testId }) => (
  <div className="py-3 border-b border-[#F4F4EF] last:border-0" data-testid={testId}>
    <div className="flex items-center gap-2 mb-1">
      {dotColor && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />}
      <p className="text-[11px] text-[#64748B]">{label}</p>
    </div>
    <p className="text-lg font-semibold tabular-nums" style={{ color: color || '#0F172A' }}>{value}</p>
  </div>
);

export function MonthlyFlowChart() {
  const [data, setData] = useState([]);
  const [fy, setFy] = useState(getCurrentFY());

  useEffect(() => {
    axios.get(`${API}/analytics/monthly-flow?fy=${fy}`)
      .then(r => setData(r.data))
      .catch(e => console.error('Monthly flow error:', e));
  }, [fy]);

  const totalRent = data.reduce((s, d) => s + (d.rent_collected || 0), 0);
  const totalExp = data.reduce((s, d) => s + (d.expenses || 0), 0);
  const net = totalRent - totalExp;

  return (
    <ChartCard
      title="Monthly Income vs Expenses"
      subtitle={`${fyLabel(fy)} · Apr ${String(fy).slice(2)} – Mar ${String(fy + 1).slice(2)}`}
      testId="chart-monthly-flow"
      action={<FYDropdown value={fy} onChange={setFy} testIdPrefix="monthly-flow" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-6 items-center">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DA" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
            <Bar dataKey="rent_collected" name="Rent Collected" fill="#047857" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#B91C1C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="lg:border-l lg:border-[#E5E2DA] lg:pl-5">
          <SummaryRow label="Rent Collected" value={formatINR(totalRent)} color="#047857" dotColor="#047857" testId="summary-rent" />
          <SummaryRow label="Expenses" value={formatINR(totalExp)} color="#B91C1C" dotColor="#B91C1C" testId="summary-expenses" />
          <SummaryRow label="Net" value={formatINR(net)} color={net >= 0 ? '#0F172A' : '#B91C1C'} testId="summary-net" />
        </div>
      </div>
    </ChartCard>
  );
}

export function CashFlowChart() {
  const [data, setData] = useState([]);
  const [fy, setFy] = useState(getCurrentFY());

  useEffect(() => {
    axios.get(`${API}/analytics/monthly-flow?fy=${fy}`)
      .then(r => {
        let cum = 0;
        const transformed = r.data.map(d => {
          cum += d.net;
          return { label: d.label, cumulative: cum, monthly: d.net };
        });
        setData(transformed);
      })
      .catch(e => console.error('Cashflow error:', e));
  }, [fy]);

  const incoming = data.reduce((s, d) => s + Math.max(0, d.monthly), 0);
  const outgoing = data.reduce((s, d) => s - Math.min(0, d.monthly), 0);
  const fyNet = data.length > 0 ? data[data.length - 1].cumulative : 0;

  return (
    <ChartCard
      title="Cumulative Net Profit"
      subtitle={`${fyLabel(fy)} running cash flow`}
      testId="chart-cash-flow"
      action={<FYDropdown value={fy} onChange={setFy} testIdPrefix="cash-flow" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-6 items-center">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B89D5F" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#B89D5F" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DA" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
            <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#B89D5F" strokeWidth={2.5} fill="url(#goldFill)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="lg:border-l lg:border-[#E5E2DA] lg:pl-5">
          <SummaryRow label="Incoming (+)" value={formatINR(incoming)} color="#047857" dotColor="#047857" testId="summary-incoming" />
          <SummaryRow label="Outgoing (−)" value={formatINR(outgoing)} color="#B91C1C" dotColor="#B91C1C" testId="summary-outgoing" />
          <SummaryRow label="Net (=)" value={formatINR(fyNet)} color={fyNet >= 0 ? '#0F172A' : '#B91C1C'} dotColor="#B89D5F" testId="summary-cumulative" />
        </div>
      </div>
    </ChartCard>
  );
}

export function ExpenseBreakdownChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get(`${API}/analytics/expense-breakdown`)
      .then(r => setData(r.data))
      .catch(e => console.error('Expense breakdown error:', e));
  }, []);

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <ChartCard
      title="Expense Composition"
      subtitle={`Total: ${formatINR(total)} across all categories`}
      testId="chart-expense-breakdown"
    >
      {data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-sm text-[#64748B]">
          No expenses recorded yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={(entry) => `${entry.category}`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function VacancyCard() {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    axios.get(`${API}/analytics/vacancy`)
      .then(r => setData(r.data))
      .catch(e => console.error('Vacancy error:', e));
  }, []);

  const totalVacantDays = data.reduce((s, p) => s + p.vacant_days, 0);
  const totalUnrealizedLoss = data.reduce((s, p) => s + p.unrealized_loss, 0);

  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  };

  return (
    <ChartCard
      title="Vacancy & Unrealized Loss"
      subtitle={`${totalVacantDays} total vacant days · ${formatINR(totalUnrealizedLoss)} potential rent lost`}
      testId="chart-vacancy"
    >
      <div className="space-y-4">
        {data.map((p) => {
          const ratio = p.total_owned_days > 0 ? (p.occupied_days / p.total_owned_days) * 100 : 0;
          const isOpen = expanded[p.property_id];
          const hasPeriods = Array.isArray(p.vacancy_periods) && p.vacancy_periods.length > 0;
          return (
            <div key={p.property_id} className="border border-[#E5E2DA] rounded-md p-4" data-testid={`vacancy-${p.property_id}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{p.property_name}</p>
                  <p className={`text-[10px] uppercase tracking-[0.18em] font-semibold mt-0.5 ${p.is_currently_occupied ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
                    {p.is_currently_occupied ? 'Currently Occupied' : 'Currently Vacant'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#B89D5F] tabular-nums">{p.occupancy_rate}%</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#64748B]">Occupancy</p>
                </div>
              </div>
              <div className="w-full bg-[#F4F4EF] rounded-full h-1.5 mb-3">
                <div
                  className="bg-[#B89D5F] h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Owned</p>
                  <p className="font-semibold text-[#0F172A] tabular-nums">{p.total_owned_days}d</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Occupied</p>
                  <p className="font-semibold text-[#047857] tabular-nums">{p.occupied_days}d</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Vacant</p>
                  <p className="font-semibold text-[#B91C1C] tabular-nums">{p.vacant_days}d</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Unrealized</p>
                  <p className="font-semibold text-[#B91C1C] tabular-nums">{formatINR(p.unrealized_loss)}</p>
                </div>
              </div>
              {hasPeriods && (
                <>
                  <button
                    onClick={() => setExpanded({ ...expanded, [p.property_id]: !isOpen })}
                    className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#B89D5F] hover:text-[#8E7846] transition"
                    data-testid={`vacancy-toggle-${p.property_id}`}
                  >
                    {isOpen ? '− Hide vacant periods' : `+ Show ${p.vacancy_periods.length} vacant period${p.vacancy_periods.length > 1 ? 's' : ''}`}
                  </button>
                  {isOpen && (
                    <div className="mt-3 border-t border-[#E5E2DA] pt-3 space-y-2">
                      {p.vacancy_periods.map((v, idx) => (
                        <div key={idx} className="bg-[#FEE2E2]/30 border border-[#FEE2E2] rounded p-3 text-xs" data-testid={`vacancy-period-${p.property_id}-${idx}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-semibold text-[#0F172A]">
                              {fmtDate(v.from)} <span className="text-[#64748B] mx-1">→</span> {fmtDate(v.to)}
                            </p>
                            <p className="font-semibold text-[#B91C1C] tabular-nums">{formatINR(v.loss)}</p>
                          </div>
                          <p className="text-[11px] text-[#64748B] leading-relaxed">
                            <span className="tabular-nums">{v.days} days</span>
                            {' × '}
                            <span className="tabular-nums">{formatINR(v.daily_rent)}/day</span>
                            {' '}
                            <span className="text-[#94A3B8]">
                              (₹{(v.expected_monthly_rent || 0).toLocaleString('en-IN')}/mo ÷ 30, based on {v.basis})
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {!hasPeriods && p.vacant_days === 0 && (
                <p className="text-[11px] text-[#64748B] italic">No vacancy gaps recorded — property has been fully occupied since purchase.</p>
              )}
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
