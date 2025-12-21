'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const [error, setError] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mounted = true;

        const startScanner = async () => {
            try {
                if (!containerRef.current) return;

                const scanner = new Html5Qrcode('barcode-reader');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                    },
                    (decodedText) => {
                        // Success - barcode scanned
                        if (mounted) {
                            onScan(decodedText);
                            scanner.stop().catch(console.error);
                        }
                    },
                    () => {
                        // Ignore scan errors (no barcode found in frame)
                    }
                );

                if (mounted) {
                    setIsScanning(true);
                }
            } catch (err) {
                console.error('Scanner error:', err);
                if (mounted) {
                    setError('Unable to access camera. Please grant camera permission.');
                }
            }
        };

        startScanner();

        return () => {
            mounted = false;
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
                <h2 className="text-lg font-bold">Scan Barcode</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative w-full max-w-sm">
                    <div
                        id="barcode-reader"
                        ref={containerRef}
                        className="w-full rounded-2xl overflow-hidden"
                    />

                    {!isScanning && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                            <div className="text-white text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                                <p>Starting camera...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl p-4">
                            <div className="text-center text-white">
                                <p className="text-red-400 mb-4">{error}</p>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white text-black rounded-xl font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="p-6 text-center text-white/80">
                <p className="text-sm">Point camera at product barcode</p>
                <p className="text-xs mt-1 opacity-60">EAN-13, UPC-A, and other formats supported</p>
            </div>
        </div>
    );
}
