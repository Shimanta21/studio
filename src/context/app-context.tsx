'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { Product, Sale } from '@/lib/types';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  increment,
  query,
  orderBy,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface BulkSaleData {
    customerName: string;
    saleDate: Date;
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
}

interface AppContextType {
  products: Product[];
  sales: Sale[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'stockInHand' | 'itemsSold' | 'receivedLog'> & { initialStock: number }) => Promise<void>;
  addStock: (productId: string, quantity: number, date: Date) => Promise<void>;
  addBulkSale: (saleData: BulkSaleData) => Promise<void>;
  getDailySales: (date: Date) => Sale[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
      setProducts(productsData);
      if (isLoading) setIsLoading(false);
    }, (error) => {
      console.error("Error fetching products: ", error);
      toast({ variant: 'destructive', title: "Database Error", description: "Could not fetch products."});
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoading, toast]);

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Sale));
      setSales(salesData);
    }, (error) => {
        console.error("Error fetching sales: ", error);
        toast({ variant: 'destructive', title: "Database Error", description: "Could not fetch sales."});
    });

    return () => unsubscribe();
  }, [toast]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'stockInHand' | 'itemsSold' | 'receivedLog'> & { initialStock: number }) => {
    try {
      await addDoc(collection(db, 'products'), {
        name: productData.name,
        category: productData.category,
        source: productData.source,
        batchNumber: productData.batchNumber,
        price: productData.price,
        expiryDate: productData.expiryDate,
        stockInHand: productData.initialStock,
        itemsSold: 0,
        receivedLog: [{ date: format(new Date(), 'yyyy-MM-dd'), quantity: productData.initialStock }],
      });
    } catch (error) {
        console.error("Error adding product: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not add the new product."});
    }
  }, [toast]);

  const addStock = useCallback(async (productId: string, quantity: number, date: Date) => {
    const productRef = doc(db, 'products', productId);
    try {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error("Product not found");

      const updatedLog = [...product.receivedLog, { date: format(date, 'yyyy-MM-dd'), quantity }];
      
      await updateDoc(productRef, {
        stockInHand: increment(quantity),
        receivedLog: updatedLog
      });
    } catch (error) {
        console.error("Error adding stock: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not update the stock."});
    }
  }, [products, toast]);
  
  const addBulkSale = useCallback(async (saleData: BulkSaleData) => {
    const batch = writeBatch(db);

    for (const item of saleData.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
            throw new Error(`Product with ID ${item.productId} not found.`);
        }
        if (product.stockInHand < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}. Only ${product.stockInHand} available.`);
        }

        const saleDocRef = doc(collection(db, 'sales'));
        const newSale: Omit<Sale, 'id'> = {
            productId: item.productId,
            productName: product.name,
            customerName: saleData.customerName,
            quantity: item.quantity,
            saleDate: format(saleData.saleDate, 'yyyy-MM-dd'),
            totalAmount: product.price * item.quantity,
        };
        batch.set(saleDocRef, newSale);

        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, {
            stockInHand: increment(-item.quantity),
            itemsSold: increment(item.quantity),
        });
    }

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error recording bulk sale: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to record the sale. The transaction was rolled back."});
        throw error;
    }
  }, [products, toast]);


  const getDailySales = useCallback((date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return sales.filter(s => s.saleDate === formattedDate);
  }, [sales]);

  const value = useMemo(() => ({
    products,
    sales,
    isLoading,
    addProduct,
    addStock,
    addBulkSale,
    getDailySales,
  }), [products, sales, isLoading, addProduct, addStock, addBulkSale, getDailySales]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
}
