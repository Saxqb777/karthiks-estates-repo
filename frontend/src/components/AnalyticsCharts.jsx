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

const ChartCard = ({ title, subtitle, children, testId }) => (
  <div className="bg-white border border-[#E5E2DA] rounded-lg p-6 card-hover" data-testid={testId}>
    <div className="mb-4">
      <h3 className="text-base font-semibold text-[#0F172A] tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>}
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

export function MonthlyFlowChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get(`${API}/analytics/monthly-flow?months=12`)
      .then(r => setData(r.data))
      .catch(e => console.error('Monthly flow error:', e));
  }, []);

  return (
    <ChartCard
      title="Monthly Income vs Expenses"
      subtitle="Last 12 months of cash flow activity"
      testId="chart-monthly-flow"
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DA" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="rent_collected" name="Rent Collected" fill="#047857" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#B91C1C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CashFlowChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get(`${API}/analytics/monthly-flow?months=12`)
      .then(r => {
        let cum = 0;
        const transformed = r.data.map(d => {
          cum += d.net;
          return { label: d.label, cumulative: cum, monthly: d.net };
        });
        setData(transformed);
      })
      .catch(e => console.error('Cashflow error:', e));
  }, []);

  return (
    <ChartCard
      title="Cumulative Net Profit"
      subtitle="Running cash flow over the last 12 months"
      testId="chart-cash-flow"
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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

  useEffect(() => {
    axios.get(`${API}/analytics/vacancy`)
      .then(r => setData(r.data))
      .catch(e => console.error('Vacancy error:', e));
  }, []);

  const totalVacantDays = data.reduce((s, p) => s + p.vacant_days, 0);
  const totalUnrealizedLoss = data.reduce((s, p) => s + p.unrealized_loss, 0);

  return (
    <ChartCard
      title="Vacancy & Unrealized Loss"
      subtitle={`${totalVacantDays} total vacant days · ${formatINR(totalUnrealizedLoss)} potential rent lost`}
      testId="chart-vacancy"
    >
      <div className="space-y-4">
        {data.map((p) => {
          const ratio = p.total_owned_days > 0 ? (p.occupied_days / p.total_owned_days) * 100 : 0;
          return (
            <div key={p.property_id} className="border border-[#E5E2DA] rounded-md p-4" data-testid={`vacancy-${p.property_id}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{p.property_name}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#64748B] mt-0.5">
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
              <div className="grid grid-cols-4 gap-2 text-xs">
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
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
