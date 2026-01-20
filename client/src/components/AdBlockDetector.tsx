import React, { useState, useEffect } from 'react';

export const AdBlockDetector: React.FC = () => {
    const [adBlockDetected, setAdBlockDetected] = useState(false);

    useEffect(() => {
        // Wait 2 seconds to allow extensions to trigger
        const timer = setTimeout(() => {
            detectAdBlock();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const detectAdBlock = async () => {
        // 1. CSS Bait Check
        // Create a bait element that looks like an ad
        const bait = document.createElement('div');
        bait.className = 'ads ad-banner doubleclick';
        bait.style.position = 'absolute';
        bait.style.top = '-9999px';
        bait.style.left = '-9999px';
        bait.style.width = '1px';
        bait.style.height = '1px';
        document.body.appendChild(bait);

        // Check if the bait was blocked (hidden or collapsed by AdBlock style rules)
        const baitBlocked =
            window.getComputedStyle(bait).display === 'none' ||
            window.getComputedStyle(bait).visibility === 'hidden' ||
            bait.offsetParent === null;

        document.body.removeChild(bait);

        if (baitBlocked) {
            setAdBlockDetected(true);
            return;
        }

        // 2. Network Request Check
        // Try to fetch a well-known ad script url (we use a generic one that is commonly blocked)
        try {
            const request = new Request(
                'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
                { method: 'HEAD', mode: 'no-cors' }
            );
            await fetch(request);
        } catch (error) {
            // Network error usually means blocked
            setAdBlockDetected(true);
        }
    };

    if (!adBlockDetected) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0a0a0a]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-card p-8 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center gap-6">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <svg className="w-10 h-10 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>

                    {/* Content */}
                    <div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4">
                            Support the Stream
                        </h2>
                        <p className="text-gray-300 font-medium leading-relaxed">
                            Hey! 👋 We noticed you're using an AdBlocker.
                        </p>
                        <p className="text-gray-400 text-sm mt-4 leading-relaxed">
                            This game is 100% free and funded solely by these small ads.
                            To help us keep the servers running, would you mind disabling your blocker for us?
                        </p>
                        <p className="text-purple-400 font-bold italic mt-4">
                            It means the world to us! 💜
                        </p>
                    </div>

                    {/* Action */}
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg"
                    >
                        Okay, I've disabled it!
                    </button>

                    <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                        Clicking checks again
                    </div>
                </div>
            </div>
        </div>
    );
};
