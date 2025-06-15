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

  const handleScanComplete = (scannedData: { barcode?: string; expiryDate?: string }) => {
    setIsScannerOpen(false); // Close the modal
    if (scannedData.barcode) {
      // Potentially pre-fill name or fetch item details based on barcode
      // For now, let's assume if a barcode is scanned, we can try to guess a name
      // form.setValue('name', `Scanned Item ${scannedData.barcode.substring(0,4)}`);
      console.log('Barcode scanned:', scannedData.barcode);
    }
    if (scannedData.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to start of day
      const expiry = new Date(scannedData.expiryDate);
      expiry.setHours(0,0,0,0); // Normalize expiry to start of day

      if (expiry.getTime() >= today.getTime()) {
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        form.setValue('shelfLife', diffDays >= 0 ? diffDays : 0);
      } else {
        form.setValue('shelfLife', 0); // Expired or past date
      }
      console.log('Expiry date extracted:', scannedData.expiryDate);
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
              Scan Item (Barcode/OCR)
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
