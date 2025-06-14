import { z } from 'zod';

export const NewPantryItemSchema = z.object({
  name: z.string().min(1, { message: "Item name cannot be empty." }).max(100, { message: "Item name is too long." }),
  shelfLife: z.number().int().min(1, { message: "Shelf life must be at least 1 day." }).max(3650, { message: "Shelf life seems too long." }), // Max 10 years
});

export type NewPantryItem = z.infer<typeof NewPantryItemSchema>;

export interface PantryItem extends NewPantryItem {
  id: string;
  addedDate: Date;
}

export type ExpiryStatus = 'fresh' | 'nearing-expiry' | 'expires-soon' | 'expired';
