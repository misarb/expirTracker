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
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasScannedRef = useRef(false);
    const isScannerRunningRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Safely stop scanner
    const stopScanner = useCallback(async () => {
        if (scannerRef.current && isScannerRunningRef.current) {
            isScannerRunningRef.current = false;
            try {
                await scannerRef.current.stop();
            } catch (e) {
                console.log('Stop error (ignored):', e);
            }
            try {
                scannerRef.current.clear();
            } catch (e) {
                console.log('Clear error (ignored):', e);
            }
            scannerRef.current = null;
        }
    }, []);

    // Handle successful scan
    const handleScanSuccess = useCallback(async (decodedText: string, formatName: string) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;

        console.log('✅ Barcode detected:', decodedText, 'Format:', formatName);
        setStatusMessage(`✓ Scanned: ${decodedText}`);

        // Vibrate if available
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

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
        let scanAttempts = 0;

        const startScanner = async () => {
            try {
                setStatusMessage('Requesting camera permission...');

                // Request camera permission explicitly first
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop());

                if (!mounted) return;
                setStatusMessage('Starting scanner...');

                // Supported barcode formats
                const formatsToSupport = [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.QR_CODE,
                ];

                const scanner = new Html5Qrcode('barcode-reader', {
                    verbose: true, // Enable for debugging
                    formatsToSupport: formatsToSupport,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true // Use native API if available
                    }
                });
                scannerRef.current = scanner;

                // Use full container width for scanning (no qrbox restriction)
                const config = {
                    fps: 10,
                    // Remove qrbox to scan entire frame - this often helps with detection
                    // qrbox: undefined means scan the entire video frame
                    aspectRatio: 1.777778, // 16:9 ratio
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };

                await scanner.start(
                    { facingMode: 'environment' },
                    config,
                    (decodedText, decodedResult) => {
                        if (mounted && !hasScannedRef.current) {
                            const formatName = decodedResult.result?.format?.formatName || 'Unknown';
                            handleScanSuccess(decodedText, formatName);
                        }
                    },
                    () => {
                        // This fires constantly when no barcode is in frame
                        scanAttempts++;
                        if (mounted && scanAttempts % 30 === 0) {
                            // Update status every ~3 seconds
                            setStatusMessage('Scanning... Hold barcode steady in frame');
                        }
                    }
                );

                if (mounted) {
                    isScannerRunningRef.current = true;
                    setIsScanning(true);
                    setStatusMessage('📷 Point at barcode');
                }
            } catch (err) {
                console.error('Scanner error:', err);
                if (mounted) {
                    if (err instanceof Error) {
                        if (err.name === 'NotAllowedError') {
                            setError('Camera access denied. Please allow camera in browser settings and reload.');
                        } else if (err.name === 'NotFoundError') {
                            setError('No camera found on this device.');
                        } else if (err.name === 'NotReadableError') {
                            setError('Camera is busy. Close other apps using the camera.');
                        } else {
                            setError(`Error: ${err.message}`);
                        }
                    } else {
                        setError('Failed to start camera.');
                    }
                }
            }
        };

        const timeout = setTimeout(startScanner, 300);

        return () => {
            mounted = false;
            clearTimeout(timeout);
            if (scannerRef.current && isScannerRunningRef.current) {
                isScannerRunningRef.current = false;
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, [handleScanSuccess]);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white bg-black/80">
                <h2 className="text-lg font-bold">📷 Scan Barcode</h2>
                <button
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scanner Area - Full width */}
            <div className="flex-1 relative" ref={containerRef}>
                <div
                    id="barcode-reader"
                    className="w-full h-full"
                    style={{ minHeight: '400px' }}
                />

                {/* Scanning overlay with guides */}
                {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Center guide box */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-72 h-40 relative">
                                {/* Corner markers */}
                                <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-green-400" />
                                <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-green-400" />
                                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-green-400" />
                                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-green-400" />

                                {/* Animated scan line */}
                                <div className="absolute left-2 right-2 h-0.5 bg-green-400 shadow-[0_0_10px_2px_rgba(74,222,128,0.8)] animate-scan-line" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {!isScanning && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-white text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-lg">{statusMessage}</p>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
                        <div className="text-center text-white max-w-sm">
                            <div className="text-6xl mb-6">📷</div>
                            <p className="text-red-400 text-lg mb-6">{error}</p>
                            <button
                                onClick={handleClose}
                                className="px-8 py-3 bg-white text-black rounded-xl font-semibold text-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="p-4 bg-black/80 text-center">
                <p className="text-white font-medium">{statusMessage}</p>
                <p className="text-white/60 text-sm mt-1">
                    Center barcode in the green frame
                </p>
            </div>
        </div>
    );
}
