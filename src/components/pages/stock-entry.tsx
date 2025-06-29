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
  productId: z.string().optional(), // Template product
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  receivedDate: z.date(),
  isNewProduct: z.boolean(),
  batchNumber: z.string().optional(),
  expiryDate: z.date().optional(),
  newProduct: z.object({
    name: z.string().optional(),
    price: z.coerce.number().optional(),
    category: z.string().optional(),
    batchNumber: z.string().optional(),
    source: z.string().optional(),
    expiryDate: z.date().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
    if (data.isNewProduct) {
        if (!data.newProduct?.name) ctx.addIssue({ code: 'custom', message: 'Product name is required.', path: ['newProduct.name'] });
        if (!data.newProduct?.category) ctx.addIssue({ code: 'custom', message: 'Category is required.', path: ['newProduct.category'] });
        if (!data.newProduct?.batchNumber) ctx.addIssue({ code: 'custom', message: 'Batch number is required.', path: ['newProduct.batchNumber'] });
        if (data.newProduct?.price === undefined) ctx.addIssue({ code: 'custom', message: 'Price is required.', path: ['newProduct.price'] });
    } else {
        if (!data.productId) ctx.addIssue({ code: 'custom', message: 'Please select a product.', path: ['productId'] });
        if (!data.batchNumber) ctx.addIssue({ code: 'custom', message: 'Batch number is required.', path: ['batchNumber'] });
    }
});

export default function StockEntryPage() {
  const { products, addProduct, addStock } = useApp();
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof stockFormSchema>>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
      receivedDate: new Date(),
      isNewProduct: false,
      batchNumber: '',
      expiryDate: undefined,
      newProduct: {
        name: '',
        price: 0,
        category: undefined,
        batchNumber: '',
        source: '',
        expiryDate: undefined,
      }
    },
  });

  function onSubmit(values: z.infer<typeof stockFormSchema>) {
    if (values.isNewProduct && values.newProduct) {
      addProduct({
          name: values.newProduct.name!,
          price: values.newProduct.price!,
          category: values.newProduct.category! as Category,
          batchNumber: values.newProduct.batchNumber!,
          source: values.newProduct.source,
          initialStock: values.quantity,
          expiryDate: values.newProduct.expiryDate ? format(values.newProduct.expiryDate, 'yyyy-MM-dd') : undefined,
      });
      toast({ title: "Product Added", description: `${values.newProduct.name} has been added to inventory.`});
    } else {
      const templateProduct = products.find(p => p.id === values.productId);
      if (!templateProduct) {
          toast({ variant: 'destructive', title: "Error", description: "Template product not found."});
          return;
      }

      const existingProductWithBatch = products.find(p => p.name === templateProduct.name && p.batchNumber === values.batchNumber);

      if (existingProductWithBatch) {
        addStock(existingProductWithBatch.id, values.quantity, values.receivedDate);
        toast({ title: "Stock Updated", description: `Added ${values.quantity} to ${templateProduct.name} (Batch: ${values.batchNumber}).`});
      } else {
        addProduct({
            name: templateProduct.name,
            price: templateProduct.price,
            category: templateProduct.category,
            batchNumber: values.batchNumber!,
            source: templateProduct.source,
            initialStock: values.quantity,
            expiryDate: values.expiryDate ? format(values.expiryDate, 'yyyy-MM-dd') : undefined,
        });
        toast({ title: "New Batch Added", description: `New batch for ${templateProduct.name} has been added to inventory.`});
      }
    }
    form.reset({
      productId: '',
      quantity: 1,
      receivedDate: new Date(),
      isNewProduct: false,
      batchNumber: '',
      expiryDate: undefined,
      newProduct: {
        name: '',
        price: 0,
        category: undefined,
        batchNumber: '',
        source: '',
        expiryDate: undefined,
      }
    });
    setIsNew(false);
  }
  
  const uniqueProductsByName = Array.from(new Map(products.map(p => [p.name, p])).values());

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
                    <FormLabel>Register a completely new product type?</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsNew(checked);
                          form.clearErrors();
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isNew ? (
              <div className="space-y-4 p-4 border rounded-lg">
                 <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Existing Product</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a product to use as template" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uniqueProductsByName.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="batchNumber" render={({ field }) => (
                    <FormItem><FormLabel>Batch Number</FormLabel><FormControl><Input placeholder="Enter batch number for this stock" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
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
                 <FormField control={form.control} name="newProduct.source" render={({ field }) => (
                    <FormItem><FormLabel>Source (Supplier)</FormLabel><FormControl><Input placeholder="e.g. Vet Supplies Inc." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="newProduct.price" render={({ field }) => (
                        <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
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
              {form.formState.isSubmitting ? "Saving..." : (isNew ? "Add New Product" : "Add Stock / New Batch")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
