'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { HandHeart } from 'lucide-react';
import React from 'react';

const pledgeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  contact: z.string().email("Please enter a valid email address."),
  resourceType: z.enum(['Food', 'Shelter', 'Transport', 'Skills']),
  resourceDetails: z.string().min(5, "Please provide more details."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});

type PledgeFormValues = z.infer<typeof pledgeSchema>;

export default function PledgeForm() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<PledgeFormValues>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      name: "",
      contact: "",
      resourceDetails: "",
      quantity: 1,
    }
  });

  const onSubmit = (data: PledgeFormValues) => {
    console.log("Pledge submitted:", data);
    // In a real app, this would send data to a server.
    toast({
      title: "Pledge Received!",
      description: "Thank you for your contribution to community resilience.",
    });
    setIsSubmitted(true);
  };
  
  if (isSubmitted) {
    return (
        <div className="text-center p-12 bg-green-50 rounded-lg border border-green-200">
            <HandHeart className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-4 text-2xl font-bold text-green-800">Thank You!</h3>
            <p className="mt-2 text-green-700">Your pledge has been added to the network. You will be contacted if a match is found for your resources.</p>
            <Button onClick={() => {
                setIsSubmitted(false);
                form.reset();
                }} className="mt-6">Pledge Something Else</Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Your Name / Organization</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Jane Doe or Community Cafe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="resourceType"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Resource Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Select a resource category" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Shelter">Shelter</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Skills">Skills</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
            control={form.control}
            name="resourceDetails"
            render={({ field }) => (
                <FormItem className="md:col-span-2">
                <FormLabel>Resource Details</FormLabel>
                <FormControl>
                    <Textarea placeholder="e.g., 'Hot meals', 'Beds in a spare room', 'Paramedic skills'" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                    <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="flex justify-end">
            <Button type="submit" size="lg">
                <HandHeart className="mr-2 h-4 w-4" />
                Submit Pledge
            </Button>
        </div>

      </form>
    </Form>
  );
}
