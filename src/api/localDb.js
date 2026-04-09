import pane2Doors from '@/assets/templates/2-pane-doors.jpg';
import pane2Lg from '@/assets/templates/2-pane-lg.jpg';
import pane2Sm from '@/assets/templates/2-pane-sm.jpg';
import pane7 from '@/assets/templates/7-pane.jpg';
import singlePaneLg from '@/assets/templates/single-pane-lg.jpg';
import trianglePane from '@/assets/templates/triangle-pane.jpg';
import wide5Pane from '@/assets/templates/wide-5-pane.jpg';
import halfMoonPane from '@/assets/templates/half-moon-pane.jpg';

const STORAGE_KEY = 'windowcleaner:db:v1';
const TEMPLATE_SEED_KEY = 'windowcleaner:seeded-templates';

const defaultStore = {
  Customer: [],
  Quote: [],
  WindowTemplate: []
};

const memoryStore = { ...defaultStore };

const loadStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultStore };
    const parsed = JSON.parse(raw);
    return { ...defaultStore, ...parsed };
  } catch {
    return { ...defaultStore };
  }
};

const saveStore = (store) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage errors
  }
};

const getStore = () => {
  if (typeof localStorage === 'undefined') return memoryStore;
  return loadStore();
};

const setStore = (store) => {
  if (typeof localStorage === 'undefined') {
    Object.assign(memoryStore, store);
    return;
  }
  saveStore(store);
};

const uid = () => `id_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

const getDefaultTemplates = () => {
  const now = new Date().toISOString();
  return [
    { id: 'tpl_2pane_doors', name: '2 Pane Doors', image_url: pane2Doors, base_price: 20 },
    { id: 'tpl_2pane_lg', name: '2 Pane (Large)', image_url: pane2Lg, base_price: 15 },
    { id: 'tpl_2pane_sm', name: '2 Pane (Small)', image_url: pane2Sm, base_price: 12 },
    { id: 'tpl_7pane', name: '7 Pane', image_url: pane7, base_price: 25 },
    { id: 'tpl_single_lg', name: 'Single Pane (Large)', image_url: singlePaneLg, base_price: 10 },
    { id: 'tpl_triangle', name: 'Triangle Pane', image_url: trianglePane, base_price: 18 },
    { id: 'tpl_wide5', name: 'Wide 5 Pane', image_url: wide5Pane, base_price: 22 },
    { id: 'tpl_half_moon', name: 'Half Moon Pane', image_url: halfMoonPane, base_price: 20 },
  ].map((t) => ({
    created_date: now,
    updated_date: now,
    description: '',
    ...t,
  }));
};

const ensureDefaultTemplates = () => {
  try {
    const store = getStore();
    const existing = store.WindowTemplate || [];
    if (existing.length > 0) return;
    const templates = getDefaultTemplates();
    store.WindowTemplate = templates;
    setStore(store);
    try {
      localStorage.setItem(TEMPLATE_SEED_KEY, 'true');
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
};

const createEntityAPI = (entityName) => ({
  list: async (sort, limit) => {
    if (entityName === 'WindowTemplate') ensureDefaultTemplates();
    const store = getStore();
    let items = [...(store[entityName] || [])];
    if (entityName === 'WindowTemplate' && items.length === 0) {
      items = getDefaultTemplates();
      store.WindowTemplate = items;
      setStore(store);
    }
    if (sort && typeof sort === 'string') {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      items.sort((a, b) => {
        const av = a?.[field] ?? 0;
        const bv = b?.[field] ?? 0;
        if (av === bv) return 0;
        return desc ? (av > bv ? -1 : 1) : (av > bv ? 1 : -1);
      });
    }
    if (limit) items = items.slice(0, limit);
    return items;
  },
  filter: async (query = {}) => {
    if (entityName === 'WindowTemplate') ensureDefaultTemplates();
    const store = getStore();
    let items = store[entityName] || [];
    if (entityName === 'WindowTemplate' && items.length === 0) {
      items = getDefaultTemplates();
      store.WindowTemplate = items;
      setStore(store);
    }
    return items.filter((item) =>
      Object.entries(query).every(([k, v]) => item?.[k] === v)
    );
  },
  get: async (id) => {
    if (entityName === 'WindowTemplate') ensureDefaultTemplates();
    const store = getStore();
    const items = store[entityName] || [];
    if (entityName === 'WindowTemplate' && items.length === 0) {
      const defaults = getDefaultTemplates();
      store.WindowTemplate = defaults;
      setStore(store);
      return defaults.find((i) => i.id === id) || null;
    }
    return items.find((i) => i.id === id) || null;
  },
  create: async (data) => {
    const store = getStore();
    const now = new Date().toISOString();
    const item = {
      id: uid(),
      created_date: now,
      updated_date: now,
      ...data
    };
    store[entityName] = [...(store[entityName] || []), item];
    setStore(store);
    return item;
  },
  update: async (id, data) => {
    const store = getStore();
    const items = store[entityName] || [];
    const now = new Date().toISOString();
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...data, updated_date: now } : item
    );
    store[entityName] = updated;
    setStore(store);
    try {
      const updatedItem = updated.find((i) => i.id === id) || null;
      window.dispatchEvent(new CustomEvent(`${entityName}:updated`, { detail: updatedItem }));
    } catch {
      // ignore
    }
    return updated.find((i) => i.id === id) || null;
  },
  delete: async (id) => {
    if (entityName === 'WindowTemplate' && String(id).startsWith('tpl_')) {
      return { id, protected: true };
    }
    const store = getStore();
    const items = store[entityName] || [];
    store[entityName] = items.filter((i) => i.id !== id);
    setStore(store);
    return { id };
  }
});

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const imageToDataUrl = async (file, { maxSize = 1024, square = false, quality = 0.85 } = {}) => {
  const img = await loadImage(file);
  const srcW = img.width;
  const srcH = img.height;
  let sx = 0;
  let sy = 0;
  let sSize = Math.min(srcW, srcH);

  if (square) {
    sx = Math.floor((srcW - sSize) / 2);
    sy = Math.floor((srcH - sSize) / 2);
  } else {
    sSize = null;
  }

  const targetW = square ? maxSize : Math.min(maxSize, srcW);
  const targetH = square
    ? maxSize
    : Math.round((srcH / srcW) * targetW);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (square) {
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, targetW, targetH);
  } else {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }

  return canvas.toDataURL('image/jpeg', quality);
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });

const fallbackDb = {
  auth: {
    isAuthenticated: async () => false,
    me: async () => null,
    logout: async () => {}
  },
  entities: new Proxy(
    {},
    {
      get: (_target, prop) => createEntityAPI(String(prop))
    }
  ),
  integrations: {
    Core: {
      UploadFile: async ({ file, maxSize, square, quality } = {}) => {
        if (!file) return { file_url: '' };
        try {
          const dataUrl = await imageToDataUrl(file, { maxSize, square, quality });
          if (dataUrl) return { file_url: dataUrl };
          const fallback = await fileToDataUrl(file);
          return { file_url: fallback || '' };
        } catch {
          try {
            const fallback = await fileToDataUrl(file);
            return { file_url: fallback || '' };
          } catch {
            return { file_url: '' };
          }
        }
      }
    }
  }
};

export const db = fallbackDb;
export default db;
