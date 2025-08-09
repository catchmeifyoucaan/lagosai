import React from 'react';
import { ThemeColors } from '../types';
import { signInWithGoogle, signInAnon, signInWithApple } from '../services/firebase';

interface OnboardingProps {
  theme: ThemeColors;
  onClose: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ theme, onClose }) => {
  const [busy, setBusy] = React.useState(false);

  const handleGoogle = async () => {
    try { setBusy(true); await signInWithGoogle(); onClose(); } catch (e) { console.error(e); setBusy(false); }
  };
  const handleAnon = async () => {
    try { setBusy(true); await signInAnon(); onClose(); } catch (e) { console.error(e); setBusy(false); }
  };
  const handleApple = async () => {
    try { setBusy(true); await signInWithApple(); onClose(); } catch (e) { console.error(e); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${theme.card} rounded-xl shadow-2xl w-full max-w-2xl`} onClick={e=>e.stopPropagation()}>
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold">Welcome to Lagos Oracle Ultra</h2>
          <p className={`${theme.muted} mt-2 text-sm`}>Your Lagos-savvy AI for chat, research, images, and more. Explore local culture, get directions, generate visuals, and keep your conversations saved across devices.</p>
        </div>
        <div className="p-6 space-y-3">
          <button disabled={busy} onClick={handleGoogle} className="w-full px-4 py-3 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-gray-500">Continue with Google</button>
          <button disabled={busy} onClick={handleApple} className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white hover:bg-black">Continue with Apple</button>
          <div className="text-center text-xs ${theme.muted}">or</div>
          <button disabled={busy} onClick={handleAnon} className="w-full px-4 py-3 rounded-lg border dark:border-gray-700">Try anonymously</button>
        </div>
        <div className="p-4 text-center">
          <button onClick={onClose} className={`${theme.muted} text-sm hover:underline`}>Maybe later</button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;