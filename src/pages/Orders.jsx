import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/format';
import { Search, Filter, Eye } from 'lucide-react';
import { SkeletonRow } from '../components/ui/Spinner';

const STATUS_COLORS = {
  Completed: 'bg-emerald-100 text-emerald-700',
  Pending:   'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const { orders, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    const sorted = [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return sorted.filter((o) => {
      const matchSearch = o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.cashierName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalRevenue = useMemo(
    () => filtered.filter((o) => o.status === 'Completed').reduce((s, o) => s + o.total, 0),
    [filtered]
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} records · Total revenue: {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-slate-50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Order ID or cashier…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Date & Time</th>
                <th className="px-6 py-3 text-left">Cashier</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : filtered.length > 0 ? (
                filtered.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-medium text-slate-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="leading-tight">
                          <div>{new Date(order.timestamp).toLocaleDateString('en-PK')}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(order.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{order.cashierName}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs max-w-[180px] truncate">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`} className="bg-emerald-50/50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <p className="font-semibold text-slate-700 mb-2">Order Breakdown</p>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-slate-600 max-w-md">
                                <span>{item.quantity}× {item.name}</span>
                                <span>{formatCurrency((item.sellingPrice || 0) * item.quantity)}</span>
                              </div>
                            ))}
                            {order.discount > 0 && (
                              <div className="flex justify-between text-emerald-600 max-w-md pt-1 border-t border-emerald-100">
                                <span>Discount</span>
                                <span>− {formatCurrency(order.discount)}</span>
                              </div>
                            )}
                            {order.tax > 0 && (
                              <div className="flex justify-between text-slate-500 max-w-md">
                                <span>Tax</span>
                                <span>{formatCurrency(order.tax)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No orders found.
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
