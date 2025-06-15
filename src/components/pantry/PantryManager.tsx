
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PantryItem, NewPantryItem } from '@/components/pantry/PantryItem';
import PantryItemForm from '@/components/pantry/PantryItemForm';
import PantryList from '@/components/pantry/PantryList';
import RecipeSuggestions from '@/components/pantry/RecipeSuggestions';
import PantryAlerts from '@/components/pantry/PantryAlerts'; // Import the new component
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Utensils, PackagePlus, ListChecks, Loader2, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PantryManager() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isMounted, setIsMounted] = useState(false); // To prevent SSR/localStorage mismatch

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedItems = localStorage.getItem('pantryItems');
      if (storedItems) {
        setPantryItems(JSON.parse(storedItems).map((item: any) => ({
          ...item,
          addedDate: new Date(item.addedDate) 
        })));
      }
    } catch (error) {
      console.error("Failed to load pantry items from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
      } catch (error) {
        console.error("Failed to save pantry items to localStorage", error);
      }
    }
  }, [pantryItems, isMounted]);

  const handleAddItem = useCallback((newItem: NewPantryItem) => {
    setPantryItems(prevItems => {
      const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`;
      return [
        ...prevItems,
        { ...newItem, id: uniqueId, addedDate: new Date() }
      ];
    });
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setPantryItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl text-muted-foreground">Loading Your Pantry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center pt-8 pb-4">
        <h1 className="flex items-center justify-center text-4xl md:text-5xl font-bold font-headline text-primary">
          <Sparkles className="w-10 h-10 md:w-12 md:h-12 mr-3 text-accent" />
          PantryPal
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Your Smart Kitchen Assistant for Less Waste & More Taste!</p>
      </header>

      {isMounted && <PantryAlerts items={pantryItems} />} {/* Render PantryAlerts conditionally after mount */}

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <Card className="shadow-xl rounded-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <PackagePlus className="w-7 h-7 text-primary" />
              Add Item
            </CardTitle>
            <CardDescription>Enter new items or scan them using your camera.</CardDescription>
          </CardHeader>
          <CardContent>
            <PantryItemForm onAddItem={handleAddItem} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Utensils className="w-7 h-7 text-primary" />
                Recipe Ideas
              </CardTitle>
              <CardDescription>Get AI-powered recipe suggestions based on your pantry.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecipeSuggestions pantryItemNames={pantryItems.map(item => item.name)} />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator className="my-8" />

      <Card className="shadow-xl rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <ListChecks className="w-7 h-7 text-primary" />
            Your Pantry Items
          </CardTitle>
          <CardDescription>View, manage, and track expiry of your food items.</CardDescription>
        </CardHeader>
        <CardContent>
          <PantryList items={pantryItems} onRemoveItem={handleRemoveItem} />
        </CardContent>
      </Card>
    </div>
  );
}
