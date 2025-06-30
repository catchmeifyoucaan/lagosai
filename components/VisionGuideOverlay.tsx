
import React from 'react';
import { Camera, ScanLine, XCircle, LoaderCircle } from 'lucide-react';
import { ThemeColors } from '../types';

interface VisionGuideOverlayProps {
  videoElementRef: React.RefObject<HTMLVideoElement | null>;
  // canvasElementRef is used internally by App.tsx, no need to pass if not directly used here
  onScanSurroundings: () => void;
  onStopVisionGuide: () => void;
  isAnalyzingFrame: boolean;
  theme: ThemeColors;
}

const VisionGuideOverlay: React.FC<VisionGuideOverlayProps> = ({
  videoElementRef,
  onScanSurroundings,
  onStopVisionGuide,
  isAnalyzingFrame,
  theme,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-700 text-white">
        <h3 className="text-xl font-semibold mb-4 text-center text-blue-400">
          <Camera className="inline-block mr-2 w-6 h-6" /> Vision Guide Active
        </h3>
        
        <div className="aspect-video w-full rounded-lg overflow-hidden mb-4 border border-gray-600 shadow-inner">
          <video
            ref={videoElementRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label="Live camera feed for Vision Guide"
          />
        </div>

        {isAnalyzingFrame ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <LoaderCircle className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="text-lg text-gray-200">Analyzing your surroundings...</p>
            <p className="text-sm text-gray-400">Please wait a moment.</p>
          </div>
        ) : (
          <button
            onClick={onScanSurroundings}
            disabled={isAnalyzingFrame}
            className="w-full flex items-center justify-center px-6 py-3 rounded-lg text-lg font-semibold
                        transition-all duration-200 ease-in-out
                        bg-blue-600 hover:bg-blue-700 text-white
                        focus:outline-none focus:ring-4 focus:ring-blue-500
                        disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Scan current surroundings"
          >
            <ScanLine className="mr-3 w-6 h-6" />
            Scan Surroundings
          </button>
        )}

        <button
          onClick={onStopVisionGuide}
          className="absolute top-3 right-3 p-2 rounded-full 
                      text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Stop Vision Guide and close camera view"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
      <p className="mt-4 text-xs text-gray-400 text-center max-w-md">
        This Vision Guide provides AI-generated descriptions. Use with caution and awareness. It is not a substitute for traditional mobility aids.
      </p>
    </div>
  );
};

export default VisionGuideOverlay;