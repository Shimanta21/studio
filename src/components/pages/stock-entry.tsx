'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/lib/types';

const allCategories: Category[] = ["Medicines & Pet Foods", "Vaccines", "Accessories"];

const stockFormSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  receivedDate: z.date(),
  isNewProduct: z.boolean(),
  newProduct: z.object({
    name: z.string(),
    price: z.coerce.number(),
    category: z.string(),
    batchNumber: z.string().min(1, 'Batch number is required.'),
    expiryDate: z.date().optional(),
  }).optional(),
});

export default function StockEntryPage() {
  const { products, addProduct, addStock } = useApp();
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof stockFormSchema>>({
    resolver: zodResolver(stockFormSchema.refine(data => {
        if (data.isNewProduct) {
            return data.newProduct?.name && data.newProduct.name.length > 0
        }
        return data.productId.length > 0;
    }, {
        message: 'Product selection or new product name is required',
        path: ['productId'],
    })),
    defaultValues: {
      productId: '',
      quantity: 1,
      receivedDate: new Date(),
      isNewProduct: false,
      newProduct: {
        name: '',
        price: 0,
        category: undefined,
        batchNumber: '',
      }
    },
  });

  function onSubmit(values: z.infer<typeof stockFormSchema>) {
    if (values.isNewProduct && values.newProduct) {
      addProduct({
          name: values.newProduct.name,
          price: values.newProduct.price,
          category: values.newProduct.category as Category,
          batchNumber: values.newProduct.batchNumber,
          initialStock: values.quantity,
          expiryDate: values.newProduct.expiryDate ? format(values.newProduct.expiryDate, 'yyyy-MM-dd') : undefined,
      });
      toast({ title: "Product Added", description: `${values.newProduct.name} has been added to inventory.`});
    } else {
      addStock(values.productId, values.quantity, values.receivedDate);
      const productName = products.find(p => p.id === values.productId)?.name;
      toast({ title: "Stock Updated", description: `Added ${values.quantity} to ${productName}.`});
    }
    form.reset();
    setIsNew(false);
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PackagePlus /> Stock Entry</CardTitle>
        <CardDescription>Add new stock for existing products or create a new product entry.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="isNewProduct"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>New Product?</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsNew(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isNew ? (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Existing Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-4 p-4 border rounded-lg">
                <FormField control={form.control} name="newProduct.name" render={({ field }) => (
                    <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g. Premium Cat Food" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="newProduct.category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                                <SelectContent>{allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="newProduct.batchNumber" render={({ field }) => (
                        <FormItem><FormLabel>Batch Number</FormLabel><FormControl><Input placeholder="e.g. BATCH123" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="newProduct.price" render={({ field }) => (
                        <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="newProduct.expiryDate" render={({ field }) => (
                        <FormItem><FormLabel>Expiry Date (Optional)</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant='outline' className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover>
                        <FormMessage /></FormItem>
                    )}/>
                 </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Quantity Received</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="receivedDate" render={({ field }) => (
                    <FormItem><FormLabel>Date Received</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant='outline' className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                        </PopoverContent></Popover>
                    <FormMessage /></FormItem>
                )}/>
            </div>
            
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : (isNew ? "Add New Product" : "Update Stock")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
