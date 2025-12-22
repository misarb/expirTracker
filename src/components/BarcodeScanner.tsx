'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const [error, setError] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanAttempt, setLastScanAttempt] = useState<string>('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasScannedRef = useRef(false);
    const isScannerRunningRef = useRef(false);

    // Safely stop scanner
    const stopScanner = useCallback(async () => {
        if (scannerRef.current && isScannerRunningRef.current) {
            isScannerRunningRef.current = false;
            try {
                await scannerRef.current.stop();
            } catch {
                // Ignore stop errors
            }
            scannerRef.current = null;
        }
    }, []);

    // Handle successful scan
    const handleScanSuccess = useCallback(async (decodedText: string) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;

        console.log('Barcode scanned:', decodedText);
        await stopScanner();
        onScan(decodedText);
    }, [onScan, stopScanner]);

    // Handle close button
    const handleClose = useCallback(async () => {
        await stopScanner();
        onClose();
    }, [onClose, stopScanner]);

    useEffect(() => {
        let mounted = true;

        const startScanner = async () => {
            try {
                // Check if camera is available
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter(d => d.kind === 'videoinput');

                if (cameras.length === 0) {
                    throw new Error('No camera found');
                }

                // Supported barcode formats - focus on common product barcodes
                const formatsToSupport = [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.ITF,
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.DATA_MATRIX,
                ];

                const scanner = new Html5Qrcode('barcode-reader', {
                    verbose: false,
                    formatsToSupport: formatsToSupport,
                });
                scannerRef.current = scanner;

                // Get window dimensions for responsive scanning box
                const scanBoxWidth = Math.min(300, window.innerWidth - 80);
                const scanBoxHeight = Math.min(180, window.innerHeight / 3);

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 15, // Increased from 10 for faster detection
                        qrbox: { width: scanBoxWidth, height: scanBoxHeight },
                        aspectRatio: 1.5, // Better for barcodes (wider than tall)
                        disableFlip: false, // Allow mirrored scanning
                    },
                    (decodedText, decodedResult) => {
                        if (mounted && !hasScannedRef.current) {
                            console.log('Detected format:', decodedResult.result.format?.formatName);
                            handleScanSuccess(decodedText);
                        }
                    },
                    (errorMessage) => {
                        // Update scan attempt message for debugging
                        if (mounted && errorMessage.includes('No MultiFormat Readers')) {
                            setLastScanAttempt('Searching for barcode...');
                        }
                    }
                );

                if (mounted) {
                    isScannerRunningRef.current = true;
                    setIsScanning(true);
                    setLastScanAttempt('Ready to scan');
                }
            } catch (err) {
                console.error('Scanner error:', err);
                if (mounted) {
                    if (err instanceof Error) {
                        if (err.name === 'NotAllowedError') {
                            setError('Camera permission denied. Please allow camera access in your browser settings.');
                        } else if (err.name === 'NotFoundError' || err.message.includes('No camera')) {
                            setError('No camera found. Please connect a camera.');
                        } else if (err.message.includes('NotReadableError') || err.message.includes('Could not start')) {
                            setError('Camera is in use by another app. Please close other apps using the camera.');
                        } else {
                            setError(`Camera error: ${err.message}`);
                        }
                    } else {
                        setError('Unable to start camera. Please try again.');
                    }
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timeout = setTimeout(startScanner, 200);

        return () => {
            mounted = false;
            clearTimeout(timeout);
            // Use sync version for cleanup
            if (scannerRef.current && isScannerRunningRef.current) {
                isScannerRunningRef.current = false;
                scannerRef.current.stop().catch(() => { });
                scannerRef.current = null;
            }
        };
    }, [handleScanSuccess]);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
                <h2 className="text-lg font-bold">📷 Scan Barcode</h2>
                <button
                    onClick={handleClose}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative w-full max-w-md">
                    <div
                        id="barcode-reader"
                        className="w-full rounded-2xl overflow-hidden bg-gray-900"
                        style={{ minHeight: '300px' }}
                    />

                    {/* Animated Scan Line Overlay - shows when scanning */}
                    {isScanning && (
                        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                            {/* Corner markers */}
                            <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-green-400 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-green-400 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-green-400 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-green-400 rounded-br-lg" />

                            {/* Animated scan line */}
                            <div className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_3px_rgba(74,222,128,0.8)] animate-scan-line" />
                        </div>
                    )}

                    {!isScanning && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                            <div className="text-white text-center">
                                <div className="animate-spin w-10 h-10 border-3 border-white border-t-transparent rounded-full mx-auto mb-3" />
                                <p className="text-lg">Starting camera...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl p-4">
                            <div className="text-center text-white">
                                <div className="text-5xl mb-4">📷</div>
                                <p className="text-red-400 mb-4 text-lg">{error}</p>
                                <button
                                    onClick={handleClose}
                                    className="px-8 py-3 bg-white text-black rounded-xl font-medium text-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="p-6 text-center text-white">
                <p className="text-base font-medium">Point camera at product barcode</p>
                <p className="text-sm mt-1 opacity-70">Hold steady and center the barcode in the frame</p>
                {lastScanAttempt && (
                    <p className="text-xs mt-2 text-green-400">{lastScanAttempt}</p>
                )}
                <p className="text-xs mt-2 opacity-50">EAN-13, UPC-A, EAN-8, Code 128 supported</p>
            </div>
        </div>
    );
}
