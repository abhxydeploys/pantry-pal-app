
'use client';

import type { PantryItem } from '@/components/pantry/PantryItem';
import PantryItemDisplay from '@/components/pantry/PantryItemDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PantryListProps {
  items: PantryItem[];
  onRemoveItem: (id: string) => void;
  isLoading: boolean;
}

const PantryListSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <Card key={i} className="flex flex-col justify-between">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-2/4" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-8 w-24" />
        </CardFooter>
      </Card>
    ))}
  </div>
);


export default function PantryList({ items, onRemoveItem, isLoading }: PantryListProps) {
  if (isLoading) {
    return (
      <ScrollArea className="h-[400px] md:h-[500px] w-full pr-4">
        <PantryListSkeleton />
      </ScrollArea>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p className="text-lg">Your pantry is empty.</p>
        <p>Add some items to get started!</p>
      </div>
    );
  }

  // Sort items: expired first, then by remaining days (soonest to expire first)
  const sortedItems = [...items].sort((a, b) => {
    const today = new Date();
    const expiryA = new Date(new Date(a.addedDate).setDate(new Date(a.addedDate).getDate() + a.shelfLife));
    const expiryB = new Date(new Date(b.addedDate).setDate(new Date(b.addedDate).getDate() + b.shelfLife));
    const remainingA = (expiryA.getTime() - today.getTime());
    const remainingB = (expiryB.getTime() - today.getTime());
    return remainingA - remainingB;
  });


  return (
    <ScrollArea className="h-[400px] md:h-[500px] w-full pr-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedItems.map(item => (
          <PantryItemDisplay key={item.id} item={item} onRemoveItem={onRemoveItem} />
        ))}
      </div>
    </ScrollArea>
  );
}
