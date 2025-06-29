'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/app-context';
import { generateExpiryNotification } from '@/ai/flows/generate-expiry-notifications';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

type NotificationState = {
  [productId: string]: {
    isLoading: boolean;
    message: string | null;
    error: string | null;
  };
};

export default function NotificationsPage() {
  const { products } = useApp();
  const [notifications, setNotifications] = useState<NotificationState>({});

  const expiringProducts = React.useMemo(() => {
    const today = new Date();
    return products.filter(p => {
      if (!p.expiryDate) return false;
      const expiry = parseISO(p.expiryDate);
      const daysUntilExpiry = differenceInDays(expiry, today);
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).sort((a,b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  }, [products]);

  const handleGenerateNotification = async (product: typeof products[0]) => {
    if (!product.expiryDate) return;

    setNotifications(prev => ({
      ...prev,
      [product.id]: { isLoading: true, message: null, error: null },
    }));

    try {
      const result = await generateExpiryNotification({
        productType: product.category,
        productName: product.name,
        quantity: product.stockInHand,
        expiryDate: product.expiryDate,
      });
      setNotifications(prev => ({
        ...prev,
        [product.id]: { isLoading: false, message: result.notificationMessage, error: null },
      }));
    } catch (error) {
      console.error(error);
      setNotifications(prev => ({
        ...prev,
        [product.id]: { isLoading: false, message: null, error: 'Failed to generate notification.' },
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Expiry Notifications</h1>
        </div>
        <p className="text-muted-foreground">
            Products that are expiring within the next 30 days are shown here.
        </p>
        
        {expiringProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiringProducts.map(product => {
                const daysLeft = differenceInDays(parseISO(product.expiryDate!), new Date());
                const notification = notifications[product.id];
                return (
                <Card key={product.id}>
                    <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                        {product.name}
                        <div className="flex items-center text-sm font-medium text-destructive">
                            <AlertTriangle className="h-4 w-4 mr-1.5" />
                            {daysLeft} days left
                        </div>
                    </CardTitle>
                    <CardDescription>
                        {product.stockInHand} items in stock. Expires on {product.expiryDate}.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    {notification?.message && (
                        <Alert variant="default" className="bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary">Generated Reminder</AlertTitle>
                            <AlertDescription>{notification.message}</AlertDescription>
                        </Alert>
                    )}
                     {notification?.error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{notification.error}</AlertDescription>
                        </Alert>
                    )}
                    </CardContent>
                    <CardFooter>
                    <Button
                        onClick={() => handleGenerateNotification(product)}
                        disabled={notification?.isLoading}
                        className="w-full"
                    >
                        {notification?.isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generate Reminder
                    </Button>
                    </CardFooter>
                </Card>
                );
            })}
            </div>
        ) : (
            <Card className="flex flex-col items-center justify-center py-20">
                <CardContent className="text-center">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">All Clear!</h3>
                    <p className="mt-1 text-sm text-muted-foreground">No products are expiring soon.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
