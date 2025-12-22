'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const [error, setError] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Initializing camera...');
    const [detectedCodes, setDetectedCodes] = useState<string[]>([]);
    const hasScannedRef = useRef(false);
    const scannerContainerRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDetected = useCallback((result: any) => {
        if (hasScannedRef.current) return;

        const code = result?.codeResult?.code;
        if (!code || typeof code !== 'string') return;

        // Add to detected codes for validation (need same code detected multiple times)
        setDetectedCodes(prev => {
            const newCodes = [...prev, code].slice(-5); // Keep last 5

            // If we have 2 consecutive identical codes, it's a valid scan
            if (newCodes.length >= 2) {
                const lastTwo = newCodes.slice(-2);
                if (lastTwo.every(c => c === code)) {
                    hasScannedRef.current = true;

                    console.log('✅ Barcode confirmed:', code, 'Format:', result.codeResult.format);
                    setStatusMessage(`✓ Scanned: ${code}`);

                    // Vibrate if available
                    if (navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }

                    // Stop scanner and callback
                    Quagga.stop();
                    onScan(code);
                }
            }
            return newCodes;
        });
    }, [onScan]);

    const handleClose = useCallback(() => {
        try {
            Quagga.stop();
        } catch (e) {
            console.log('Quagga stop error:', e);
        }
        onClose();
    }, [onClose]);

    useEffect(() => {
        let mounted = true;

        const initScanner = async () => {
            if (!scannerContainerRef.current) return;

            try {
                setStatusMessage('Requesting camera access...');

                await new Promise<void>((resolve, reject) => {
                    Quagga.init({
                        inputStream: {
                            name: "Live",
                            type: "LiveStream",
                            target: scannerContainerRef.current!,
                            constraints: {
                                facingMode: "environment",
                                width: { min: 640, ideal: 1280, max: 1920 },
                                height: { min: 480, ideal: 720, max: 1080 },
                            },
                        },
                        locator: {
                            patchSize: "medium",
                            halfSample: true,
                        },
                        numOfWorkers: navigator.hardwareConcurrency || 4,
                        frequency: 20,
                        decoder: {
                            readers: [
                                "ean_reader",
                                "ean_8_reader",
                                "upc_reader",
                                "upc_e_reader",
                                "code_128_reader",
                                "code_39_reader",
                            ],
                        },
                        locate: true,
                    }, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });

                if (mounted) {
                    Quagga.start();
                    Quagga.onDetected(handleDetected);
                    setIsScanning(true);
                    setStatusMessage('📷 Point at barcode');
                }
            } catch (err) {
                console.error('Quagga init error:', err);
                if (mounted) {
                    if (err instanceof Error) {
                        if (err.message.includes('Permission denied') || err.message.includes('NotAllowed')) {
                            setError('Camera access denied. Please allow camera permission.');
                        } else if (err.message.includes('NotFound')) {
                            setError('No camera found on this device.');
                        } else {
                            setError(`Camera error: ${err.message}`);
                        }
                    } else {
                        setError('Failed to start camera. Please try again.');
                    }
                }
            }
        };

        const timeout = setTimeout(initScanner, 100);

        return () => {
            mounted = false;
            clearTimeout(timeout);
            try {
                Quagga.offDetected(handleDetected);
                Quagga.stop();
            } catch {
                // Ignore cleanup errors
            }
        };
    }, [handleDetected]);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white bg-black/90 z-10">
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

            {/* Scanner Area */}
            <div className="flex-1 relative overflow-hidden">
                <div
                    ref={scannerContainerRef}
                    className="absolute inset-0"
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />

                {/* Scanning overlay */}
                {isScanning && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {/* Center guide box */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-80 h-44 relative border-2 border-white/30 rounded-lg">
                                {/* Corner markers */}
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-green-400 rounded-tl" />
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-green-400 rounded-tr" />
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-green-400 rounded-bl" />
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-green-400 rounded-br" />

                                {/* Animated scan line */}
                                <div className="absolute left-2 right-2 h-1 bg-green-400 shadow-[0_0_15px_3px_rgba(74,222,128,0.8)] animate-scan-line rounded-full" />
                            </div>
                        </div>

                        {/* Dark overlay around scan area */}
                        <div className="absolute inset-0 bg-black/40" style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, calc(50% - 160px) calc(50% - 88px), calc(50% - 160px) calc(50% + 88px), calc(50% + 160px) calc(50% + 88px), calc(50% + 160px) calc(50% - 88px), calc(50% - 160px) calc(50% - 88px))'
                        }} />
                    </div>
                )}

                {/* Loading state */}
                {!isScanning && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                        <div className="text-white text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-lg">{statusMessage}</p>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black p-6 z-20">
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
            <div className="p-4 bg-black/90 text-center z-10">
                <p className="text-white font-medium text-lg">{statusMessage}</p>
                <p className="text-white/60 text-sm mt-1">
                    Hold barcode inside the frame
                </p>
                {detectedCodes.length > 0 && (
                    <p className="text-green-400 text-xs mt-1">
                        Detecting: {detectedCodes[detectedCodes.length - 1]}
                    </p>
                )}
            </div>
        </div>
    );
}
