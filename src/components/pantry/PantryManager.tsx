
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PantryItem, NewPantryItem } from '@/components/pantry/PantryItem';
import { getPantryItems, addPantryItem, removePantryItem } from '@/lib/pantry-service';
import PantryItemForm from '@/components/pantry/PantryItemForm';
import PantryList from '@/components/pantry/PantryList';
import RecipeSuggestions from '@/components/pantry/RecipeSuggestions';
import PantryAlerts from '@/components/pantry/PantryAlerts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, PackagePlus, ListChecks, Loader2, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export default function PantryManager() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const { user, initialLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !initialLoading) {
      setIsLoadingItems(true);
      getPantryItems()
        .then(items => {
          setPantryItems(items);
        })
        .catch(error => {
          console.error("Failed to load pantry items:", error);
          toast({
            variant: "destructive",
            title: "Error Loading Pantry",
            description: "Could not fetch your pantry items. Please try again later.",
          });
        })
        .finally(() => {
          setIsLoadingItems(false);
        });
    } else if (!user && !initialLoading) {
      setPantryItems([]);
      setIsLoadingItems(false);
    }
  }, [user, initialLoading, toast]);

  useEffect(() => {
    // Redirect to auth page if not logged in after initial load check.
    if (!initialLoading && !user) {
      router.push('/auth');
    }
  }, [initialLoading, user, router]);

  const handleAddItem = useCallback(async (newItem: NewPantryItem) => {
    if (!user) return;
    try {
      const addedItem = await addPantryItem(newItem);
      setPantryItems(prevItems => [...prevItems, addedItem]);
    } catch (error) {
      console.error("Failed to add item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add the item to your pantry.",
      });
    }
  }, [user, toast]);

  const handleRemoveItem = useCallback(async (id: string) => {
     if (!user) return;
    
    const originalItems = [...pantryItems];
    setPantryItems(prevItems => prevItems.filter(item => item.id !== id));

    try {
      await removePantryItem(id);
    } catch (error) {
       console.error("Failed to remove item:", error);
       setPantryItems(originalItems);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to remove the item. Please try again.",
       });
    }
  }, [user, pantryItems, toast]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The useEffect hooks will handle clearing items and redirecting.
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "There was a problem signing out.",
      });
    }
  };
  
  if (initialLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl text-muted-foreground">Loading Your Pantry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="bg-card border-b rounded-b-lg shadow-sm p-4 sticky top-0 z-10 bg-opacity-80 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Utensils className="w-8 h-8 text-primary" />
             <div>
                <h1 className="text-2xl font-bold font-headline text-primary">PantryPal</h1>
                <p className="text-sm text-muted-foreground">Welcome, {user.displayName || user.email}!</p>
             </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 md:px-0 space-y-8">
          <PantryAlerts items={pantryItems} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
              <Card className="shadow-lg rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-xl">
                    <PackagePlus className="w-6 h-6 text-primary" />
                    Add New Item
                  </CardTitle>
                  <CardDescription>Enter new items or scan them.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PantryItemForm onAddItem={handleAddItem} />
                </CardContent>
              </Card>

              <Card className="shadow-lg rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-xl">
                    <Utensils className="w-6 h-6 text-primary" />
                    Recipe Ideas
                  </CardTitle>
                  <CardDescription>Get AI-powered recipe suggestions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecipeSuggestions pantryItemNames={pantryItems.map(item => item.name)} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="shadow-lg rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-xl">
                    <ListChecks className="w-6 h-6 text-primary" />
                    Your Pantry
                  </CardTitle>
                  <CardDescription>View, manage, and track your food items.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PantryList items={pantryItems} onRemoveItem={handleRemoveItem} isLoading={isLoadingItems} />
                </CardContent>
              </Card>
            </div>
          </div>
      </main>
    </div>
  );
}
