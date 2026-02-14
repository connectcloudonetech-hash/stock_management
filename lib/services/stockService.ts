
import { MovementType, StockMovement, Customer, Product } from '../../types';

export const CATEGORIES = [
  'LAPTOP',
  'RF MOBILE',
  'NEW MOBILE',
  'BURKA',
  'GAME',
  'FACE-CREAM',
  'CPU',
  'OTHERS'
];

const STORAGE_KEYS = {
  // Incremented to v2 to force clear the mock data from your previous session
  MOVEMENTS: 'sr_storage_v2_movements',
  CUSTOMERS: 'sr_storage_v2_customers',
  PRODUCTS: 'sr_storage_v2_products'
};

// Helper to interact with LocalStorage
const getStorageData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing localStorage key: ${key}`, e);
    return defaultValue;
  }
};

const setStorageData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Data Seeding - Now Empty for fresh start
const INITIAL_CUSTOMERS: Customer[] = [];
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_MOVEMENTS: StockMovement[] = [];

// Service Implementation
export const stockService = {
  getCategories: () => CATEGORIES,

  getCustomers: async (): Promise<Customer[]> => {
    return getStorageData<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  getProducts: async (): Promise<Product[]> => {
    return getStorageData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  addProduct: async (name: string, category: string, unit: string): Promise<Product> => {
    const products = await stockService.getProducts();
    const newProd: Product = {
      id: `p-${Math.random().toString(36).substr(2, 5)}`,
      name: name.toUpperCase(),
      category: category.toUpperCase(),
      unit,
      current_stock: 0
    };
    const updated = [...products, newProd];
    setStorageData(STORAGE_KEYS.PRODUCTS, updated);
    return newProd;
  },

  addCustomer: async (name: string): Promise<Customer> => {
    const customers = await stockService.getCustomers();
    const newCust: Customer = {
      id: `c-${Math.random().toString(36).substr(2, 5)}`,
      name: name.toUpperCase()
    };
    const updated = [...customers, newCust];
    setStorageData(STORAGE_KEYS.CUSTOMERS, updated);
    return newCust;
  },

  getMovements: async (): Promise<StockMovement[]> => {
    return getStorageData<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  },

  getMovementById: async (id: string): Promise<StockMovement | undefined> => {
    const movements = await stockService.getMovements();
    return movements.find(m => m.id === id);
  },

  getCategoryBalances: async () => {
    const movements = await stockService.getMovements();
    const balances: Record<string, number> = {};
    
    CATEGORIES.forEach(cat => {
      if (cat !== 'OTHERS') balances[cat] = 0;
    });
    
    movements.forEach(m => {
      if (m.type === MovementType.IN) {
        balances[m.category] = (balances[m.category] || 0) + m.nos;
      } else {
        balances[m.category] = (balances[m.category] || 0) - m.nos;
      }
    });
    return balances;
  },

  getMovementsByCustomerId: async (customerId: string): Promise<StockMovement[]> => {
    const movements = await stockService.getMovements();
    return movements.filter(m => m.customer_id === customerId);
  },

  carryIn: async (data: Partial<StockMovement>) => {
    const movements = await stockService.getMovements();
    const newMovement: StockMovement = {
      id: Math.random().toString(36).substr(2, 9),
      date: data.date!,
      type: MovementType.IN,
      category: data.category!.toUpperCase(),
      customer_id: data.customer_id!,
      qty: data.nos!,
      nos: data.nos!,
      weight: data.weight,
      amount: data.amount,
      remarks: data.remarks?.toUpperCase(),
      created_at: new Date().toISOString(),
      created_by: '1',
    };
    const updated = [newMovement, ...movements];
    setStorageData(STORAGE_KEYS.MOVEMENTS, updated);
    return { success: true, data: newMovement };
  },

  carryOut: async (data: Partial<StockMovement>) => {
    const movements = await stockService.getMovements();
    const newMovement: StockMovement = {
      id: Math.random().toString(36).substr(2, 9),
      date: data.date!,
      type: MovementType.OUT,
      category: data.category!.toUpperCase(),
      customer_id: data.customer_id, 
      qty: data.nos!,
      nos: data.nos!,
      weight: data.weight,
      amount: data.amount,
      remarks: data.remarks?.toUpperCase(),
      created_at: new Date().toISOString(),
      created_by: '1',
    };
    const updated = [newMovement, ...movements];
    setStorageData(STORAGE_KEYS.MOVEMENTS, updated);
    return { success: true, data: newMovement };
  },

  updateMovement: async (id: string, data: Partial<StockMovement>) => {
    const movements = await stockService.getMovements();
    const index = movements.findIndex(m => m.id === id);
    if (index !== -1) {
      movements[index] = { ...movements[index], ...data };
      setStorageData(STORAGE_KEYS.MOVEMENTS, movements);
      return { success: true, data: movements[index] };
    }
    return { success: false, error: 'Movement not found' };
  }
};
