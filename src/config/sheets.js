/**
 * Google Sheets / Apps Script Configuration
 *
 * The Web App URL is stored in localStorage so it can be configured
 * from the Settings page without editing source code.
 */

export const getSheetsUrl = () =>
  localStorage.getItem('tkr_sheets_url') || '';

export const setSheetsUrl = (url) =>
  localStorage.setItem('tkr_sheets_url', url.trim());

export const isConfigured = () => {
  const url = getSheetsUrl();
  return Boolean(url && url.startsWith('https://script.google.com'));
};
