import { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { GameCanvas } from './components/GameCanvas';
import { TwitchLobby } from './components/TwitchLobby';

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

function GameApp() {
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState<TwitchUser | null>(null);
  const [gameState, setGameState] = useState<'LOGIN' | 'PLAY'>('LOGIN');
  const [roomData, setRoomData] = useState<any>(null);

  const clientID = import.meta.env.VITE_TWITCH_CLIENT_ID;

  // Handle Twitch OAuth Hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token && clientID && clientID !== 'YOUR_CLIENT_ID_HERE') {
        window.history.replaceState({}, document.title, window.location.pathname);

        fetch('https://api.twitch.tv/helix/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': clientID
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.data && data.data[0]) {
              setUser(data.data[0]);
            }
          })
          .catch(err => console.error("Twitch Auth Error:", err));
      }
    }
  }, [clientID]);

  const handleCreate = (settings: any) => socket?.emit('createRoom', { playerName: user?.display_name, avatar: user?.profile_image_url, settings });
  const handleJoin = (code: string) => socket?.emit('joinRoom', { roomCode: code, playerName: user?.display_name, avatar: user?.profile_image_url });

  useEffect(() => {
    if (!socket) return;

    socket.on('init', (data) => {
      setRoomData(data);
      setGameState('PLAY');
    });
    socket.on('stateUpdate', (data) => setRoomData(data));
    socket.on('error', alert);

    return () => {
      socket.off('init');
      socket.off('stateUpdate');
    };
  }, [socket]);

  return (
    <div className={`w-full ${gameState === 'LOGIN' || roomData?.gameState === 'LOBBY' ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'} bg-[#0a0a0a] text-white font-sans`}>
      {!isConnected && (
        <div className="fixed top-0 left-0 w-full bg-red-600/80 backdrop-blur-md text-center py-1 z-[100] text-[10px] font-black tracking-widest uppercase">
          Signal Interrupted - Reconnecting...
        </div>
      )}

      {gameState === 'LOGIN' ? (
        <TwitchLobby
          onJoin={handleJoin}
          onCreate={handleCreate}
          socket={socket}
          user={user}
          setUser={setUser}
        />
      ) : (
        <div className={`relative w-full ${roomData?.gameState === 'LOBBY' ? 'min-h-screen' : 'h-screen'} flex flex-col items-center justify-center overflow-x-hidden`}>
          <div className="fixed inset-0 bg-glow-orb top-[-20%] left-[-10%] bg-purple-900/10 pointer-events-none" />
          <div className="fixed inset-0 bg-glow-orb bottom-[-20%] right-[-10%] bg-indigo-900/10 pointer-events-none" />

          {/* Persistent Header (Logo & User) - Always on top */}
          <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-[70] pointer-events-none">
            <div className="flex flex-col gap-4 pointer-events-auto">
              <h1 className="text-4xl font-black italic tracking-tighter text-white">BOMBER ROYALE</h1>

              {roomData?.roomCode && (
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(roomData.roomCode);
                    alert('Sector Code ' + roomData.roomCode + ' copied to clipboard!');
                  }}
                  className="glass-card px-4 py-2 border-purple-500/50 w-fit cursor-pointer hover:bg-purple-500/20 active:scale-95 transition-all group flex items-center gap-3 relative shadow-2xl"
                  title="Click to copy code"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sector:</span>
                    <span className="text-purple-400 font-mono font-bold tracking-widest text-xl">{roomData.roomCode}</span>
                  </div>
                  <div className="bg-purple-600 p-2 rounded-lg group-hover:bg-purple-500 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-3 flex items-center gap-3 border-white/5 pointer-events-auto">
              <span className="font-black text-sm uppercase">{user?.display_name}</span>
              <img src={user?.profile_image_url} className="w-10 h-10 rounded-xl border border-purple-500 shadow-lg" />
            </div>
          </div>

          {/* Modal / Lobby Overlay Container */}
          <div className="relative z-50 w-full flex flex-col items-center py-24 px-4 overflow-visible">
            {roomData?.gameState === 'LOBBY' && (
              <div className="glass-card p-6 md:p-10 flex flex-col items-center gap-6 border-purple-500/40 animate-in fade-in zoom-in duration-300 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <div className="text-center">
                  <h2 className="text-3xl font-black italic uppercase">Lobby Waiting Room</h2>
                  <p className="text-purple-400 text-[10px] font-black tracking-[0.4em] uppercase mt-2">Preparing for Deployment</p>
                </div>

                {/* Tournament Settings Info */}
                <div className="grid grid-cols-2 gap-4 w-full bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-500 font-black uppercase">Match Format</span>
                    <span className="text-sm font-bold text-white uppercase">{roomData.matchFormat === 1 ? '1 Round' : `Best of ${roomData.matchFormat}`}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-500 font-black uppercase">Sudden Death</span>
                    <span className="text-sm font-bold text-white uppercase">{roomData.suddenDeathDuration > 0 ? `${roomData.suddenDeathDuration / 60000} Minutes` : 'Never'}</span>
                  </div>
                  {roomData.rewards?.first && (
                    <div className="col-span-2 flex flex-col pt-2 border-t border-white/5">
                      <span className="text-[8px] text-yellow-500 font-black uppercase tracking-widest">🏆 REWARDS 🏆</span>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[10px] font-bold text-gray-300">1st: <span className="text-white">{roomData.rewards.first}</span></span>
                        {roomData.rewards.second && <span className="text-[10px] font-bold text-gray-300">2nd: <span className="text-white">{roomData.rewards.second}</span></span>}
                        {roomData.rewards.third && <span className="text-[10px] font-bold text-gray-300">3rd: <span className="text-white">{roomData.rewards.third}</span></span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-6 py-4">
                  {roomData.players.map((p: any) => (
                    <div key={p.id} className="relative flex flex-col items-center gap-3">
                      <div className={`w-20 h-20 rounded-2xl border-4 ${p.ready ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'} transition-all duration-300`}>
                        <img src={p.avatar} className="w-full h-full rounded-xl object-cover" />
                        {p.ready && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-black text-[8px] font-black px-2 py-1 rounded-md rotate-12">READY</div>
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-white">{p.name}</span>
                        {p.id === roomData.hostId && <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">COMMANDER</span>}
                      </div>

                      {/* Host Kick Button */}
                      {roomData.hostId === socket?.id && p.id !== socket?.id && (
                        <button
                          onClick={() => socket?.emit('kickPlayer', p.id)}
                          className="mt-1 text-[8px] text-red-500 hover:text-red-400 font-black uppercase tracking-widest px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition-all"
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-6 w-full">
                  <button
                    onClick={() => socket?.emit('toggleReady')}
                    className={`flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${roomData.players.find((p: any) => p.id === socket?.id)?.ready
                      ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    {roomData.players.find((p: any) => p.id === socket?.id)?.ready ? '✓ READY' : 'MARK READY'}
                  </button>

                  {roomData.hostId === socket?.id && (
                    <button
                      onClick={() => socket?.emit('startGame')}
                      disabled={!roomData.players.every((p: any) => p.ready)}
                      className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-sm rounded-xl shadow-[0_0_40px_rgba(145,70,255,0.4)] transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {!roomData.players.every((p: any) => p.ready) ? 'AWAITING READY' : 'START MISSION'}
                    </button>
                  )}
                </div>

                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                  {roomData.players.filter((p: any) => p.ready).length} / {roomData.players.length} CREW READY
                </p>
              </div>
            )}

            {/* Spectator Mode - Dead Player (Only during active play) */}
            {roomData?.gameState === 'PLAYING' && roomData.players.find((p: any) => p.id === socket?.id && !p.alive) && (
              <div className="fixed bottom-8 right-8 glass-card p-6 flex flex-col items-center gap-3 border-red-500/40 animate-in slide-in-from-right-8 duration-500 z-[80] shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <div className="text-red-500 font-black text-lg uppercase tracking-widest animate-pulse flex items-center gap-2">
                  <span className="text-2xl">💀</span> ELIMINATED
                </div>
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Spectating Mission...</div>

                <div className="w-full h-px bg-white/5 my-2" />

                <div className="flex flex-col gap-2 w-full">
                  <div className="text-white font-black text-[8px] uppercase tracking-[0.2em] opacity-50 text-center">Still in the field</div>
                  <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {roomData.players.filter((p: any) => p.alive).map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                        <img src={p.avatar} className="w-5 h-5 rounded-md" />
                        <span className="text-[10px] text-gray-300 font-bold truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Round Transition Screen */}
            {roomData?.gameState === 'ROUND_END' && (
              <div className="glass-card p-10 flex flex-col items-center gap-6 border-blue-500/60 animate-in fade-in zoom-in duration-500 max-w-md w-full">
                <div className="text-blue-400 font-black text-3xl uppercase tracking-[0.2em]">Round Complete</div>

                {roomData.winner ? (() => {
                  const winner = roomData.players.find((p: any) => p.id === roomData.winner);
                  return (
                    <div className="flex flex-col items-center gap-4 bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20 w-full">
                      <div className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Round Victor</div>
                      <img src={winner?.avatar} className="w-20 h-20 rounded-2xl border-2 border-blue-500 shadow-lg" />
                      <div className="text-white font-black text-xl">{winner?.name}</div>
                    </div>
                  );
                })() : (
                  <div className="text-gray-400 font-black text-xl uppercase italic">No Survivors</div>
                )}

                <div className="w-full bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[8px] text-gray-500 font-black uppercase tracking-widest text-center mb-3">Tournament Standings</div>
                  <div className="flex flex-col gap-2">
                    {roomData.players.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">{p.name}</span>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.ceil(roomData.matchFormat / 2) }).map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full border border-white/10 ${i < (roomData.roundWins[p.id] || 0) ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/5'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {roomData.hostId === socket?.id ? (
                  <button
                    onClick={() => socket?.emit('nextRound')}
                    className="mt-4 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-full shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all active:scale-95 uppercase tracking-[0.2em]"
                  >
                    Deploy Next Round
                  </button>
                ) : (
                  <div className="mt-4 w-full py-3 bg-white/5 rounded-full text-gray-400 font-black italic text-center text-sm animate-pulse tracking-widest">
                    Awaiting Commander Launch...
                  </div>
                )}
              </div>
            )}

            {/* Winner Screen */}
            {roomData?.gameState === 'ENDED' && (
              <div className="glass-card p-12 flex flex-col items-center gap-6 pointer-events-auto border-yellow-500/60 animate-in fade-in zoom-in duration-500 max-w-md w-full">
                <div className="text-yellow-400 font-black text-4xl uppercase tracking-widest animate-pulse">🏆 VICTORY 🏆</div>
                {roomData.winner && (() => {
                  const winner = roomData.players.find((p: any) => p.id === roomData.winner);
                  return winner ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={winner.avatar} className="w-24 h-24 rounded-2xl border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)]" />
                      <div className="text-white font-black text-2xl">{winner.name}</div>
                      <div className="text-gray-400 text-sm">Kills: {winner.kills}</div>
                    </div>
                  ) : null;
                })()}

                <div className="mt-4 flex flex-col gap-2 w-full">
                  <div className="text-white font-black text-[10px] uppercase text-center tracking-[0.3em] mb-2 opacity-50">Final Stats</div>
                  {roomData.players.sort((a: any, b: any) => b.kills - a.kills).map((p: any, i: number) => (
                    <div key={p.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-black text-[10px]">#{i + 1}</span>
                        <img src={p.avatar} className="w-8 h-8 rounded-lg" />
                        <span className="text-white font-bold text-xs truncate max-w-[100px]">{p.name}</span>
                      </div>
                      <span className="text-purple-400 font-black text-xs">{p.kills} KILLS</span>
                    </div>
                  ))}
                </div>

                {roomData.hostId === socket?.id ? (
                  <button
                    onClick={() => socket?.emit('restartMatch')}
                    className="mt-6 w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl rounded-full shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all active:scale-95 uppercase tracking-widest"
                  >
                    RESTART MATCH
                  </button>
                ) : (
                  <div className="mt-6 w-full py-3 bg-white/5 rounded-full text-gray-400 font-black italic text-center text-sm animate-pulse">
                    Waiting for Commander...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Game World (Only visible when playing) */}
          {roomData?.gameState === 'PLAYING' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 p-24">
              <div className="relative w-full max-w-[1000px] aspect-[15/13] bg-[#111] rounded-2xl shadow-2xl border-4 border-white/5 overflow-hidden">
                <GameCanvas />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function App() { return <SocketProvider><GameApp /></SocketProvider>; }
export default App;
