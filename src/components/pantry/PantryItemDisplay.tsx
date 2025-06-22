
'use client';

import type { PantryItem, ExpiryStatus } from '@/components/pantry/PantryItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, CalendarDays, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNowStrict, differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PantryItemDisplayProps {
  item: PantryItem;
  onRemoveItem: (id: string) => void;
}

const calculateExpiryDetails = (item: PantryItem): { 
  remainingDays: number; 
  status: ExpiryStatus; 
  statusText: string; 
  statusColor: string; 
  borderColor: string;
  icon: React.ReactNode; 
} => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const addedDate = new Date(item.addedDate);
  addedDate.setHours(0,0,0,0);

  const expiryDate = new Date(addedDate);
  expiryDate.setDate(addedDate.getDate() + item.shelfLife);

  const remainingDays = differenceInDays(expiryDate, today);
  
  let status: ExpiryStatus;
  let statusText: string;
  let statusColor: string;
  let borderColor: string;
  let icon: React.ReactNode;

  const nearingExpiryThresholdDays = 7;
  const expiresSoonThresholdDays = 3;

  if (remainingDays < 0) {
    status = 'expired';
    statusText = `Expired ${formatDistanceToNowStrict(expiryDate, { addSuffix: true })}`;
    statusColor = 'bg-destructive text-destructive-foreground';
    borderColor = 'border-destructive';
    icon = <AlertTriangle className="h-4 w-4 text-destructive-foreground" />;
  } else {
    if (remainingDays === 0) {
      statusText = `Expires today`;
    } else {
      statusText = `Expires in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
    }

    if (remainingDays > nearingExpiryThresholdDays) {
      status = 'fresh';
      statusColor = 'bg-primary text-primary-foreground';
      borderColor = 'border-primary';
      icon = <CheckCircle className="h-4 w-4 text-primary-foreground" />;
    } else if (remainingDays > expiresSoonThresholdDays) {
      status = 'nearing-expiry';
      statusColor = 'bg-yellow-500 text-black';
      borderColor = 'border-yellow-500';
      icon = <Clock className="h-4 w-4 text-black" />;
    } else {
      status = 'expires-soon';
      statusColor = 'bg-accent text-accent-foreground';
      borderColor = 'border-accent';
      icon = <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
    }
  }
  
  return { remainingDays, status, statusText, statusColor, borderColor, icon };
};


export default function PantryItemDisplay({ item, onRemoveItem }: PantryItemDisplayProps) {
  const { statusText, statusColor, borderColor, icon } = calculateExpiryDetails(item);
  const addedDateFormatted = format(new Date(item.addedDate), "MMM dd, yyyy");

  return (
    <Card className={cn("flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-105", borderColor)}>
      <CardHeader>
        <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground pt-1">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          Added: {addedDateFormatted} (Shelf life: {item.shelfLife} days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge className={cn("flex items-center gap-1.5 py-1 px-2.5 text-sm", statusColor)}>
          {icon}
          {statusText}
        </Badge>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemoveItem(item.id)}
          aria-label={`Remove ${item.name} from pantry`}
          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
}
