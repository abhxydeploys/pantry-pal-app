'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NewPantryItem} from '@/components/pantry/PantryItem';
import { NewPantryItemSchema } from '@/components/pantry/PantryItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Camera } from 'lucide-react';
import { useState } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal'; // Import the new modal
import { differenceInDays } from 'date-fns';

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanComplete = (scannedData: { barcode?: string; expiryDate?: string; productName?: string }) => {
    setIsScannerOpen(false); // Close the modal
    
    if (scannedData.productName) {
      form.setValue('name', scannedData.productName, { shouldValidate: true });
    } else if (scannedData.barcode) {
      // You could potentially pre-fill name or fetch item details based on barcode
      // For now, let's just log it.
      console.log('Barcode scanned:', scannedData.barcode);
    }
    
    if (scannedData.expiryDate) {
      // The AI returns YYYY-MM-DD. To avoid timezone parsing issues with `new Date(string)`,
      // we parse the components manually. This reliably creates a date in the user's local timezone.
      const dateParts = scannedData.expiryDate.split('-').map(Number);
      
      if (dateParts.length === 3 && !dateParts.some(isNaN)) {
        const [year, month, day] = dateParts;
        // new Date() month is 0-indexed, so we subtract 1.
        const expiry = new Date(year, month - 1, day);
        
        const today = new Date();
        // Normalize today's date to the start of the day for consistent calculations
        today.setHours(0, 0, 0, 0);

        if (!isNaN(expiry.getTime())) {
            const daysUntilExpiry = differenceInDays(expiry, today);
            
            // The form validation requires shelfLife to be at least 1.
            // If the item expires today or is already expired (daysUntilExpiry < 1),
            // we default to 1 day to allow the form to be populated. The user can adjust if needed.
            const shelfLifeValue = daysUntilExpiry >= 1 ? daysUntilExpiry : 1;
            
            form.setValue('shelfLife', shelfLifeValue, { shouldValidate: true });
        }
      }
    }
  };

  const onSubmit: SubmitHandler<NewPantryItem> = (data) => {
    onAddItem(data);
    form.reset();
  };

  return (
    <>
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
          <div className="space-y-3">
            <Button type="submit" className="w-full">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Item to Pantry
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsScannerOpen(true)}
            >
              <Camera className="mr-2 h-5 w-5" />
              Scan Item with AI
            </Button>
          </div>
        </form>
      </Form>
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </>
  );
}
