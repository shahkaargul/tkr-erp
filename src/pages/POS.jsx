import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import { Search, Plus, Minus, Trash2, CheckCircle, Clock, ShoppingCart } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

const CATEGORIES = ['All', 'Food', 'Drink', 'Tobacco', 'Vape', 'Nicotine'];

export default function POS() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useStore();
  const { products, settings, loading, addOrder } = useData();
  const { addToast } = useToast();

  const taxRate = Number(settings?.taxRate) || 0;
  const cashierName = settings?.cashierName || 'Admin';

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // ─── Cart Calculations ───────────────────────────────────────────────────
  const subtotal = cart.reduce((s, item) => s + item.sellingPrice * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const finalTotal = afterDiscount + taxAmount;

  // ─── Checkout ────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      await addOrder({
        timestamp: new Date().toISOString(),
        cashierName,
        items: cart,
        total: finalTotal,
        discount: discountAmount,
        tax: taxAmount,
        status: 'Completed',
      });
      clearCart();
      setDiscountPercent(0);
      addToast(`Sale completed! ${formatCurrency(finalTotal)} received.`, 'success');
    } catch (err) {
      addToast(`Checkout failed: ${err.message}`, 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleHold = () => {
    if (cart.length === 0) return;
    clearCart();
    addToast('Order put on hold.', 'info');
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      {/* ── Product Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden">

        {/* Search + Filters */}
        <div className="bg-white border-b border-slate-100 px-4 pt-4 pb-3 space-y-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner size="lg" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Package className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.id === product.id);
                const outOfStock = product.stockQuantity <= 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => !outOfStock && addToCart(product)}
                    disabled={outOfStock}
                    className={`relative p-4 rounded-xl border text-left transition-all active:scale-95 flex flex-col ${
                      outOfStock
                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                        : inCart
                        ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-emerald-300 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {inCart.quantity}
                      </span>
                    )}
                    <span className="text-[11px] text-emerald-600 font-medium mb-1">{product.category}</span>
                    <span className="text-sm font-semibold text-slate-900 leading-tight mb-3">{product.name}</span>
                    <div className="mt-auto flex justify-between items-end">
                      <span className="text-[11px] text-slate-400">{product.stockQuantity} left</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(product.sellingPrice)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart ──────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-80 xl:w-96 h-[45%] lg:h-full bg-white flex flex-col flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] lg:shadow-xl lg:border-l border-slate-200">
        {/* Cart header */}
        <div className="px-4 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Current Order</span>
          </div>
          <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 p-6 space-y-2">
              <ShoppingCart className="w-14 h-14" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs text-slate-400">Tap a product to add it</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900 line-clamp-1 flex-1 pr-2">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900 flex-shrink-0">
                      {formatCurrency(item.sellingPrice * item.quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary + Checkout */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3 flex-shrink-0">
          {/* Discount */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Discount %</span>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-16 text-right px-2 py-1 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({discountPercent}%)</span>
                <span>− {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleHold}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold text-sm transition-colors disabled:opacity-40"
            >
              <Clock className="w-4 h-4" />
              Hold
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                cart.length > 0 && !checkingOut
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {checkingOut ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {checkingOut ? 'Saving…' : 'Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Used in empty state
function Package(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
