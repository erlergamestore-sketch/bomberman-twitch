import React, { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

interface Player {
    id: string;
    name: string;
    avatar: string | null;
    x: number;
    y: number;
    color: string;
    alive: boolean;
}

interface Bomb {
    x: number;
    y: number;
    timer: number;
}

interface Explosion {
    x: number;
    y: number;
    timer: number;
}

export const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { socket } = useSocket();

    // Use refs for everything in the render loop to avoid stale closures and re-renders
    const playersRef = useRef<Player[]>([]);
    const bombsRef = useRef<Bomb[]>([]);
    const explosionsRef = useRef<Explosion[]>([]);
    const gridRef = useRef<number[][]>([]);

    const CELL_SIZE = 40;

    useEffect(() => {
        if (!socket) return;

        socket.on('init', (data: { grid: number[][], players: Player[] }) => {
            gridRef.current = data.grid;
            playersRef.current = data.players;
        });

        socket.on('stateUpdate', (state: { players: Player[], bombs: Bomb[], explosions: Explosion[], grid: number[][] }) => {
            playersRef.current = state.players;
            bombsRef.current = state.bombs || [];
            explosionsRef.current = state.explosions || [];
            if (state.grid) {
                gridRef.current = state.grid;
            }
        });

        // Join game
        socket.emit('join', `Player-${Math.floor(Math.random() * 1000)}`);

        return () => {
            socket.off('init');
            socket.off('stateUpdate');
        };
    }, [socket]);

    // Input Handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!socket) return;

            let direction = '';
            if (e.key === 'ArrowUp') { direction = 'UP'; e.preventDefault(); }
            if (e.key === 'ArrowDown') { direction = 'DOWN'; e.preventDefault(); }
            if (e.key === 'ArrowLeft') { direction = 'LEFT'; e.preventDefault(); }
            if (e.key === 'ArrowRight') { direction = 'RIGHT'; e.preventDefault(); }

            if (direction) {
                socket.emit('move', direction);
            }

            if (e.code === 'Space') {
                e.preventDefault();
                socket.emit('placeBomb');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [socket]);

    // Rendering Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            // Clear canvas
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const currentGrid = gridRef.current; // Use ref for grid

            // Draw Grid
            if (currentGrid.length > 0) {
                currentGrid.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        const px = x * CELL_SIZE;
                        const py = y * CELL_SIZE;

                        // Floor (Sleek dark grid)
                        ctx.fillStyle = '#0f0f0f';
                        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                        ctx.strokeStyle = '#1a1a1a';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);

                        // Wall (Cyber Indestructible)
                        if (cell === 1) {
                            const grad = ctx.createLinearGradient(px, py, px + CELL_SIZE, py + CELL_SIZE);
                            grad.addColorStop(0, '#1a1a1a');
                            grad.addColorStop(1, '#000000');
                            ctx.fillStyle = grad;
                            ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                            ctx.strokeStyle = '#333';
                            ctx.strokeRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                        }
                        // Soft Block (Holographic Chocolate)
                        else if (cell === 2) {
                            ctx.fillStyle = '#1e1e1e';
                            ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                            ctx.strokeStyle = '#3a2a1a';
                            ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);

                            // Accent
                            ctx.fillStyle = 'rgba(210, 105, 30, 0.4)';
                            ctx.fillRect(px + 8, py + 8, CELL_SIZE - 16, CELL_SIZE - 16);
                        }
                    });
                });
            }

            // Draw Bombs (Cyber-Neon Sphere)
            bombsRef.current.forEach(bomb => {
                const px = bomb.x * CELL_SIZE;
                const py = bomb.y * CELL_SIZE;

                // Outer Glow
                const grad = ctx.createRadialGradient(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 2, px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 2);
                grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

                // Bomb Shell
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 2 - 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Core (Pulsing)
                const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, ${100 + pulse * 155}, 0, ${0.5 + pulse * 0.5})`;
                ctx.beginPath();
                ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 4 + pulse * 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Explosions (Neon Heatmap)
            explosionsRef.current.forEach(exp => {
                const px = exp.x * CELL_SIZE;
                const py = exp.y * CELL_SIZE;

                const grad = ctx.createRadialGradient(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 0, px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 2);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                grad.addColorStop(0.2, 'rgba(255, 200, 0, 0.8)');
                grad.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
                grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

                ctx.fillStyle = grad;
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            });

            // Draw Players
            playersRef.current.forEach(player => {
                if (!player.alive) return;

                const px = player.x * CELL_SIZE;
                const py = player.y * CELL_SIZE;

                // Draw Avatar if exists
                if (player.avatar) {
                    const img = new Image();
                    img.src = player.avatar;
                    // Note: In production we would pre-load images
                    ctx.drawImage(img, px + 5, py + 5, CELL_SIZE - 10, CELL_SIZE - 10);
                } else {
                    ctx.fillStyle = player.color;
                    ctx.beginPath();
                    ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Name
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                // Glowing text for better visibility
                ctx.shadowBlur = 5;
                ctx.shadowColor = 'black';
                ctx.fillText(player.name, px + CELL_SIZE / 2, py - 5);
                ctx.shadowBlur = 0;
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, []); // Removed grid dependency, using ref

    return (
        <div className="flex justify-center items-center h-screen bg-gray-900">
            <canvas
                ref={canvasRef}
                width={15 * CELL_SIZE}
                height={13 * CELL_SIZE}
                className="border-4 border-gray-700 shadow-2xl"
            />
        </div>
    );
};
