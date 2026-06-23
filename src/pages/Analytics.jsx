import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/format';
import Spinner from '../components/ui/Spinner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getLastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return { date: d, label: DAYS[d.getDay()] };
  });
}

function getLastNMonths(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1 - i));
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTHS_SHORT[d.getMonth()] };
  });
}

function isSameDay(dateStr, target) {
  const d = new Date(dateStr);
  return d.toDateString() === target.toDateString();
}

export default function Analytics() {
  const { orders, loading } = useData();

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'Completed'),
    [orders]
  );

  // Weekly sales (last 7 days)
  const weeklyData = useMemo(() => {
    return getLastNDays(7).map(({ date, label }) => ({
      day: label,
      sales: completedOrders
        .filter((o) => isSameDay(o.timestamp, date))
        .reduce((s, o) => s + o.total, 0),
    }));
  }, [completedOrders]);

  // Monthly revenue (last 6 months)
  const monthlyData = useMemo(() => {
    return getLastNMonths(6).map(({ year, month, label }) => ({
      name: label,
      revenue: completedOrders
        .filter((o) => {
          const d = new Date(o.timestamp);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((s, o) => s + o.total, 0),
    }));
  }, [completedOrders]);

  // Category breakdown (from items)
  const categoryData = useMemo(() => {
    const map = {};
    completedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const cat = item.category || 'Other';
        const value = (item.sellingPrice || 0) * (item.quantity || 1);
        map[cat] = (map[cat] || 0) + value;
      });
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [completedOrders]);

  // Top products (by quantity sold)
  const topProducts = useMemo(() => {
    const map = {};
    completedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.name || 'Unknown';
        map[name] = (map[name] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 7);
  }, [completedOrders]);

  const tooltipStyle = {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    fontSize: 13,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const noData = completedOrders.length === 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Business Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Based on {completedOrders.length} completed order{completedOrders.length !== 1 ? 's' : ''} from Google Sheets
        </p>
      </div>

      {noData ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No data yet</h3>
          <p className="text-slate-400 text-sm">Complete some orders via POS to see analytics here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Sales */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-5">Daily Sales — Last 7 Days</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `Rs ${v / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Sales']} />
                  <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-5">Revenue by Category</h3>
            {categoryData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No item data yet</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Revenue']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-5">Monthly Revenue — Last 6 Months</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `Rs ${v / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-5">Top Products by Qty Sold</h3>
            {topProducts.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No item data yet</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={110} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Units Sold']} />
                    <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
