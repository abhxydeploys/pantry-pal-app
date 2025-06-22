'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle, ScanLine, Loader2, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { extractItemDetailsAction } from '@/app/actions';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (scannedData: { barcode?: string; expiryDate?: string; productName?: string }) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScanComplete }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For capturing frames
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
      setHasCameraPermission(null);
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

  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    const context = canvas.getContext('2d');
    if (!context) {
      setIsProcessing(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not capture image.' });
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data as a data URI
    const photoDataUri = canvas.toDataURL('image/jpeg');

    const result = await extractItemDetailsAction(photoDataUri);

    setIsProcessing(false);

    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
    } else if (result.itemFound) {
      toast({ title: 'Success!', description: 'Extracted item details.' });
      onScanComplete({
        barcode: result.barcode,
        expiryDate: result.expiryDate,
        productName: result.productName,
      });
      onClose();
    } else {
      toast({
        variant: 'destructive',
        title: 'Nothing Found',
        description: "Could not detect a barcode or expiry date. Please try a clearer picture.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Item Scanner
          </DialogTitle>
          <DialogDescription>
            Point your camera at the item's barcode and expiry date, then capture the image for AI analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden border">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {hasCameraPermission === true && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <ScanLine className="w-1/2 h-1/2 text-primary/30 animate-pulse" />
                </div>
            )}
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="mt-2 text-sm">Analyzing image...</p>
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
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleCaptureAndAnalyze} disabled={!hasCameraPermission || isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Capture & Analyze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
