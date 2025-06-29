'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo } from 'react';
import { MOCK_PRODUCTS, MOCK_SALES } from '@/lib/mock-data';
import type { Product, Sale, Category, SubCategory } from '@/lib/types';
import { format } from 'date-fns';

interface AppContextType {
  products: Product[];
  sales: Sale[];
  addProduct: (product: Omit<Product, 'id' | 'stockInHand' | 'itemsSold' | 'receivedLog'> & { initialStock: number }) => void;
  addStock: (productId: string, quantity: number, date: Date) => void;
  addSale: (productId: string, quantity: number, date: Date) => void;
  getDailySales: (date: Date) => Sale[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);

  const addProduct = (productData: Omit<Product, 'id' | 'stockInHand' | 'itemsSold' | 'receivedLog'> & { initialStock: number }) => {
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: productData.name,
      category: productData.category,
      subCategory: productData.subCategory,
      price: productData.price,
      expiryDate: productData.expiryDate,
      stockInHand: productData.initialStock,
      itemsSold: 0,
      receivedLog: [{ date: format(new Date(), 'yyyy-MM-dd'), quantity: productData.initialStock }],
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const addStock = (productId: string, quantity: number, date: Date) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              stockInHand: p.stockInHand + quantity,
              receivedLog: [...p.receivedLog, { date: format(date, 'yyyy-MM-dd'), quantity }],
            }
          : p
      )
    );
  };

  const addSale = (productId: string, quantity: number, date: Date) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stockInHand < quantity) {
      // In a real app, you'd throw an error here to be caught by the form
      console.error("Not enough stock or product not found");
      return;
    }

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      productId,
      productName: product.name,
      quantity,
      saleDate: format(date, 'yyyy-MM-dd'),
      totalAmount: product.price * quantity,
    };

    setSales(prev => [newSale, ...prev]);
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              stockInHand: p.stockInHand - quantity,
              itemsSold: p.itemsSold + quantity,
            }
          : p
      )
    );
  };

  const getDailySales = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return sales.filter(s => s.saleDate === formattedDate);
  };


  const value = useMemo(() => ({
    products,
    sales,
    addProduct,
    addStock,
    addSale,
    getDailySales,
  }), [products, sales]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
}
