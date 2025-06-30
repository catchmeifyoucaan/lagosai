import React from 'react';
import { ThemeColors } from '../types';
import { X } from 'lucide-react';

interface DownloadModalProps {
  theme: ThemeColors;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ theme, onClose }) => {
  // Replace '#' with your actual app store and download links
  const playStoreLink = '#';
  const appStoreLink = '#';
  const directDownloadLink = '#';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Close download modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-blue-400 mb-2">
            Get the Lagos Oracle App
          </h2>
          <p className="text-gray-300 mb-6">
            Experience the Oracle on your mobile device for the best performance and features.
          </p>
          <div className="space-y-3">
            <a href={playStoreLink} target="_blank" rel="noopener noreferrer" className="block w-full py-3 px-4 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white">
              Get on Google Play
            </a>
            <a href={appStoreLink} target="_blank" rel="noopener noreferrer" className="block w-full py-3 px-4 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white">
              Download on the App Store
            </a>
            <a href={directDownloadLink} download className="block w-full py-3 px-4 rounded-lg font-semibold transition-colors bg-gray-600 hover:bg-gray-700 text-white">
              Download for Web/Desktop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;