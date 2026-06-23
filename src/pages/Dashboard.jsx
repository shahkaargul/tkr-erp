import { useMemo } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../utils/format';
import { useData } from '../context/DataContext';
import { SkeletonCard, SkeletonRow } from '../components/ui/Spinner';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getLastNMonths(n) {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString('en', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, loading }) {
  if (loading) return <SkeletonCard />;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow animate-fade-up">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { orders, products, loading } = useData();

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => isToday(o.timestamp) && o.status !== 'Cancelled');
    const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
    const totalOrders = todayOrders.length;

    // Estimate profit: for each item sold, look up purchasePrice from products
    let profit = 0;
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          profit += (product.sellingPrice - product.purchasePrice) * item.quantity;
        } else {
          profit += (item.sellingPrice || 0) * item.quantity * 0.3;
        }
      });
    });

    return { todaySales, totalOrders, profitEstimate: profit };
  }, [orders, products]);

  const monthlyRevenue = useMemo(() => {
    const months = getLastNMonths(6);
    return months.map(({ label, year, month }) => {
      const revenue = orders
        .filter((o) => {
          const d = new Date(o.timestamp);
          return d.getFullYear() === year && d.getMonth() === month && o.status !== 'Cancelled';
        })
        .reduce((s, o) => s + o.total, 0);
      return { name: label, revenue };
    });
  }, [orders]);

  const lowStock = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.reorderLevel),
    [products]
  );

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8),
    [orders]
  );

  const statusColors = {
    Completed: 'bg-emerald-100 text-emerald-700',
    Pending:   'bg-amber-100 text-amber-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Good morning! 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-100 rounded-xl px-3 py-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Live from Google Sheets</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-600"
          loading={loading}
        />
        <StatCard
          label="Orders Today"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-100 text-blue-600"
          loading={loading}
        />
        <StatCard
          label="Est. Profit Today"
          value={formatCurrency(stats.profitEstimate)}
          icon={TrendingUp}
          color="bg-purple-100 text-purple-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:col-span-2 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-5">Revenue Trend — Last 6 Months</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `Rs ${v / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
                    formatter={(v) => [formatCurrency(v), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-semibold">Low Stock Alerts</h3>
            {lowStock.length > 0 && (
              <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {lowStock.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : lowStock.length > 0 ? (
              lowStock.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{item.stockQuantity} left</p>
                    <p className="text-xs text-red-400">Min: {item.reorderLevel}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm">All stock levels OK</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="text-base font-semibold text-slate-900">Live Order Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Cashier</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs font-medium text-slate-900">#{order.id}</td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(order.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-6 py-3.5">{order.cashierName}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-900">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No orders today yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
