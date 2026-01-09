class GameRoom {
    constructor(roomId, options = {}) {
        this.roomId = roomId;
        this.players = new Map(); // socketId -> player data
        this.gridWidth = 15;
        this.gridHeight = 13;
        this.grid = this.generateGrid();
        this.bombs = [];
        this.explosions = [];

        // Lobby Settings
        this.maxPlayers = options.maxPlayers || 4;
        this.gameState = 'LOBBY'; // LOBBY, PLAYING, ENDED
        this.hostId = null;
        this.winner = null;

        // Game Mechanics
        this.matchStartTime = 0;
        this.suddenDeathTimer = 120000; // 2 minutes until sudden death starts
        this.suddenDeathIndex = 0;
        this.lastSuddenDeathTick = 0;
    }

    generateGrid() {
        const grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                if (x === 0 || x === this.gridWidth - 1 || y === 0 || y === this.gridHeight - 1 || (x % 2 === 0 && y % 2 === 0)) {
                    row.push(1); // Solid Walls
                } else {
                    const isSafeZone = (x < 3 && y < 3) || (x > this.gridWidth - 4 && y > this.gridHeight - 4);
                    if (!isSafeZone && Math.random() < 0.7) {
                        row.push(2); // Soft Blocks
                    } else {
                        row.push(0); // Empty
                    }
                }
            }
            grid.push(row);
        }
        return grid;
    }

    addPlayer(socketId, playerName, avatar) {
        if (this.players.size >= this.maxPlayers && this.gameState === 'LOBBY') return null;
        if (this.gameState !== 'LOBBY') return null;

        const startPositions = [
            { x: 1, y: 1 }, { x: 13, y: 11 }, { x: 1, y: 11 }, { x: 13, y: 1 },
            { x: 7, y: 1 }, { x: 7, y: 11 }, { x: 1, y: 6 }, { x: 13, y: 6 }
        ];

        const index = this.players.size;
        const startPos = startPositions[index % startPositions.length];

        const player = {
            id: socketId,
            name: playerName || `Player ${index + 1}`,
            avatar: avatar || null,
            x: startPos.x,
            y: startPos.y,
            color: this.getPlayerColor(index),
            alive: true,
            maxBombs: 1,
            activeBombs: 0,
            bombRange: 2,
            isHost: this.players.size === 0,
            kills: 0
        };

        if (player.isHost) this.hostId = socketId;
        this.players.set(socketId, player);
        return player;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        this.players.delete(socketId);

        if (this.hostId === socketId && this.players.size > 0) {
            const nextHost = this.players.keys().next().value;
            this.hostId = nextHost;
            const nextPlayer = this.players.get(nextHost);
            if (nextPlayer) nextPlayer.isHost = true;
        }

        if (this.gameState === 'PLAYING') {
            this.checkWinCondition();
        }
    }

    startGame(socketId) {
        if (socketId === this.hostId && this.gameState === 'LOBBY') {
            this.gameState = 'PLAYING';
            this.matchStartTime = Date.now();
            return true;
        }
        return false;
    }

    movePlayer(socketId, direction) {
        if (this.gameState !== 'PLAYING') return;
        const player = this.players.get(socketId);
        if (!player || !player.alive) return;

        let newX = player.x;
        let newY = player.y;
        const speed = 0.15;

        if (direction === 'UP') newY -= speed;
        if (direction === 'DOWN') newY += speed;
        if (direction === 'LEFT') newX -= speed;
        if (direction === 'RIGHT') newX += speed;

        if (!this.checkCollision(newX, newY, socketId)) {
            player.x = newX;
            player.y = newY;
        }
    }

    placeBomb(socketId) {
        if (this.gameState !== 'PLAYING') return;
        const player = this.players.get(socketId);
        if (!player || !player.alive) return;

        if (player.activeBombs < player.maxBombs) {
            const bx = Math.round(player.x);
            const by = Math.round(player.y);

            if (!this.bombs.some(b => b.x === bx && b.y === by)) {
                this.bombs.push({
                    x: bx,
                    y: by,
                    ownerId: socketId,
                    timer: 3000,
                    range: player.bombRange
                });
                player.activeBombs++;
            }
        }
    }

    update(dt) {
        if (this.gameState !== 'PLAYING') return;

        // Update Bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.timer -= dt;
            if (bomb.timer <= 0) {
                this.explodeBomb(bomb);
                this.bombs.splice(i, 1);
                const owner = this.players.get(bomb.ownerId);
                if (owner) owner.activeBombs--;
            }
        }

        // Update Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].timer -= dt;
            if (this.explosions[i].timer <= 100) { // Slight delay for kill check
                this.explosions.splice(i, 1);
            }
        }

        // Sudden Death logic
        if (Date.now() - this.matchStartTime > this.suddenDeathTimer) {
            this.applySuddenDeath();
        }
    }

    explodeBomb(bomb) {
        const directions = [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        this.createExplosionCell(bomb.x, bomb.y, bomb.ownerId);

        directions.slice(1).forEach(dir => {
            for (let i = 1; i <= bomb.range; i++) {
                const tx = bomb.x + dir.dx * i;
                const ty = bomb.y + dir.dy * i;
                if (this.isWall(tx, ty)) break;
                this.createExplosionCell(tx, ty, bomb.ownerId);
                if (this.isSoftBlock(tx, ty)) {
                    this.grid[ty][tx] = 0;
                    break;
                }
            }
        });
    }

    createExplosionCell(x, y, ownerId) {
        this.explosions.push({ x, y, timer: 500 });
        this.players.forEach(player => {
            if (player.alive && Math.round(player.x) === x && Math.round(player.y) === y) {
                player.alive = false;
                if (ownerId !== player.id) {
                    const killer = this.players.get(ownerId);
                    if (killer) killer.kills++;
                }
                this.checkWinCondition();
            }
        });
    }

    applySuddenDeath() {
        const now = Date.now();
        if (now - this.lastSuddenDeathTick < 500) return; // Tick every 0.5s
        this.lastSuddenDeathTick = now;

        const coords = this.getSuddenDeathCoords(this.suddenDeathIndex);
        if (coords) {
            const { x, y } = coords;
            this.grid[y][x] = 1; // Turn cell into wall

            // Kill players at this location
            this.players.forEach(player => {
                if (player.alive && Math.round(player.x) === x && Math.round(player.y) === y) {
                    player.alive = false;
                    this.checkWinCondition();
                }
            });

            this.suddenDeathIndex++;
        }
    }

    getSuddenDeathCoords(index) {
        let count = 0;
        // Spiral inward pattern
        let top = 0, left = 0, bottom = this.gridHeight - 1, right = this.gridWidth - 1;

        while (top <= bottom && left <= right) {
            for (let i = left; i <= right; i++) {
                if (count === index) return { x: i, y: top };
                count++;
            }
            top++;
            for (let i = top; i <= bottom; i++) {
                if (count === index) return { x: right, y: i };
                count++;
            }
            right--;
            for (let i = right; i >= left; i--) {
                if (count === index) return { x: i, y: bottom };
                count++;
            }
            bottom--;
            for (let i = bottom; i >= top; i--) {
                if (count === index) return { x: left, y: i };
                count++;
            }
            left++;
        }
        return null;
    }

    checkWinCondition() {
        const alives = Array.from(this.players.values()).filter(p => p.alive);
        if (alives.length <= 1 && this.players.size > 1) {
            this.gameState = 'ENDED';
            this.winner = alives[0] ? alives[0].id : null;
        }
    }

    isWall(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return true;
        return this.grid[y][x] === 1;
    }

    isSoftBlock(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return false;
        return this.grid[y][x] === 2;
    }

    checkCollision(x, y, playerId = null) {
        const gx = Math.round(x);
        const gy = Math.round(y);
        if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) return true;

        // Check grid collision
        if (this.grid[gy][gx] !== 0) return true;

        // Check bomb collision, but allow walking through bombs you just placed
        const bombAtPos = this.bombs.find(b => b.x === gx && b.y === gy);
        if (bombAtPos && bombAtPos.ownerId !== playerId) return true;
        if (bombAtPos && bombAtPos.timer < 2500) return true; // After 0.5s, bomb becomes solid

        return false;
    }

    getPlayerColor(i) {
        return ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'][i % 8];
    }

    getState() {
        return {
            grid: this.grid,
            players: Array.from(this.players.values()),
            bombs: this.bombs,
            explosions: this.explosions,
            gameState: this.gameState,
            hostId: this.hostId,
            winner: this.winner,
            roomCode: this.roomId
        };
    }
}

module.exports = GameRoom;
