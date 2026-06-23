import { useState } from 'react';
import { Save, Database, Link2, CheckCircle, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { setSheetsUrl, getSheetsUrl, isConfigured } from '../config/sheets';

export default function Settings() {
  const { settings, updateSetting, configureSheets, fetchAll } = useData();
  const { addToast } = useToast();

  // Google Sheets URL (stored in localStorage)
  const [sheetsUrl, setSheetsUrlLocal] = useState(getSheetsUrl());
  const [savingUrl, setSavingUrl] = useState(false);

  // App settings (stored in Google Sheet)
  const [restaurantName, setRestaurantName] = useState(settings?.restaurantName || 'Tahir Khan Restaurant');
  const [currency, setCurrency] = useState(settings?.currency || 'PKR');
  const [taxRate, setTaxRate] = useState(settings?.taxRate ?? 0);
  const [pin, setPin] = useState(settings?.pin || '1234');
  const [cashierName, setCashierName] = useState(settings?.cashierName || 'Admin');
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveUrl = async () => {
    setSavingUrl(true);
    try {
      configureSheets(sheetsUrl);
      await fetchAll();
      addToast('Google Sheets connected successfully!', 'success');
    } catch (err) {
      addToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        updateSetting('restaurantName', restaurantName),
        updateSetting('currency', currency),
        updateSetting('taxRate', Number(taxRate)),
        updateSetting('pin', String(pin)),
        updateSetting('cashierName', cashierName),
      ]);
      addToast('Settings saved to Google Sheets!', 'success');
    } catch (err) {
      addToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const configured = isConfigured();

  const inputClass = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5';

  return (
    <div className="p-6 max-w-3xl space-y-8">
      {/* ── Google Sheets Connection ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
            <Database className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Google Sheets Backend</h3>
            <p className="text-xs text-slate-500 mt-0.5">Connect your Apps Script Web App URL to enable live data</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {configured ? (
              <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">Connected</span></>
            ) : (
              <><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-xs text-amber-600 font-medium">Not configured</span></>
            )}
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelClass}>Apps Script Web App URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrlLocal(e.target.value)}
                  placeholder="https://script.google.com/macros/s/…/exec"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <button
                onClick={handleSaveUrl}
                disabled={savingUrl || !sheetsUrl}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 active:scale-95 flex-shrink-0"
              >
                {savingUrl ? 'Connecting…' : 'Connect'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Don't have a URL yet? Follow the setup guide to deploy your Google Apps Script.
            </p>
          </div>
        </div>
      </div>

      {/* ── App Settings ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h3 className="font-semibold text-slate-900 text-sm">General Settings</h3>
          <p className="text-xs text-slate-500 mt-0.5">Saved to the Settings tab in your Google Sheet</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Restaurant Name</label>
              <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Default Cashier Name</label>
              <input value={cashierName} onChange={(e) => setCashierName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                <option value="PKR">PKR (₨)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Default Tax Rate (%)</label>
              <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Login PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={8}
                className={`${inputClass} tracking-widest`}
                placeholder="Enter new PIN"
              />
              <p className="text-xs text-slate-400 mt-1">Min 4 characters. Stored in your Google Sheet's Settings tab.</p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings || !configured}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-40 active:scale-95"
          >
            <Save className="w-4 h-4" />
            {savingSettings ? 'Saving…' : 'Save Settings'}
          </button>
          {!configured && (
            <p className="text-xs text-amber-600">⚠ Connect Google Sheets first to save settings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
