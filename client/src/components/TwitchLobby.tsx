import React, { useState, useEffect } from 'react';
import { LegalInfo } from './LegalInfo';
import { AdsterraBanner } from './AdsterraBanner';

interface TwitchUser {
    id: string;
    login: string;
    display_name: string;
    profile_image_url: string;
}

interface ServerStats {
    onlinePlayers: number;
    activeRooms: number;
    leaderboard: Array<{ name: string; wins: number; kills: number }>;
}

interface LobbyProps {
    onJoin: (roomCode: string) => void;
    onCreate: (settings: { maxPlayers: number; matchFormat: number; suddenDeathTimer: number; gameSpeed: number; rewards?: { first: string; second: string; third: string } }) => void;
    socket: any;
    user: TwitchUser | null;
    setUser: (user: TwitchUser | null) => void;
}

export const TwitchLobby: React.FC<LobbyProps> = ({ onJoin, onCreate, socket, user, setUser }) => {
    const [roomInput, setRoomInput] = useState('');
    const [stats, setStats] = useState<ServerStats>({ onlinePlayers: 0, activeRooms: 0, leaderboard: [] });
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [matchFormat, setMatchFormat] = useState(1);
    const [suddenDeathTimer, setSuddenDeathTimer] = useState(120000);
    const [reward1st, setReward1st] = useState('');
    const [reward2nd, setReward2nd] = useState('');
    const [reward3rd, setReward3rd] = useState('');
    const [showLegal, setShowLegal] = useState(false);

    useEffect(() => {
        if (!socket) return;
        socket.on('serverStats', setStats);
        return () => socket.off('serverStats');
    }, [socket]);

    const handleTwitchLogin = () => {
        const clientID = import.meta.env.VITE_TWITCH_CLIENT_ID;
        if (!clientID || clientID === 'YOUR_CLIENT_ID_HERE') {
            console.error("VITE_TWITCH_CLIENT_ID missing in .env");
            return;
        }
        const redirectUri = window.location.origin + '/';
        const scope = 'user:read:email';
        const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
        window.location.href = url;
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center py-12 px-6 bg-[#0a0a0a]">
            {/* Ambient Background */}
            <div className="bg-glow-orb top-[-20%] left-[-10%] bg-purple-600" />
            <div className="bg-glow-orb bottom-[-20%] right-[-10%] bg-indigo-600" style={{ animationDelay: '-5s' }} />

            {/* Adsterra Banner (Top - 728x90) */}
            <div className="z-20 mb-8">
                <AdsterraBanner adKey="YOUR_ADSTERRA_KEY_728x90" width={728} height={90} className="border border-white/10 shadow-2xl" />
            </div>

            {!user ? (
                <div className="z-10 flex flex-col items-center gap-12 max-w-6xl text-center">
                    <h1 className="text-8xl md:text-[10rem] font-black italic tracking-tighter leading-none select-none">
                        <span className="block text-white">BOMBER</span>
                        <span className="block bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent italic">
                            ROYALE
                        </span>
                    </h1>

                    <div className="flex flex-col gap-8 items-center">
                        <p className="text-gray-400 text-xl max-w-lg font-medium italic">
                            The ultimate battle royale for Twitch Streamers.
                        </p>

                        <button onClick={handleTwitchLogin} className="group relative px-16 py-6 bg-purple-600 hover:bg-purple-500 rounded-full transition-all duration-300 active:scale-95 shadow-[0_0_50px_rgba(145,70,255,0.3)]">
                            <div className="flex items-center gap-4">
                                <svg className="w-8 h-8 fill-current text-white" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0h1.714v5.143h-1.714zm-10.286 0H7.714v5.143H6.014zm1.715 13.714h1.715v1.714H9.429zm3.428 0h1.715v1.714h-1.715zm10.286-12h-1.714v9h-1.715v1.714h-1.714v1.715h-1.715v-1.715H1.714V1.714h18.857L24 5.143v10.286h-3.429v1.714h-1.714V24l-3.429-3.429h-3.428L10.286 24l-3.429-3.429H1.714V17.143h1.715v1.714h1.714v-13.714H1.714V2.571h1.715V.857h1.714v4.286zm0 0"></path></svg>
                                <span className="text-2xl font-black text-white uppercase tracking-[0.2em]">Enter Arena</span>
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mt-8">
                        <div className="glass-card p-6 border-white/5">
                            <p className="text-5xl font-black text-purple-500">{stats.onlinePlayers}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Verified Players</p>
                        </div>
                        <div className="glass-card p-6 border-white/5">
                            <p className="text-5xl font-black text-indigo-500">{stats.activeRooms}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Active Sectors</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="z-10 w-full max-w-2xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="glass-card p-8 flex items-center justify-between border-purple-500/20">
                        <div className="flex items-center gap-6">
                            <img src={user.profile_image_url} className="w-24 h-24 rounded-3xl border-2 border-purple-500 shadow-2xl" />
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter italic uppercase text-white">{user.display_name}</h2>
                                <p className="text-green-500 font-bold text-xs uppercase tracking-widest mt-1 italic">✓ Twitch Identity Verified</p>
                            </div>
                        </div>
                        <button onClick={() => setUser(null)} className="text-gray-500 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-8 flex flex-col gap-6">
                            <h3 className="text-xl font-black italic text-green-400 uppercase">Host Game</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Capacity</label>
                                    <div className="flex gap-2">
                                        {[2, 4, 8].map(n => (
                                            <button key={n} onClick={() => setMaxPlayers(n)} className={`flex-1 py-2 rounded-xl font-black transition-all text-sm ${maxPlayers === n ? 'bg-green-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>{n}P</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Match Format</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setMatchFormat(1)} className={`py-2 rounded-xl font-bold transition-all text-xs ${matchFormat === 1 ? 'bg-green-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>1 Round</button>
                                        <button onClick={() => setMatchFormat(3)} className={`py-2 rounded-xl font-bold transition-all text-xs ${matchFormat === 3 ? 'bg-green-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>Best of 3</button>
                                        <button onClick={() => setMatchFormat(5)} className={`py-2 rounded-xl font-bold transition-all text-xs ${matchFormat === 5 ? 'bg-green-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>Best of 5</button>
                                        <button onClick={() => setMatchFormat(7)} className={`py-2 rounded-xl font-bold transition-all text-xs ${matchFormat === 7 ? 'bg-green-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>Best of 7</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Sudden Death</label>
                                    <select value={suddenDeathTimer} onChange={(e) => setSuddenDeathTimer(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm font-bold focus:border-green-500 outline-none">
                                        <option value={120000}>2 Minutes</option>
                                        <option value={180000}>3 Minutes</option>
                                        <option value={300000}>5 Minutes</option>
                                        <option value={-1}>Never</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">1st Place Reward</label>
                                    <input type="text" value={reward1st} onChange={(e) => setReward1st(e.target.value)} placeholder="e.g. VIP Status" className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:border-green-500 outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">2nd Place Reward</label>
                                    <input type="text" value={reward2nd} onChange={(e) => setReward2nd(e.target.value)} placeholder="e.g. Gift Sub" className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:border-green-500 outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">3rd Place Reward</label>
                                    <input type="text" value={reward3rd} onChange={(e) => setReward3rd(e.target.value)} placeholder="e.g. Shoutout" className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:border-green-500 outline-none" />
                                </div>
                            </div>
                            <button onClick={() => onCreate({ maxPlayers, matchFormat, suddenDeathTimer, gameSpeed: 1.0, rewards: { first: reward1st, second: reward2nd, third: reward3rd } })} className="btn-primary w-full justify-center !rounded-xl !bg-green-500 !text-black !shadow-none">CREATE ROOM</button>
                        </div>

                        <div className="glass-card p-8 flex flex-col gap-6">
                            <h3 className="text-xl font-black italic text-indigo-400 uppercase">Join Game</h3>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Enter Code</label>
                                <input type="text" value={roomInput} onChange={(e) => setRoomInput(e.target.value.toUpperCase())} placeholder="CODE" className="bg-white/5 border border-white/10 rounded-xl py-4 text-center text-3xl font-black font-mono focus:border-indigo-500 outline-none w-full" />
                            </div>
                            <button onClick={() => onJoin(roomInput)} className="btn-primary w-full justify-center !rounded-xl !bg-indigo-600 !text-white !shadow-none">JOIN MISSION</button>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <AdsterraBanner adKey="YOUR_ADSTERRA_KEY_300x250" width={300} height={250} className="mx-auto mb-6 border border-white/5" />
                        <h4 className="text-xs font-black text-center text-gray-500 uppercase tracking-[0.4em] mb-6">Combat Leaderboard</h4>
                        {stats.leaderboard.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {stats.leaderboard.slice(0, 5).map((entry, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                        <span className="font-bold text-white flex items-center gap-3">
                                            <span className="text-purple-500 font-black">#{i + 1}</span> {entry.name}
                                        </span>
                                        <div className="flex gap-6 font-black">
                                            <span className="text-green-400">{entry.wins} Wins</span>
                                            <span className="text-red-400">{entry.kills} Kills</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-600 italic text-sm py-4 border border-dashed border-white/5 rounded-xl">No combat history recorded.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Legal Links */}
            <div className="z-10 mt-12 flex gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                <button onClick={() => setShowLegal(true)} className="hover:text-purple-400 transition-colors">Impressum</button>
                <button onClick={() => setShowLegal(true)} className="hover:text-purple-400 transition-colors">Privacy Policy</button>
            </div>

            {showLegal && <LegalInfo onClose={() => setShowLegal(false)} />}
        </div>
    );
};
