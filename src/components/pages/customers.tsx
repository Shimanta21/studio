'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Pet } from '@/lib/types';

const petSchema = z.object({
  species: z.string().min(1, 'Species is required.'),
  breed: z.string().min(1, 'Breed is required.'),
  count: z.coerce.number().min(1, 'Count must be at least 1.'),
});

const customerFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits.'),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  pets: z.array(petSchema).min(1, 'Please add at least one pet.'),
});

export default function CustomersPage() {
  const { customers, addCustomer } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      whatsappNumber: '',
      email: '',
      pets: [{ species: '', breed: '', count: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pets',
  });

  async function onSubmit(values: z.infer<typeof customerFormSchema>) {
    try {
      await addCustomer(values);
      toast({
        title: 'Customer Added',
        description: `${values.name} has been added to your customer directory.`,
      });
      form.reset({
          name: '',
          phoneNumber: '',
          whatsappNumber: '',
          email: '',
          pets: [{ species: '', breed: '', count: 1 }],
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Customer',
        description: 'An unexpected error occurred.',
      });
    }
  }
  
  const formatPets = (pets: Pet[]) => {
    if (!pets || pets.length === 0) return 'No pets listed.';
    return pets.map(pet => `${pet.count} ${pet.breed} (${pet.species})`).join(', ');
  }

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="add-customer">
          <AccordionTrigger>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <PlusCircle className="h-5 w-5" />
              Add New Customer
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter customer's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 9876543210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                       <FormField
                        control={form.control}
                        name="whatsappNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Contact (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Leave blank if same as phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="e.g., customer@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                        <FormLabel className="text-base font-medium">Pet Details</FormLabel>
                        <div className="space-y-4 pt-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                    <FormField
                                        control={form.control}
                                        name={`pets.${index}.species`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Species</FormLabel>
                                                <FormControl><Input placeholder="e.g., Dog" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`pets.${index}.breed`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Breed</FormLabel>
                                                <FormControl><Input placeholder="e.g., Labrador" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`pets.${index}.count`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Count</FormLabel>
                                                <FormControl><Input type="number" min="1" placeholder="1" {...field} /></FormControl>
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
                                    className="text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove Pet</span>
                                </Button>
                            </div>
                        ))}
                        </div>
                    </div>
                     <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ species: '', breed: '', count: 1 })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Another Pet
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : "Save Customer"}
                        </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            Customer Directory
          </CardTitle>
          <CardDescription>
            A list of all your customers and their pets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Pets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? customers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{customer.phoneNumber}</span>
                        {customer.email && <span className="text-sm text-muted-foreground">{customer.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{formatPets(customer.pets)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">No customers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
