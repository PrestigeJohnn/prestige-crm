class SimpleCache {
  constructor() { this.cache = new Map(); }
  set(key, value, ttl = 3600000) { this.cache.set(key, { value, timestamp: Date.now(), ttl }); try { localStorage.setItem('cache_' + key, JSON.stringify({ value, timestamp: Date.now(), ttl })); } catch(e) {} }
  get(key) { let data = this.cache.get(key); if (!data) { try { const s = localStorage.getItem('cache_' + key); if (s) { data = JSON.parse(s); this.cache.set(key, data); } } catch(e) {} } if (!data) return null; if (data.ttl && Date.now() - data.timestamp > data.ttl) { this.delete(key); return null; } return data.value; }
  delete(key) { this.cache.delete(key); try { localStorage.removeItem('cache_' + key); } catch(e) {} }
  clear() { this.cache.clear(); try { Object.keys(localStorage).filter(k => k.startsWith('cache_')).forEach(k => localStorage.removeItem(k)); } catch(e) {} }
}
export const cache = new SimpleCache();
