'use client';

import type { PantryItem, ExpiryStatus } from '@/components/pantry/PantryItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, CalendarDays, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNowStrict, differenceInDays, format } from 'date-fns';

interface PantryItemDisplayProps {
  item: PantryItem;
  onRemoveItem: (id: string) => void;
}

const calculateExpiryDetails = (item: PantryItem): { remainingDays: number; status: ExpiryStatus; statusText: string; statusColor: string; icon: React.ReactNode } => {
  const today = new Date();
  const addedDate = new Date(item.addedDate); // Ensure it's a Date object
  const expiryDate = new Date(addedDate);
  expiryDate.setDate(addedDate.getDate() + item.shelfLife);

  const remainingDays = differenceInDays(expiryDate, today);
  
  let status: ExpiryStatus;
  let statusText: string;
  let statusColor: string;
  let icon: React.ReactNode;

  if (remainingDays < 0) {
    status = 'expired';
    statusText = `Expired ${formatDistanceToNowStrict(expiryDate, { addSuffix: true })}`;
    statusColor = 'bg-destructive text-destructive-foreground';
    icon = <AlertTriangle className="h-4 w-4 text-destructive-foreground" />;
  } else {
    const shelfLifeRatio = item.shelfLife > 0 ? remainingDays / item.shelfLife : 0;
    if (shelfLifeRatio > 2/3) {
      status = 'fresh';
      statusText = `Expires in ${remainingDays + 1} day(s)`;
      statusColor = 'bg-green-500 text-white';
      icon = <CheckCircle className="h-4 w-4 text-white" />;
    } else if (shelfLifeRatio >= 1/3) {
      status = 'nearing-expiry';
      statusText = `Expires in ${remainingDays + 1} day(s)`;
      statusColor = 'bg-yellow-500 text-black';
      icon = <Clock className="h-4 w-4 text-black" />;
    } else {
      status = 'expires-soon';
      statusText = `Expires in ${remainingDays + 1} day(s)`;
      statusColor = 'bg-orange-500 text-white'; // Using the requested accent color family via orange
      icon = <AlertTriangle className="h-4 w-4 text-white" />;
    }
  }
  
  return { remainingDays, status, statusText, statusColor, icon };
};


export default function PantryItemDisplay({ item, onRemoveItem }: PantryItemDisplayProps) {
  const { statusText, statusColor, icon } = calculateExpiryDetails(item);
  const addedDateFormatted = format(new Date(item.addedDate), "MMM dd, yyyy");

  return (
    <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground pt-1">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          Added: {addedDateFormatted} (Shelf life: {item.shelfLife} days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge className={`${statusColor} flex items-center gap-1.5 py-1 px-2.5 text-sm`}>
          {icon}
          {statusText}
        </Badge>
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveItem(item.id)}
          aria-label={`Remove ${item.name} from pantry`}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
}
