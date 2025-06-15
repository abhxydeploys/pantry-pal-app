
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
  today.setHours(0,0,0,0); // Normalize today to the start of the day
  const addedDate = new Date(item.addedDate); // Ensure it's a Date object
  addedDate.setHours(0,0,0,0); // Normalize addedDate to the start of the day

  const expiryDate = new Date(addedDate);
  expiryDate.setDate(addedDate.getDate() + item.shelfLife);

  const remainingDays = differenceInDays(expiryDate, today); // Number of *full days remaining AFTER today*
  
  let status: ExpiryStatus;
  let statusText: string;
  let statusColor: string;
  let icon: React.ReactNode;

  // Thresholds (consistent with PantryAlerts.tsx)
  const nearingExpiryThresholdDays = 7; // Items with 4-7 days remaining
  const expiresSoonThresholdDays = 3;   // Items with 0-3 days remaining

  if (remainingDays < 0) {
    status = 'expired';
    statusText = `Expired ${formatDistanceToNowStrict(expiryDate, { addSuffix: true })}`;
    statusColor = 'bg-destructive text-destructive-foreground';
    icon = <AlertTriangle className="h-4 w-4 text-destructive-foreground" />;
  } else {
    // Determine statusText first
    if (remainingDays === 0) {
      statusText = `Expires today`;
    } else {
      statusText = `Expires in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
    }

    // Determine status and color based on remainingDays
    if (remainingDays > nearingExpiryThresholdDays) { // More than 7 days left
      status = 'fresh';
      statusColor = 'bg-green-600 text-white';
      icon = <CheckCircle className="h-4 w-4 text-white" />;
    } else if (remainingDays > expiresSoonThresholdDays) { // 4-7 days left
      status = 'nearing-expiry';
      statusColor = 'bg-yellow-500 text-black';
      icon = <Clock className="h-4 w-4 text-black" />;
    } else { // 0-3 days left
      status = 'expires-soon';
      statusColor = 'bg-accent text-accent-foreground';
      icon = <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
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
