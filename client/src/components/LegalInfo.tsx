import React from 'react';

interface LegalInfoProps {
    onClose: () => void;
}

export const LegalInfo: React.FC<LegalInfoProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="glass-card w-full max-w-4xl p-8 my-8 relative animate-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="space-y-8 text-gray-300">
                    <section>
                        <h2 className="text-3xl font-black italic text-white uppercase mb-4">Impressum (Legal Notice)</h2>
                        <div className="space-y-1 text-sm">
                            <p className="font-bold text-white">Information according to § 5 TMG</p>
                            <p>Erler Game Store</p>
                            <p>Cranger Str. 284</p>
                            <p>45891 Gelsenkirchen</p>
                            <p>Germany</p>

                            <p className="font-bold text-white mt-4">Contact</p>
                            <p>Email: app@erlergamestore.de</p>
                            <p>Web: erlergamestore.de</p>

                            <p className="font-bold text-white mt-4">Dispute Resolution</p>
                            <p>The European Commission provides a platform for online dispute resolution (OS): <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">https://ec.europa.eu/consumers/odr/</a>.</p>
                            <p>We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>

                            <p className="font-bold text-white mt-4">Liability for Content</p>
                            <p>As service providers, we are liable for our own content on these pages according to Sec. 7, paragraph 1 TMG (German Telemedia Act). However, according to Sec. 8 to 10 TMG, service providers are not obligated to permanently monitor submitted or stored information or to search for evidences that indicate illegal activities.</p>
                        </div>
                    </section>

                    <section className="border-t border-white/10 pt-8">
                        <h2 className="text-3xl font-black italic text-white uppercase mb-4">Privacy Policy</h2>
                        <div className="space-y-4 text-sm">
                            <div>
                                <h3 className="text-lg font-bold text-white">1. General Information</h3>
                                <p>This privacy policy explains how Twitch Bomber Royale handles your data. We take the protection of your personal data very seriously and treat it confidentially and in accordance with legal data protection regulations.</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white">2. Data Controller</h3>
                                <p>Erler Game Store, Cranger Str. 284, 45891 Gelsenkirchen, Germany. Email: app@erlergamestore.de</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white">3. What Data is Collected</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Twitch Profile:</strong> When you login, we temporarily access your basic public Twitch profile (Username, Display Name, Profile Picture) to display your avatar in the game.</li>
                                    <li><strong>Game Data:</strong> We store game session data (scores, room configurations, wins/kills) in our backend systems and Firebase.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white italic text-purple-400">4. Google AdSense (Monetization)</h3>
                                <p>This website uses Google AdSense, a service for including advertisements from Google Inc. ("Google"). Google AdSense uses so-called "cookies", text files that are stored on your computer and that allow an analysis of the use of the website.</p>
                                <p className="mt-2">Google AdSense also uses so-called web beacons (invisible graphics). Through these web beacons, information such as visitor traffic on these pages can be evaluated. The information generated by cookies and web beacons about the use of this website (including your IP address) and the delivery of advertising formats is transmitted to a Google server in the USA and stored there.</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white">5. Data Storage</h3>
                                <p>Authentication is handled via Twitch's Implicit Grant Flow. We do not store your Twitch password. Your session token is stored locally in your browser to keep you logged in.</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white">6. Cookies & Local Storage</h3>
                                <p>We use Local Storage to save your game preferences and authentication state. We use third-party cookies from Google AdSense for advertisement purposes once verified.</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white">7. Changes to this Policy</h3>
                                <p>We reserve the right to update this privacy policy to ensure compliance with evolving legal requirements or to reflect changes to the app's functionality.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
