'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle, ScanLine, CalendarCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (scannedData: { barcode?: string; expiryDate?: string }) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScanComplete }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      // Stop video stream when modal is closed
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use the scanner.',
        });
      }
    };

    getCameraPermission();

    return () => {
      // Cleanup: Stop video stream when component unmounts or isOpen becomes false
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, toast]);

  const handleSimulateScan = () => {
    // Simulate a successful scan
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 7); // Random future date (7-36 days)
    
    onScanComplete({
      barcode: `01234${Math.floor(Math.random() * 90000) + 10000}789`, // Dummy barcode
      expiryDate: format(futureDate, 'yyyy-MM-dd'), // Format as YYYY-MM-DD
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Barcode & OCR Scanner
          </DialogTitle>
          <DialogDescription>
            Point your camera at the item's barcode or expiry date.
            Currently, this is a simulation.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden border">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            {hasCameraPermission === true && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <ScanLine className="w-1/2 h-1/2 text-primary/30 animate-pulse" />
                </div>
            )}
          </div>

          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Camera permission is denied or unavailable. Please enable it in your browser settings.
              </AlertDescription>
            </Alert>
          )}
           {hasCameraPermission === null && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Requesting Camera Access</AlertTitle>
              <AlertDescription>
                Please allow camera access when prompted by your browser.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSimulateScan} disabled={!hasCameraPermission}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            Simulate Scan & Get Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
