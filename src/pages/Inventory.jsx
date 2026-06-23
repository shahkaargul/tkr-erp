import { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import { Search, Plus, Edit2, Trash2, X, Download, Upload } from 'lucide-react';
import { SkeletonRow } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const CATEGORIES = ['Food', 'Drink', 'Tobacco', 'Vape', 'Nicotine', 'Other'];
const EMPTY_FORM = { name: '', category: 'Food', purchasePrice: '', sellingPrice: '', stockQuantity: '', reorderLevel: '' };

export default function Inventory() {
  const { products, loading, addProduct, updateProduct, deleteProduct, bulkUploadProducts } = useData();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const filteredProducts = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [products, searchQuery]
  );

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
        reorderLevel: Number(form.reorderLevel),
      };
      if (editingProduct) {
        await updateProduct({ ...data, id: editingProduct.id });
        addToast('Product updated successfully', 'success');
      } else {
        await addProduct(data);
        addToast('Product added successfully', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(`Failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      addToast(`"${product.name}" deleted`, 'info');
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleExportCSV = () => {
    const exportData = products.map(p => ({
      id: p.id || '',
      name: p.name || '',
      category: p.category || '',
      purchasePrice: p.purchasePrice || 0,
      sellingPrice: p.sellingPrice || 0,
      stockQuantity: p.stockQuantity || 0,
      reorderLevel: p.reorderLevel || 0,
    }));
    
    if (exportData.length === 0) {
      exportData.push(EMPTY_FORM);
    }
    
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          if (!rows || rows.length === 0) {
            addToast('CSV is empty or invalid', 'error');
            setUploading(false);
            return;
          }
          
          const { successCount, errorCount } = await bulkUploadProducts(rows, (current, total) => {
            setUploadProgress(Math.round((current / total) * 100));
          });
          
          if (errorCount > 0) {
            addToast(`Import finished: ${successCount} added/updated, ${errorCount} failed`, 'warning');
          } else {
            addToast(`Import finished successfully: ${successCount} added/updated`, 'success');
          }
        } catch (err) {
          addToast(`Import failed: ${err.message}`, 'error');
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        addToast(`CSV Parse error: ${error.message}`, 'error');
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {key === 'category' ? (
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          required
          step={type === 'number' ? '1' : undefined}
          min={type === 'number' ? '0' : undefined}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          {...opts}
        />
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} products total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={handleExportCSV}
            disabled={uploading}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{uploading ? `${uploadProgress}%` : 'Import CSV'}</span>
          </button>
          <button
            onClick={openAdd}
            disabled={uploading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 shadow-sm shadow-emerald-200 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="px-5 py-4 border-b border-slate-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-right">Stock</th>
                <th className="px-6 py-3 text-right">Purchase</th>
                <th className="px-6 py-3 text-right">Selling</th>
                <th className="px-6 py-3 text-right">Margin</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const margin = product.purchasePrice > 0
                    ? (((product.sellingPrice - product.purchasePrice) / product.purchasePrice) * 100).toFixed(1)
                    : '—';
                  const lowStock = product.stockQuantity <= product.reorderLevel;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold text-sm ${lowStock ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-lg' : 'text-slate-900'}`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(product.purchasePrice)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(product.sellingPrice)}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">{margin}%</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    {searchQuery ? `No products matching "${searchQuery}"` : 'No products yet. Add your first product!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">{field('Product Name', 'name', 'text', { placeholder: 'e.g. Chicken Biryani' })}</div>
            <div className="col-span-2 sm:col-span-1">{field('Category', 'category')}</div>
            <div className="sm:col-span-1">{field('Purchase Price (PKR)', 'purchasePrice', 'number', { placeholder: '0' })}</div>
            <div>{field('Selling Price (PKR)', 'sellingPrice', 'number', { placeholder: '0' })}</div>
            <div>{field('Stock Quantity', 'stockQuantity', 'number', { placeholder: '0' })}</div>
            <div>{field('Reorder Level', 'reorderLevel', 'number', { placeholder: '5' })}</div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50 active:scale-95"
            >
              {saving ? 'Saving…' : editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
