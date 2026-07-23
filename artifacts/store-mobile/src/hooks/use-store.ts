import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Types
export interface Product {
  id: string;
  name: string;
  name_ar: string;
  category_id: string;
  sku: string;
  price: number;
  cost: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  parent_id: string | null;
  is_active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  pos_location_id: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
}

// Queries
export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiClient('/products'),
  });
};

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient('/categories'),
  });
};

export const useWarehouses = () => {
  return useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => apiClient('/warehouses'),
  });
};

export const useInvoices = () => {
  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => apiClient('/invoices?order=created_at.desc'),
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard'],
    // Mock implementation as the specific endpoint details are limited
    queryFn: async () => {
      try {
        return await apiClient('/reports/dashboard');
      } catch (e) {
        // Fallback for UI building
        return { total_sales: 15420, total_orders: 84, active_products: 342, low_stock: 12 };
      }
    },
  });
};

// Mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => 
      apiClient('/products', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => 
      apiClient(`/products?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
