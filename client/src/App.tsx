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
    <div className="w-full h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
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
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="bg-glow-orb top-[-20%] left-[-10%] bg-purple-900/10" />
          <div className="bg-glow-orb bottom-[-20%] right-[-10%] bg-indigo-900/10" />

          {/* In-Game HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between z-20">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black italic tracking-tighter text-white">BOMBER ROYALE</h1>
                {roomData?.roomCode && (
                  <div className="glass-card px-4 py-2 border-purple-500/30 w-fit">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sector:</span>
                    <span className="ml-2 text-purple-400 font-mono font-bold tracking-widest">{roomData.roomCode}</span>
                  </div>
                )}
              </div>
              <div className="glass-card p-3 flex items-center gap-3 border-white/5 pointer-events-auto">
                <span className="font-black text-sm uppercase">{user?.display_name}</span>
                <img src={user?.profile_image_url} className="w-10 h-10 rounded-xl border border-purple-500 shadow-lg" />
              </div>
            </div>

            {roomData?.gameState === 'LOBBY' && (
              <div className="self-center glass-card p-10 flex flex-col items-center gap-6 pointer-events-auto border-purple-500/40 animate-in fade-in zoom-in duration-300">
                <h2 className="text-3xl font-black italic uppercase">Lobby Waiting Room</h2>
                <div className="flex gap-4">
                  {roomData.players.map((p: any) => (
                    <div key={p.id} className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-2xl border-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                        <img src={p.avatar} className="w-full h-full rounded-xl object-cover" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-400">{p.name.slice(0, 8)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                  {roomData.players.length} / {roomData.maxPlayers} READY
                </p>
                {roomData.hostId === socket?.id ? (
                  <button
                    onClick={() => socket?.emit('startGame')}
                    className="mt-4 px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-full shadow-[0_0_40px_rgba(145,70,255,0.4)] transition-all active:scale-95 uppercase tracking-widest"
                  >
                    START MATCH
                  </button>
                ) : (
                  <div className="mt-4 px-8 py-3 bg-white/5 rounded-full text-gray-400 font-black italic text-sm animate-pulse">
                    Waiting for Commander start...
                  </div>
                )}
              </div>
            )}
          </div>

          <GameCanvas />
        </div>
      )}
    </div>
  );
}

function App() { return <SocketProvider><GameApp /></SocketProvider>; }
export default App;
