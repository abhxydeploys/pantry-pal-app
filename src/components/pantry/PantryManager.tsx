
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PantryItem, NewPantryItem } from '@/components/pantry/PantryItem';
import PantryItemForm from '@/components/pantry/PantryItemForm';
import PantryList from '@/components/pantry/PantryList';
import RecipeSuggestions from '@/components/pantry/RecipeSuggestions';
import PantryAlerts from '@/components/pantry/PantryAlerts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, PackagePlus, ListChecks, Loader2, Sparkles, LogOut, LogIn, ShieldAlert } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export default function PantryManager() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user, loading: authLoading, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      try {
        const storedItems = localStorage.getItem(`pantryItems_${user.uid}`);
        if (storedItems) {
          setPantryItems(JSON.parse(storedItems).map((item: any) => ({
            ...item,
            addedDate: new Date(item.addedDate) 
          })));
        } else {
          setPantryItems([]); // Clear items if user changes and no items for them
        }
      } catch (error) {
        console.error("Failed to load pantry items from localStorage", error);
      }
    } else if (!authLoading && !initialLoading) { // If not loading and no user, clear items
        setPantryItems([]);
        localStorage.removeItem('pantryItems'); // Clear generic key if any
    }
  }, [user, authLoading, initialLoading]);

  useEffect(() => {
    if (isMounted && user) {
      try {
        localStorage.setItem(`pantryItems_${user.uid}`, JSON.stringify(pantryItems));
      } catch (error) {
        console.error("Failed to save pantry items to localStorage", error);
      }
    }
  }, [pantryItems, isMounted, user]);

  const handleAddItem = useCallback((newItem: NewPantryItem) => {
    if (!user) return; // Should not happen if UI is protected
    setPantryItems(prevItems => {
      const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`;
      return [
        ...prevItems,
        { ...newItem, id: uniqueId, addedDate: new Date() }
      ];
    });
  }, [user]);

  const handleRemoveItem = useCallback((id: string) => {
     if (!user) return;
    setPantryItems(prevItems => prevItems.filter(item => item.id !== id));
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // setUser(null) is handled by onAuthStateChanged in AuthContext
      setPantryItems([]); // Clear local state on logout
      // router.push('/auth'); // Redirect to login, or let AuthContext handle view
    } catch (error) {
      console.error("Error signing out: ", error);
      // Potentially show a toast error
    }
  };
  
  // Display loading spinner while auth state or initial mount is resolving
  if (initialLoading || !isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl text-muted-foreground">Loading Your Pantry...</p>
      </div>
    );
  }

  // If not authenticated after loading, show login prompt
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-8">
        <ShieldAlert className="h-16 w-16 text-accent mb-6" />
        <h2 className="text-3xl font-bold text-primary mb-3">Access Denied</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Please log in to manage your pantry and discover delicious recipes.
        </p>
        <Link href="/auth" passHref>
          <Button size="lg">
            <LogIn className="mr-2 h-5 w-5" />
            Login or Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="space-y-8">
      <header className="text-center pt-8 pb-4">
        <div className="flex justify-between items-center">
          <div></div> {/* Spacer */}
          <h1 className="flex items-center justify-center text-4xl md:text-5xl font-bold font-headline text-primary">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 mr-3 text-accent" />
            PantryPal
          </h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
        <p className="text-lg text-muted-foreground mt-2">Welcome, {user.displayName || user.email}! Manage your smart kitchen.</p>
      </header>

      <PantryAlerts items={pantryItems} />

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
