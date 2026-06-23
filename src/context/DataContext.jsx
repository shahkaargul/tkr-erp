import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sheetsApi } from '../services/sheetsApi';
import { isConfigured, setSheetsUrl } from '../config/sheets';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState({});
  const [configured, setConfigured] = useState(isConfigured());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!isConfigured()) {
      setConfigured(false);
      setLoading(false);
      return;
    }
    setConfigured(true);
    setLoading(true);
    setError(null);
    try {
      const [p, o, e, s] = await Promise.allSettled([
        sheetsApi.getProducts(),
        sheetsApi.getOrders(),
        sheetsApi.getEmployees(),
        sheetsApi.getSettings(),
      ]);
      if (p.status === 'fulfilled') setProducts(p.value);
      if (o.status === 'fulfilled') setOrders(o.value);
      if (e.status === 'fulfilled') setEmployees(e.value);
      if (s.status === 'fulfilled') setSettings(s.value);
      if (p.status === 'rejected') setError(p.reason?.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refetch = useCallback(async (key) => {
    try {
      if (key === 'products') setProducts(await sheetsApi.getProducts());
      if (key === 'orders') setOrders(await sheetsApi.getOrders());
      if (key === 'employees') setEmployees(await sheetsApi.getEmployees());
      if (key === 'settings') {
        const s = await sheetsApi.getSettings();
        setSettings(s);
      }
    } catch (err) {
      console.error('refetch error', err);
    }
  }, []);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const addOrder = useCallback(async (orderData) => {
    const result = await sheetsApi.addOrder(orderData);
    // Deduct stock for each item sold
    await Promise.all(
      orderData.items.map((item) =>
        sheetsApi.updateStock(item.id, item.stockQuantity - item.quantity)
      )
    );
    await Promise.all([refetch('orders'), refetch('products')]);
    return result;
  }, [refetch]);

  const addProduct = useCallback(async (data) => {
    const result = await sheetsApi.addProduct(data);
    await refetch('products');
    return result;
  }, [refetch]);

  const updateProduct = useCallback(async (data) => {
    await sheetsApi.updateProduct(data);
    await refetch('products');
  }, [refetch]);

  const deleteProduct = useCallback(async (id) => {
    await sheetsApi.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const bulkUploadProducts = useCallback(async (productsList, onProgress) => {
    let successCount = 0;
    let errorCount = 0;
    for (let i = 0; i < productsList.length; i++) {
      try {
        const item = productsList[i];
        if (item.id) {
          await sheetsApi.updateProduct(item);
        } else {
          await sheetsApi.addProduct(item);
        }
        successCount++;
      } catch (err) {
        console.error('Failed to upload product', productsList[i], err);
        errorCount++;
      }
      if (onProgress) onProgress(i + 1, productsList.length);
    }
    await refetch('products');
    return { successCount, errorCount };
  }, [refetch]);

  const addEmployee = useCallback(async (data) => {
    const result = await sheetsApi.addEmployee(data);
    await refetch('employees');
    return result;
  }, [refetch]);

  const updateEmployee = useCallback(async (data) => {
    await sheetsApi.updateEmployee(data);
    await refetch('employees');
  }, [refetch]);

  const deleteEmployee = useCallback(async (id) => {
    await sheetsApi.deleteEmployee(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleAttendance = useCallback(async (id, currentStatus) => {
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    // Optimistic update
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );
    await sheetsApi.updateAttendance(id, newStatus);
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    await sheetsApi.updateSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const configureSheets = useCallback((url) => {
    setSheetsUrl(url);
    setConfigured(true);
    fetchAll();
  }, [fetchAll]);

  return (
    <DataContext.Provider
      value={{
        // Data
        products, orders, employees, settings,
        // State
        loading, error, configured,
        // Refresh
        fetchAll, refetch,
        // Mutations
        addOrder, addProduct, updateProduct, deleteProduct, bulkUploadProducts,
        addEmployee, updateEmployee, deleteEmployee,
        toggleAttendance, updateSetting, configureSheets,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
