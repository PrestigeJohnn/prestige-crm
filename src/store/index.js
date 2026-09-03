import { create } from 'zustand';

// ── Auth Store ────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  loading: false,
  error: null,

  setUser: (user) => set({ user, error: null }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  setRefreshToken: (refreshToken) => {
    localStorage.setItem('refresh_token', refreshToken);
    set({ refreshToken });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  login: (data) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    set({ 
      user: data.user, 
      token: data.accessToken, 
      refreshToken: data.refreshToken,
      error: null 
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null, refreshToken: null, error: null });
  },

  isAuthenticated: () => !!get().token,
}));

// ── UI Store ──────────────────────────────────────────────
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  theme: localStorage.getItem('theme') || 'light',
  notifications: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  addNotification: (notification) =>
    set((s) => ({ notifications: [...s.notifications, { id: Date.now(), ...notification }] })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
}));

// ── Data Store (cache for list pages) ─────────────────────
export const useDataStore = create((set, get) => ({
  accounts: [],
  contacts: [],
  leads: [],
  opportunities: [],
  activities: [],
  tasks: [],
  quotes: [],
  orders: [],
  products: [],
  cases: [],
  documents: [],
  lastFetch: {},

  setAccounts: (accounts) => set({ accounts, lastFetch: { ...get().lastFetch, accounts: Date.now() } }),
  setContacts: (contacts) => set({ contacts, lastFetch: { ...get().lastFetch, contacts: Date.now() } }),
  setLeads: (leads) => set({ leads, lastFetch: { ...get().lastFetch, leads: Date.now() } }),
  setOpportunities: (opportunities) => set({ opportunities, lastFetch: { ...get().lastFetch, opportunities: Date.now() } }),
  setActivities: (activities) => set({ activities, lastFetch: { ...get().lastFetch, activities: Date.now() } }),
  setTasks: (tasks) => set({ tasks, lastFetch: { ...get().lastFetch, tasks: Date.now() } }),
  setQuotes: (quotes) => set({ quotes, lastFetch: { ...get().lastFetch, quotes: Date.now() } }),
  setOrders: (orders) => set({ orders, lastFetch: { ...get().lastFetch, orders: Date.now() } }),
  setProducts: (products) => set({ products, lastFetch: { ...get().lastFetch, products: Date.now() } }),
  setCases: (cases) => set({ cases, lastFetch: { ...get().lastFetch, cases: Date.now() } }),
  setDocuments: (documents) => set({ documents, lastFetch: { ...get().lastFetch, documents: Date.now() } }),

  // Check if data is stale (older than 5 minutes)
  isStale: (key) => {
    const lastFetch = get().lastFetch[key];
    return !lastFetch || Date.now() - lastFetch > 5 * 60 * 1000;
  },

  // Clear all cached data
  clearCache: () => set({
    accounts: [], contacts: [], leads: [], opportunities: [],
    activities: [], tasks: [], quotes: [], orders: [],
    products: [], cases: [], documents: [], lastFetch: {},
  }),
}));
