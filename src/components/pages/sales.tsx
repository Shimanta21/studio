
'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Send, Sparkles, Loader2, AlertTriangle, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateSalesNotification } from '@/ai/flows/generate-sales-notification';


const saleItemSchema = z.object({
  productName: z.string().min(1, { message: "Please select a product." }),
  productId: z.string().min(1, { message: "Please select a batch." }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  price: z.coerce.number().optional(),
});

const salesFormSchema = z.object({
  saleDate: z.date({
    required_error: 'A sale date is required.',
  }),
  customerName: z.string().min(1, 'Please select a customer.'),
  items: z.array(saleItemSchema).min(1, 'Please add at least one product.'),
});

type SaleSummary = {
  customerName: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
};


export default function SalesPage() {
  const { products, addBulkSale, customers } = useApp();
  const { toast } = useToast();
  const [lastSaleSummary, setLastSaleSummary] = React.useState<SaleSummary | null>(null);
  const [notificationState, setNotificationState] = React.useState({
    isLoading: false,
    message: null as string | null,
    error: null as string | null,
  });
  const [isCustomerComboboxOpen, setIsCustomerComboboxOpen] = React.useState(false);

  const form = useForm<z.infer<typeof salesFormSchema>>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      saleDate: new Date(),
      customerName: '',
      items: [{ productName: '', productId: '', quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const uniqueProductNames = React.useMemo(() => {
    return [...new Set(products.map(p => p.name))];
  }, [products]);

  const selectedProductNames = form.watch('items').map(item => item.productName);

  const handleSendNotification = async () => {
    if (!lastSaleSummary) return;

    setNotificationState({ isLoading: true, message: null, error: null });
    try {
      const result = await generateSalesNotification({
        customerName: lastSaleSummary.customerName,
        items: lastSaleSummary.items.map(i => ({ productName: i.productName, quantity: i.quantity, price: i.price })),
        totalAmount: lastSaleSummary.totalAmount,
      });
      setNotificationState({ isLoading: false, message: result.notificationMessage, error: null });
    } catch (error) {
      console.error(error);
      setNotificationState({ isLoading: false, message: null, error: 'Failed to generate notification.' });
    }
  };

  async function onSubmit(values: z.infer<typeof salesFormSchema>) {
    let hasError = false;
    
    const productIds = values.items.map(item => item.productId);
    const duplicateIds = productIds.filter((id, index) => productIds.indexOf(id) !== index && id !== '');
    if(duplicateIds.length > 0) {
        values.items.forEach((item, index) => {
            if (duplicateIds.includes(item.productId)) {
                form.setError(`items.${index}.productId`, { type: 'manual', message: 'Duplicate batch selected.' });
                hasError = true;
            }
        });
    }

    values.items.forEach((item, index) => {
      const product = products.find(p => p.id === item.productId);
      if (product && product.stockInHand < item.quantity) {
        form.setError(`items.${index}.quantity`, { type: 'manual', message: `Not enough stock. Only ${product.stockInHand} available.` });
        hasError = true;
      }
    });

    if (hasError) return;

    try {
        await addBulkSale({
            customerName: values.customerName,
            saleDate: values.saleDate,
            items: values.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find(p => p.id === item.productId)!.price
            }))
        });

        const summaryItems = values.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        return {
            productName: product.name,
            quantity: item.quantity,
            price: product.price,
            total: item.quantity * product.price,
        };
        });
        const totalAmount = summaryItems.reduce((sum, item) => sum + item.total, 0);
        setLastSaleSummary({
            customerName: values.customerName,
            items: summaryItems,
            totalAmount: totalAmount,
        });
        setNotificationState({ isLoading: false, message: null, error: null });
        
        const totalItems = values.items.reduce((sum, item) => sum + item.quantity, 0);
        toast({
        title: 'Sales Recorded Successfully',
        description: `Recorded sales for ${values.items.length} product(s), totaling ${totalItems} items for ${values.customerName}.`,
        });
        form.reset({
        saleDate: new Date(),
        customerName: '',
        items: [{ productName: '', productId: '', quantity: 1, price: 0 }],
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Record Sale',
            description: error.message || "An unexpected error occurred.",
        });
    }
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlusCircle />
                    Record Sales
                </CardTitle>
                <CardDescription>
                Add one or more products to record a bulk sale for a single customer. The inventory will be updated automatically.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                        <FormField
                        control={form.control}
                        name="saleDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date of Sale</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                    )}
                                >
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Customer Name</FormLabel>
                          <Popover open={isCustomerComboboxOpen} onOpenChange={setIsCustomerComboboxOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? customers.find(
                                        (customer) => customer.name === field.value
                                      )?.name
                                    : "Select a customer"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search customers..." />
                                <CommandList>
                                  <CommandEmpty>No customer found.</CommandEmpty>
                                  <CommandGroup>
                                    {customers.map((customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={customer.name}
                                        onSelect={() => {
                                          form.setValue("customerName", customer.name)
                                          setIsCustomerComboboxOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            customer.name === field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {customer.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>

                    <div className="space-y-4">
                    {fields.map((field, index) => {
                        const selectedProductName = form.watch(`items.${index}.productName`);
                        const availableBatches = products.filter(p => p.name === selectedProductName);
                        
                        return (
                        <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                            <FormField
                                control={form.control}
                                name={`items.${index}.productName`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue(`items.${index}.productId`, '');
                                        form.setValue(`items.${index}.price`, 0);
                                        form.clearErrors(`items.${index}.productId`);
                                    }} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {uniqueProductNames.map(name => (
                                        <SelectItem 
                                            key={name} 
                                            value={name} 
                                            disabled={selectedProductNames.includes(name) && field.value !== name}
                                        >
                                            {name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`items.${index}.productId`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Batch Number</FormLabel>
                                    <Select 
                                        onValueChange={(value) => {
                                        field.onChange(value);
                                        const product = products.find(p => p.id === value);
                                        form.setValue(`items.${index}.price`, product?.price);
                                        }} 
                                        value={field.value}
                                        disabled={!selectedProductName}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a batch" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableBatches.map(product => (
                                        <SelectItem 
                                            key={product.id} 
                                            value={product.id} 
                                            disabled={product.stockInHand === 0}
                                        >
                                            {product.batchNumber} ({product.stockInHand} in stock)
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`items.${index}.price`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (₹)</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="0.00" disabled value={field.value || 0} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                            className="mt-8 text-destructive hover:bg-destructive/10"
                            >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                            </Button>
                        </div>
                        )
                    })}
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ productName: '', productId: '', quantity: 1, price: 0 })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Another Product
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Recording Sales..." : "Record All Sales"}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-4">
        {lastSaleSummary && (
            <Card>
                <CardHeader>
                <CardTitle>Sale Summary</CardTitle>
                <CardDescription>
                    For customer: <strong>{lastSaleSummary.customerName}</strong>
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {lastSaleSummary.items.map((item, index) => (
                            <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{(item.total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <div className="text-right font-bold text-lg mt-4">
                        Grand Total: ₹{lastSaleSummary.totalAmount.toFixed(2)}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-4">
                <Button onClick={handleSendNotification} disabled={notificationState.isLoading}>
                    {notificationState.isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                    Send Bill Notification
                </Button>
                {notificationState.message && (
                    <Alert variant="default" className="bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary">Generated Notification</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap">{notificationState.message}</AlertDescription>
                    </Alert>
                )}
                {notificationState.error && (
                    <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{notificationState.error}</AlertDescription>
                    </Alert>
                )}
                </CardFooter>
            </Card>
        )}
        </div>
    </div>
  );
}
