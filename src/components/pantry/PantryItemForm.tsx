'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NewPantryItem} from '@/components/pantry/PantryItem';
import { NewPantryItemSchema } from '@/components/pantry/PantryItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle } from 'lucide-react';

interface PantryItemFormProps {
  onAddItem: (item: NewPantryItem) => void;
}

export default function PantryItemForm({ onAddItem }: PantryItemFormProps) {
  const form = useForm<NewPantryItem>({
    resolver: zodResolver(NewPantryItemSchema),
    defaultValues: {
      name: '',
      shelfLife: 7,
    },
  });

  const onSubmit: SubmitHandler<NewPantryItem> = (data) => {
    onAddItem(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="itemName">Item Name</FormLabel>
              <FormControl>
                <Input id="itemName" placeholder="e.g., Apples, Milk" {...field} aria-describedby="itemNameMessage" />
              </FormControl>
              <FormMessage id="itemNameMessage" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shelfLife"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="shelfLife">Shelf Life (days)</FormLabel>
              <FormControl>
                <Input
                  id="shelfLife"
                  type="number"
                  placeholder="e.g., 7"
                  {...field}
                  onChange={event => field.onChange(+event.target.value)} // Ensure value is number
                  aria-describedby="shelfLifeMessage"
                />
              </FormControl>
              <FormMessage id="shelfLifeMessage" />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Item to Pantry
        </Button>
      </form>
    </Form>
  );
}
