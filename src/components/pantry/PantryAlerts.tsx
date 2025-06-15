
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

  const nearingExpiryThresholdDays = 7;
  const expiresSoonThresholdDays = 3;

  if (remainingDays < 0) {
    return {
      remainingDays,
      status: 'expired',
      statusText: `Expired ${formatDistanceToNowStrict(expiryDate, { addSuffix: true })}. Added on ${format(addedDate, "MMM dd, yyyy")}.`,
      alertVariant: 'destructive',
      icon: <XCircle className="h-5 w-5" />,
    };
  } else if (remainingDays <= expiresSoonThresholdDays) {
    return {
      remainingDays,
      status: 'expires-soon',
      statusText: `Expires in ${remainingDays + 1} day(s)! Use very soon. Added on ${format(addedDate, "MMM dd, yyyy")}.`,
      alertVariant: 'destructive',
      icon: <AlertTriangle className="h-5 w-5" />,
    };
  } else if (remainingDays <= nearingExpiryThresholdDays) {
    return {
      remainingDays,
      status: 'nearing-expiry',
      statusText: `Nearing expiry: ${remainingDays + 1} day(s) left. Plan to use it. Added on ${format(addedDate, "MMM dd, yyyy")}.`,
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
