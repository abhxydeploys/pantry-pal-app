'use client';

import type { PantryItem } from '@/components/pantry/PantryItem';
import PantryItemDisplay from '@/components/pantry/PantryItemDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PantryListProps {
  items: PantryItem[];
  onRemoveItem: (id: string) => void;
}

export default function PantryList({ items, onRemoveItem }: PantryListProps) {
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
