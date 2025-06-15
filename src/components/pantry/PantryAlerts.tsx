
'use client';

import type { PantryItem, ExpiryStatus } from '@/components/pantry/PantryItem';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BellRing, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { differenceInDays, formatDistanceToNowStrict, format } from 'date-fns';

interface PantryAlertsProps {
  items: PantryItem[];
}

interface AlertInfo {
  remainingDays: number;
  status: ExpiryStatus;
  statusText: string;
  alertVariant: 'default' | 'destructive';
  icon: React.ReactNode;
}

const getAlertInfoForItem = (item: PantryItem): AlertInfo | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const addedDate = new Date(item.addedDate);
  addedDate.setHours(0, 0, 0, 0);

  const expiryDate = new Date(addedDate);
  expiryDate.setDate(addedDate.getDate() + item.shelfLife);

  const remainingDays = differenceInDays(expiryDate, today);

  const nearingExpiryThresholdDays = 7; // Items with 4-7 days remaining
  const expiresSoonThresholdDays = 3; // Items with 0-3 days remaining

  const formattedAddedDate = format(addedDate, "MMM dd, yyyy");

  if (remainingDays < 0) {
    return {
      remainingDays,
      status: 'expired',
      statusText: `Expired ${formatDistanceToNowStrict(expiryDate, { addSuffix: true })}. Added on ${formattedAddedDate}.`,
      alertVariant: 'destructive',
      icon: <XCircle className="h-5 w-5" />,
    };
  } else if (remainingDays <= expiresSoonThresholdDays) { // 0-3 days remaining
    let text: string;
    if (remainingDays === 0) {
      text = `Expires today! Use immediately. Added on ${formattedAddedDate}.`;
    } else {
      text = `Expires in ${remainingDays} day${remainingDays === 1 ? '' : 's'}! Use very soon. Added on ${formattedAddedDate}.`;
    }
    return {
      remainingDays,
      status: 'expires-soon',
      statusText: text,
      alertVariant: 'destructive',
      icon: <AlertTriangle className="h-5 w-5" />,
    };
  } else if (remainingDays <= nearingExpiryThresholdDays) { // 4-7 days remaining
    return {
      remainingDays,
      status: 'nearing-expiry',
      statusText: `Nearing expiry: ${remainingDays} day${remainingDays === 1 ? '' : 's'} left. Plan to use it. Added on ${formattedAddedDate}.`,
      alertVariant: 'default',
      icon: <Clock className="h-5 w-5" />,
    };
  }
  return null; // No alert needed for this item
};

export default function PantryAlerts({ items }: PantryAlertsProps) {
  const activeAlerts = items
    .map(item => ({ item, info: getAlertInfoForItem(item) }))
    .filter(alertData => alertData.info !== null)
    .sort((a, b) => a.info!.remainingDays - b.info!.remainingDays); // Sort by urgency (most urgent first)

  if (activeAlerts.length === 0) {
    return null; // Don't render anything if no alerts
  }

  return (
    <Card className="shadow-xl rounded-lg border-2 border-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl text-accent">
          <BellRing className="w-7 h-7" />
          Expiry Alerts
        </CardTitle>
        <CardDescription>
          Heads up! Some items need your attention to prevent food waste.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {activeAlerts.map(({ item, info }) => (
          <Alert key={item.id} variant={info!.alertVariant}>
            {info!.icon}
            <AlertTitle>{item.name}</AlertTitle>
            <AlertDescription>{info!.statusText}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
