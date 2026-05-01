import { initStorage } from '../storage/storage.js';

const storage = initStorage();

const SERVER_KEY = 'server_url';

export function getServerUrl() {
  const saved = storage.get(SERVER_KEY);
  if (saved) return saved.replace(/\/+$/, '');

  if (typeof window.__TAURI__ !== 'undefined' || window.__TAURI_INTERNALS__) {
    return '';
  }

  return '';
}

export function setServerUrl(url) {
  const cleaned = url ? url.replace(/\/+$/, '') : '';
  storage.set(SERVER_KEY, cleaned);
}

export function isServerConfigured() {
  const url = getServerUrl();
  if (url) return true;
  if (typeof window.__TAURI__ !== 'undefined' || window.__TAURI_INTERNALS__) return false;
  return true;
}

export function isTauri() {
  return typeof window.__TAURI__ !== 'undefined' || !!window.__TAURI_INTERNALS__;
}

export async function api(path, options = {}) {
  const base = getServerUrl();
  const url = base ? `${base}${path}` : path;

  const token = storage.get('auth_token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  return res.json();
}
