'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Product, Sale } from '@/lib/types';
import { format } from 'date-fns';
import { db, auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
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
  getDocs,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { seedDatabase } from '@/lib/seed';

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
  appInitialized: boolean;
  user: User | null;
  addProduct: (product: Omit<Product, 'id' | 'stockInHand' | 'itemsSold' | 'receivedLog'> & { initialStock: number }) => Promise<void>;
  addStock: (productId: string, quantity: number, date: Date) => Promise<void>;
  addBulkSale: (saleData: BulkSaleData) => Promise<void>;
  getDailySales: (date: Date) => Sale[];
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [appInitialized, setAppInitialized] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAppInitialized(true);
       if(!user) {
        setProducts([]);
        setSales([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (appInitialized) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, appInitialized, pathname, router]);

  useEffect(() => {
    if (!user) return; // Don't fetch data if there's no user
    
    setIsLoading(true);

    const productsCollectionRef = collection(db, 'products');
    getDocs(productsCollectionRef).then(async (snapshot) => {
      if (snapshot.empty) {
        console.log("Empty database detected, seeding with mock data...");
        toast({ title: "Welcome!", description: "Setting up sample data for you..." });
        await seedDatabase(db);
        toast({ title: "Setup Complete!", description: "Sample data has been added to your database." });
      }
    });

    const productsQuery = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (querySnapshot) => {
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching products: ", error);
      toast({ variant: 'destructive', title: "Database Error", description: "Could not fetch products."});
      setIsLoading(false);
    });

    const salesQuery = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
    const unsubscribeSales = onSnapshot(salesQuery, (querySnapshot) => {
      const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setSales(salesData);
    }, (error) => {
        console.error("Error fetching sales: ", error);
        toast({ variant: 'destructive', title: "Database Error", description: "Could not fetch sales."});
    });

    return () => {
        unsubscribeProducts();
        unsubscribeSales();
    };
  }, [user, toast]);

  const signIn = useCallback(async (email: string, pass: string) => {
      await signInWithEmailAndPassword(auth, email, pass);
  }, []);

  const signUp = useCallback(async (email: string, pass: string) => {
      await createUserWithEmailAndPassword(auth, email, pass);
  }, []);

  const logOut = useCallback(async () => {
      await signOut(auth);
  }, []);

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
    appInitialized,
    user,
    addProduct,
    addStock,
    addBulkSale,
    getDailySales,
    signIn,
    signUp,
    logOut
  }), [products, sales, isLoading, appInitialized, user, addProduct, addStock, addBulkSale, getDailySales, signIn, signUp, logOut]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
}
