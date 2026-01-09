const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GameRoom = require('./game/GameRoom');

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

app.use(cors({ origin: CLIENT_ORIGIN }));

const io = new Server(server, {
    cors: { origin: CLIENT_ORIGIN }
});

const rooms = new Map();
let sessionLeaderboard = new Map();

// Load Leaders
try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
        const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE));
        sessionLeaderboard = new Map(Object.entries(data));
    }
} catch (e) {
    console.error("Error loading leaderboard:", e);
}

function saveLeaderboard() {
    try {
        const obj = Object.fromEntries(sessionLeaderboard);
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error("Error saving leaderboard:", e);
    }
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function updateLeaderboard(room) {
    if (room.winner) {
        const winner = room.players.get(room.winner);
        if (winner) {
            const stats = sessionLeaderboard.get(winner.name) || { wins: 0, kills: 0 };
            stats.wins++;
            sessionLeaderboard.set(winner.name, stats);
        }
    }
    room.players.forEach(p => {
        if (p.kills > 0) {
            const stats = sessionLeaderboard.get(p.name) || { wins: 0, kills: 0 };
            stats.kills += p.kills;
            sessionLeaderboard.set(p.name, stats);
        }
    });
    saveLeaderboard();
}

const sendStats = (socket) => {
    const stats = {
        onlinePlayers: io.engine.clientsCount,
        activeRooms: rooms.size,
        leaderboard: Array.from(sessionLeaderboard.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.wins - a.wins || b.kills - a.kills)
            .slice(0, 10)
    };
    if (socket) socket.emit('serverStats', stats);
    else io.emit('serverStats', stats);
};

io.on('connection', (socket) => {
    console.log('Tactical link established:', socket.id);
    sendStats(socket);

    socket.on('createRoom', ({ playerName, avatar, settings }) => {
        const roomCode = generateRoomCode();
        const room = new GameRoom(roomCode, { maxPlayers: settings?.maxPlayers || 4 });
        rooms.set(roomCode, room);

        socket.join(roomCode);
        socket.roomCode = roomCode;

        room.addPlayer(socket.id, playerName, avatar);
        socket.emit('init', room.getState());
        sendStats();
    });

    socket.on('joinRoom', ({ roomCode, playerName, avatar }) => {
        const code = roomCode.toUpperCase();
        const room = rooms.get(code);

        if (room) {
            const player = room.addPlayer(socket.id, playerName, avatar);
            if (player) {
                socket.join(code);
                socket.roomCode = code;
                socket.emit('init', room.getState());
                io.to(code).emit('stateUpdate', room.getState());
            } else {
                socket.emit('error', 'Zone saturated or operation in progress');
            }
        } else {
            socket.emit('error', 'Coordinates not found');
        }
    });

    socket.on('startGame', () => {
        const room = rooms.get(socket.roomCode);
        if (room && room.startGame(socket.id)) {
            io.to(socket.roomCode).emit('stateUpdate', room.getState());
        }
    });

    socket.on('move', (dir) => {
        const room = rooms.get(socket.roomCode);
        if (room) room.movePlayer(socket.id, dir);
    });

    socket.on('placeBomb', () => {
        const room = rooms.get(socket.roomCode);
        if (room) room.placeBomb(socket.id);
    });

    socket.on('toggleReady', () => {
        const room = rooms.get(socket.roomCode);
        if (room && room.toggleReady(socket.id)) {
            io.to(socket.roomCode).emit('stateUpdate', room.getState());
        }
    });

    socket.on('kickPlayer', (targetId) => {
        const room = rooms.get(socket.roomCode);
        if (room && room.hostId === socket.id && targetId !== socket.id) {
            const targetSocket = io.sockets.sockets.get(targetId);
            if (targetSocket) {
                targetSocket.leave(socket.roomCode);
                targetSocket.emit('error', 'You have been kicked from the room.');
            }
            room.removePlayer(targetId);
            io.to(socket.roomCode).emit('stateUpdate', room.getState());
        }
    });

    socket.on('restartMatch', () => {
        const room = rooms.get(socket.roomCode);
        if (room && room.hostId === socket.id && room.gameState === 'ENDED') {
            // Reset game to lobby
            room.gameState = 'LOBBY';
            room.winner = null;
            room.grid = room.generateGrid();
            room.bombs = [];
            room.explosions = [];
            room.suddenDeathIndex = 0;
            room.lastSuddenDeathTick = 0;
            room.currentRound = 1;
            room.roundWins.clear();

            // Reset all players
            room.players.forEach(p => {
                p.alive = true;
                p.activeBombs = 0;
                p.kills = 0;
                p.ready = false;
            });

            io.to(socket.roomCode).emit('stateUpdate', room.getState());
            sendStats();
        }
    });

    socket.on('nextRound', () => {
        const room = rooms.get(socket.roomCode);
        if (room && room.hostId === socket.id && room.gameState === 'ROUND_END') {
            room.currentRound++;
            room.gameState = 'LOBBY';
            room.winner = null;
            room.grid = room.generateGrid();
            room.bombs = [];
            room.explosions = [];
            room.suddenDeathIndex = 0;
            room.lastSuddenDeathTick = 0;

            room.players.forEach(p => {
                p.alive = true;
                p.activeBombs = 0;
                p.kills = 0;
                p.ready = false;
            });

            io.to(socket.roomCode).emit('stateUpdate', room.getState());
        }
    });

    socket.on('disconnect', () => {
        const room = rooms.get(socket.roomCode);
        if (room) {
            room.removePlayer(socket.id);
            if (room.players.size === 0) {
                rooms.delete(socket.roomCode);
            } else {
                io.to(socket.roomCode).emit('stateUpdate', room.getState());
            }
        }
        sendStats();
        console.log('Tactical link severed:', socket.id);
    });
});

setInterval(() => {
    rooms.forEach((room, code) => {
        if (room.gameState === 'PLAYING') {
            room.update(1000 / 30);
            io.to(code).emit('stateUpdate', room.getState());

            if (room.gameState === 'ENDED') {
                updateLeaderboard(room);
                io.to(code).emit('stateUpdate', room.getState());
                // Game stays in ENDED state until host restarts
            }
        }
    });
}, 1000 / 30);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Command Center operational on port ${PORT}`));
