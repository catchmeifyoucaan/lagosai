
import React from 'react';
import { Camera, ScanLine, XCircle, LoaderCircle } from 'lucide-react';
import { ThemeColors } from '../types';

interface VisionGuideOverlayProps {
  videoElementRef: React.RefObject<HTMLVideoElement>;
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
    <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center p-4 ${theme.bg} bg-opacity-95 backdrop-blur-sm`}>
      <div className={`relative w-full max-w-2xl ${theme.card} p-4 sm:p-6 rounded-xl shadow-2xl border`}>
        <h3 className={`text-xl font-semibold mb-4 text-center ${theme.primaryAccent}`}>
          <Camera className="inline-block mr-2 w-6 h-6" /> Vision Guide Active
        </h3>
        
        <div className="aspect-video w-full rounded-lg overflow-hidden mb-4 border border-gray-600/50 shadow-inner">
          <video
            ref={videoElementRef}
            autoPlay
            playsInline
            muted // Important for autoplay in many browsers
            className="w-full h-full object-cover"
            aria-label="Live camera feed for Vision Guide"
          />
        </div>

        {isAnalyzingFrame ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <LoaderCircle className={`w-12 h-12 ${theme.secondaryAccent} animate-spin`} />
            <p className={`text-lg ${theme.text}`}>Analyzing your surroundings...</p>
            <p className={`text-sm ${theme.muted}`}>Please wait a moment.</p>
          </div>
        ) : (
          <button
            onClick={onScanSurroundings}
            disabled={isAnalyzingFrame}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-lg font-semibold
                        transition-all duration-200 ease-in-out
                        ${theme.text} bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600
                        focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-700
                        disabled:opacity-60 disabled:cursor-not-allowed`}
            aria-label="Scan current surroundings"
          >
            <ScanLine className="mr-3 w-6 h-6" />
            Scan Surroundings
          </button>
        )}

        <button
          onClick={onStopVisionGuide}
          className={`absolute top-3 right-3 p-2 rounded-full 
                      ${theme.muted} hover:bg-red-500/20 hover:text-red-500 transition-colors`}
          aria-label="Stop Vision Guide and close camera view"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
      <p className={`mt-4 text-xs ${theme.muted} text-center max-w-md`}>
        This Vision Guide provides AI-generated descriptions. Use with caution and awareness. It is not a substitute for traditional mobility aids.
      </p>
    </div>
  );
};

export default VisionGuideOverlay;