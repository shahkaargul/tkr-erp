import { getSheetsUrl, isConfigured } from '../config/sheets';

/** GET helper — used for all read operations */
async function get(sheet) {
  if (!isConfigured()) throw new Error('SHEETS_NOT_CONFIGURED');
  const url = new URL(getSheetsUrl());
  url.searchParams.set('action', 'get');
  url.searchParams.set('sheet', sheet);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}

/** POST helper — used for all write operations (text/plain avoids CORS preflight) */
async function post(action, payload = {}) {
  if (!isConfigured()) throw new Error('SHEETS_NOT_CONFIGURED');
  const res = await fetch(getSheetsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}

// ─── Normalizers ────────────────────────────────────────────────────────────

function normalizeProduct(p) {
  return {
    ...p,
    purchasePrice: Number(p.purchasePrice) || 0,
    sellingPrice: Number(p.sellingPrice) || 0,
    stockQuantity: Number(p.stockQuantity) || 0,
    reorderLevel: Number(p.reorderLevel) || 0,
  };
}

function normalizeOrder(o) {
  let items = o.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  return {
    ...o,
    items: Array.isArray(items) ? items : [],
    total: Number(o.total) || 0,
    discount: Number(o.discount) || 0,
    tax: Number(o.tax) || 0,
  };
}

function normalizeEmployee(e) {
  return { ...e, salary: Number(e.salary) || 0 };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const sheetsApi = {
  isConfigured,

  // ── Reads ──
  getProducts: async () => (await get('Products')).map(normalizeProduct),
  getOrders: async () => (await get('Orders')).map(normalizeOrder),
  getEmployees: async () => (await get('Employees')).map(normalizeEmployee),
  getSettings: async () => {
    const rows = await get('Settings');
    const obj = {};
    rows.forEach((r) => { obj[r.key] = r.value; });
    return obj;
  },

  // ── Order writes ──
  addOrder: (data) => post('addOrder', { data }),

  // ── Stock writes ──
  updateStock: (id, qty) => post('updateStock', { id, qty }),

  // ── Product writes ──
  addProduct: (data) => post('addProduct', { data }),
  updateProduct: (data) => post('updateProduct', { data }),
  deleteProduct: (id) => post('deleteProduct', { id }),

  // ── Employee writes ──
  addEmployee: (data) => post('addEmployee', { data }),
  updateEmployee: (data) => post('updateEmployee', { data }),
  deleteEmployee: (id) => post('deleteEmployee', { id }),
  updateAttendance: (id, status) => post('updateAttendance', { id, status }),

  // ── Settings writes ──
  updateSetting: (key, value) => post('updateSettings', { key, value }),
};
