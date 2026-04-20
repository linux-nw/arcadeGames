/* ================= CONSOLE TEXT EFFECT ================= */


const DIRS = [
    { x: 1, y: 0 },   // 0 rechts
    { x: 0, y: 1 },   // 1 runter
    { x: -1, y: 0 },   // 2 links
    { x: 0, y: -1 }   // 3 hoch
];

const DIR_ANGLES = [
    0,
    Math.PI / 2,
    Math.PI,
    -Math.PI / 2
];

let panel;
let gameEnded = false;
let hitCooldown = false;

document.addEventListener("DOMContentLoaded", () => {
    panel = document.querySelector(".game-wrapper");
});

document.addEventListener("DOMContentLoaded", () => {
    const texts = [
        "🟡 PAC-MAN"
    ];

    const colors = [
        "#ffff00", // Yellow (Pac-Man)
        "#ff355e", // Red
        "#00e5ff", // Cyan
        "#fff65b"  // Yellow
    ];

    const rainbow = [
        "#ff355e", // Red
        "#ff9f1c", // Orange
        "#fff65b", // Yellow
        "#39ff14", // Green
        "#00e5ff", // Cyan
        "#5f5cff", // Blue
        "#c77dff"  // Purple
    ];

    const scrambleChars = "!@#$%^&*<>?/\\|~";
    const textEl = document.getElementById("text");
    const icon = document.getElementById("nextText");

    let index = 0;
    let typing = false;
    let intervalId = null;

    const randomChar = () =>
        scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

    function span(char, color, drop = false) {
        const s = document.createElement("span");
        s.textContent = char;
        s.style.color = color;
        if (drop) s.classList.add("char-drop");
        return s;
    }

    function typeText(text, finalColor) {
        if (typing) return;
        typing = true;

        textEl.innerHTML = "";
        icon.style.color = finalColor;

        const chars = Array.from(text);
        let i = 0;

        const underscore = document.createElement("span");
        underscore.classList.add("console-underscore");
        underscore.textContent = "_";
        underscore.style.backdropFilter = "blur(4px)";
        textEl.appendChild(underscore);

        function next() {
            if (i >= chars.length) {
                setTimeout(() => {
                    textEl.querySelectorAll(".char-final").forEach((l, idx) => {
                        l.style.transition = "color .5s ease, transform .3s ease";
                        l.style.color = rainbow[idx % rainbow.length];
                        l.style.transform = "scale(1)";
                    });
                    typing = false;
                }, 100);
                return;
            }

            const fake = span(randomChar(), rainbow[i % rainbow.length], true);
            fake.style.opacity = "0.5";
            fake.style.transform = "scale(0.8)";
            fake.style.transition = "opacity .2s ease, transform .2s ease";
            textEl.insertBefore(fake, underscore);

            setTimeout(() => {
                fake.remove();

                const real = span(chars[i], rainbow[i % rainbow.length]);
                real.classList.add("char-final");
                real.style.opacity = "1";
                real.style.transform = "scale(1.1)";
                real.style.transition = "opacity .3s ease, transform .3s ease";
                textEl.insertBefore(real, underscore);

                i++;
                setTimeout(next, 80);
            }, 70);
        }

        next();
    }

    function nextText() {
        index = (index + 1) % texts.length;
        typeText(texts[index], colors[index % colors.length]);
    }

    function resetInterval() {
        clearInterval(intervalId);
        intervalId = setInterval(nextText, 8000);
    }

    typeText(texts[index], colors[index % colors.length]);
    resetInterval();

    textEl.addEventListener("click", () => {
        nextText();
        resetInterval();
    });

    icon.addEventListener("click", () => {
        nextText();
        resetInterval();
    });
});



/* ================= GAME VARIABLES ================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let TILE_SIZE = 32;
let COLS = 0;
let ROWS = 0;
let maze = [];

let score = 0;
let lives = 3;
let level = 1;
let gameRunning = false;
let gamePaused = false;

// Statistics
let gamesPlayed = 0;
let gamesWon = 0;
let highScore = localStorage.getItem('pacman_highscore') || 0;
let highLevel = localStorage.getItem('pacman_highlevel') || 1;

// New Pac-Man Maze (28x22)
const pacmanMaze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 2, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 2, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 3, 3, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Pellets (0 = normal, 2 = power)
const pellets = [];

// Initialize game
function initGame() {
    ROWS = pacmanMaze.length;
    COLS = pacmanMaze[0].length;

    const containerHeight = window.innerHeight - 280;
    const containerWidth = window.innerWidth - 40;

    const maxTileFromHeight = Math.floor(containerHeight / ROWS);
    const maxTileFromWidth = Math.floor(containerWidth / COLS);

    let tileSize = Math.min(maxTileFromHeight, maxTileFromWidth);
    tileSize = Math.min(tileSize, 24);
    tileSize = Math.max(tileSize, 10);

    TILE_SIZE = tileSize;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    maze = pacmanMaze.map(row => [...row]);

    pellets.length = 0;
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
            if (maze[row][col] === 0 || maze[row][col] === 2) {
                pellets.push({ x: col, y: row, eaten: false, power: maze[row][col] === 2 });
            }
        }
    }
}

// Pac-Man
const pacman = {
    x: 1,
    y: 1,
    direction: 0,
    nextDirection: 0,
};

// 4 Ghosts with BFS pathfinding
const ghosts = [
    { x: 13, y: 10, homeX: 13, homeY: 10, color: "#ff0000", name: "BLINKY", behavior: "chase" },
    { x: 14, y: 10, homeX: 14, homeY: 10, color: "#ffb8ff", name: "PINKY", behavior: "ambush" },
    { x: 12, y: 11, homeX: 12, homeY: 11, color: "#00ffff", name: "INKY", behavior: "scattered" },
    { x: 15, y: 11, homeX: 15, homeY: 11, color: "#ffa500", name: "CLYDE", behavior: "distance" },
];

/* ================= HELPER FUNCTIONS ================= */
function isWall(x, y) {
    if (y < 0 || y >= maze.length || x < 0 || x >= maze[0].length) return true;

    // Ghost-House (3) blockiert Pac-Man
    if (maze[y][x] === 3) return true;

    return maze[y][x] === 1;
}

function canGhostMove(x, y) {
    if (y < 0 || y >= maze.length || x < 0 || x >= maze[0].length) return false;
    return maze[y][x] !== 1;
}


function canMove(x, y) {
    return !isWall(x, y);
}

function updateScore() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("level").textContent = level;
    updateStats();
    highScore = Math.max(highScore, score);
    highLevel = Math.max(highLevel, level);

    localStorage.setItem('pacman_highscore', highScore);
    localStorage.setItem('pacman_highlevel', highLevel);

}

function updateStats() {
    localStorage.setItem('pacman_games', gamesPlayed);
    localStorage.setItem('pacman_won', gamesWon);

    document.getElementById("stat-games").textContent = gamesPlayed;
    document.getElementById("stat-won").textContent = gamesWon;

    const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
    document.getElementById("stat-rate").textContent = winRate + "%";

    document.getElementById("stat-high").textContent = highScore;
    document.getElementById("stat-level").textContent = Math.max(level, highLevel);
}

function getPelletCount() {
    return pellets.filter(p => !p.eaten).length;
}

function updatePelletCount() {
    if (!gameRunning) return;

    if (getPelletCount() === 0) {
        winGame();
    }
}


function winGame() {
    if (!gameRunning) return;

gameEnded = true;
gamePaused = true;
gameRunning = false;

    panel.classList.add("win");

    setTimeout(() => {
        panel.classList.remove("win");
    }, 1200);

    updateMessage("YOU WIN 🏆");
    gamesWon++;
    updateStats();
}


document.addEventListener("keydown", e => {
    if (e.key === "w") {
        pellets.forEach(p => p.eaten = true);
        updatePelletCount();
    }
});



/* ================= PAC-MAN MOVEMENT ================= */
function movePacman() {
    const nd = DIRS[pacman.nextDirection];
    if (nd && canMove(pacman.x + nd.x, pacman.y + nd.y)) {
        pacman.direction = pacman.nextDirection;
    }

    const d = DIRS[pacman.direction];
    if (d && canMove(pacman.x + d.x, pacman.y + d.y)) {
        pacman.x += d.x;
        pacman.y += d.y;
    }

    // Pellet fressen
    const pellet = pellets.find(
        p => !p.eaten && p.x === pacman.x && p.y === pacman.y
    );

    if (pellet) {
        pellet.eaten = true;
        score += pellet.power ? 50 : 10;
        updateScore();
        updatePelletCount();
    }

    // Tunnel (Original Pac-Man)
    // Tunnel (Original)
    if (pacman.y === 10 && pacman.x === 0 && pacman.direction === 2) {
        pacman.x = COLS - 1;
    }
    if (pacman.y === 10 && pacman.x === COLS - 1 && pacman.direction === 0) {
        pacman.x = 0;
    }



}


function levelUpGame() {
    level++;
    score += 500;

    if (level > highLevel) {
        highLevel = level;
        localStorage.setItem('pacman_highlevel', highLevel);
    }

    pellets.forEach(p => p.eaten = false);

    pacman.x = 1;
    pacman.y = 1;
    pacman.direction = 0;
    pacman.nextDirection = 0;
    ghosts.forEach((g) => {
        g.x = g.homeX;
        g.y = g.homeY;
    });

    updateScore();
    updateMessage("LEVEL " + level + "!");

}

/* ================= GHOST AI WITH BFS ================= */
function bfsPath(start, target) {
    const queue = [[start.x, start.y, []]];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const [x, y, path] = queue.shift();

        if (x === target.x && y === target.y) {
            return path.length > 0 ? path[0] : null;
        }

        const moves = [[-1, 0], [0, 1], [1, 0], [0, -1]];
        for (const [dx, dy] of moves) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;

            if (canGhostMove(nx, ny) && !visited.has(key)) {
                visited.add(key);
                queue.push([nx, ny, [...path, [nx, ny]]]);
            }
        }
    }

    return null;
}

function moveGhost(ghost) {
    if (gamePaused) return;

    let target = { x: pacman.x, y: pacman.y };

    // Different behaviors
    if (ghost.behavior === "chase") {
        target = { x: pacman.x, y: pacman.y };
    } else if (ghost.behavior === "ambush") {
        const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
        const [dx, dy] = dirs[pacman.direction];
        target = {
            x: Math.max(0, Math.min(COLS - 1, pacman.x + dx * 4)),
            y: Math.max(0, Math.min(ROWS - 1, pacman.y + dy * 4))
        };
    } else if (ghost.behavior === "scattered") {
        if (frameCount % 200 < 100) {
            target = { x: pacman.x, y: pacman.y };
        } else {
            target = { x: COLS - 2, y: ROWS - 2 };
        }
    } else if (ghost.behavior === "distance") {
        const dist = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
        target = dist < 10 ? { x: 1, y: 1 } : { x: pacman.x, y: pacman.y };
    }

    // Use BFS to find path
    const nextMove = bfsPath(ghost, target);

    if (nextMove) {
        ghost.x = nextMove[0];
        ghost.y = nextMove[1];
    } else {
        // If no path, random valid move
        const moves = [[-1, 0], [0, 1], [1, 0], [0, -1]];
        const validMoves = moves.filter(([dx, dy]) =>
            canGhostMove(ghost.x + dx, ghost.y + dy));

        if (validMoves.length > 0) {
            const [dx, dy] = validMoves[Math.floor(Math.random() * validMoves.length)];
            ghost.x += dx;
            ghost.y += dy;
        }
    }

}

function gameOver() {
gameEnded = true;
gamePaused = true;
gameRunning = false;
    panel.classList.add("lose");

    setTimeout(() => {
        panel.classList.remove("lose");
    }, 600);

    updateMessage("GAME OVER");
}

function loseLife() {
        if (hitCooldown) return;
    hitCooldown = true;
    gamePaused = true;


    lives--;
    updateScore();

    if (lives <= 0) {
        gameOver();
        return;
    }

    gamePaused = true;
    updateMessage("LOST A LIFE!");

    setTimeout(() => {
        pacman.x = 1;
        pacman.y = 1;
        pacman.direction = 0;
        pacman.nextDirection = 0;

        gamePaused = false;
        hitCooldown = false;   // 🔓 WICHTIG
        updateMessage("IN GAME");
    },300);
}


const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");


/* ================= DRAWING ================= */
function drawMaze() {
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
            if (maze[row][col] === 1) {
                ctx.fillStyle = "#1a4d8a";
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "#2d73c4";
                ctx.lineWidth = 1;
                ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

document.getElementById("reset-stats").addEventListener("click", () => {
  const sure = confirm(
    "Are you sure?\n\nThis will permanently delete ALL Pac-Man statistics."
  );

  if (!sure) return;

  resetStats();
});


function drawPellets() {
    pellets.forEach(pellet => {
        if (!pellet.eaten) {
            const x = pellet.x * TILE_SIZE + TILE_SIZE / 2;
            const y = pellet.y * TILE_SIZE + TILE_SIZE / 2;

            if (pellet.power) {
                ctx.fillStyle = "#ffff00";
                ctx.fillRect(x - 4, y - 4, 8, 8);
            } else {
                ctx.fillStyle = "#edc6d8";
                ctx.fillRect(x - 2, y - 2, 4, 4);
            }
        }
    });
}

function drawPacman() {
    const x = pacman.x * TILE_SIZE + TILE_SIZE / 2;
    const y = pacman.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = TILE_SIZE / 2 - 3;

    ctx.fillStyle = "#ffff00";
    ctx.beginPath();

    const mouthPhase = (Date.now() / 200) % 2;
    let mouthAngle = Math.max(0, Math.min(0.5, Math.abs(mouthPhase - 1) * 0.5));

    const startAngle = DIR_ANGLES[pacman.direction] + mouthAngle;
    const endAngle = DIR_ANGLES[pacman.direction] - mouthAngle + Math.PI * 2;


    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.lineTo(x, y);
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach((ghost) => {
        const x = ghost.x * TILE_SIZE;
        const y = ghost.y * TILE_SIZE;
        const size = TILE_SIZE;

        ctx.fillStyle = ghost.color;

        ctx.beginPath();
        ctx.moveTo(x + 1, y + size * 0.4);
        ctx.lineTo(x + size - 1, y + size * 0.4);
        ctx.lineTo(x + size - 1, y + size - 2);

        ctx.quadraticCurveTo(x + size * 0.75, y + size, x + size * 0.5, y + size - 2);
        ctx.quadraticCurveTo(x + size * 0.25, y + size, x + 1, y + size - 2);
        ctx.lineTo(x + 1, y + size * 0.4);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + size / 2, y + size * 0.35, size * 0.45, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        const eyeY = y + size * 0.25;
        ctx.beginPath();
        ctx.arc(x + size * 0.35, eyeY, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.65, eyeY, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0000ff";
        ctx.beginPath();
        ctx.arc(x + size * 0.35, eyeY, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.65, eyeY, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
    });
}

function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMaze();
    drawPellets();
    drawPacman();
    drawGhosts();
}

/* ================= GAME LOOP ================= */
let frameCount = 0;
const pacmanSpeed = 12;
const ghostSpeed = 14;  // Slower ghosts

function gameLoop() {
    if (gameRunning && !gamePaused) {
        frameCount++;

        if (frameCount % pacmanSpeed === 0) movePacman();
        if (frameCount % ghostSpeed === 0) ghosts.forEach(g => moveGhost(g));

        checkGhostCollision(); // ⬅ IMMER prüfen


        draw();
    }


    requestAnimationFrame(gameLoop);
}

/* ================= CONTROLS ================= */
document.addEventListener("keydown", (e) => {
if (gameEnded) return;   // ⬅ DAS FEHLT
    if (e.key === " ") {
        e.preventDefault();
        if (!gameRunning) startGame();
        else gamePaused = !gamePaused;
    }
    if (e.key === "r" || e.key === "R") {
        location.reload();
    }

    const keyMap = {
        ArrowRight: 0,
        ArrowDown: 1,
        ArrowLeft: 2,
        ArrowUp: 3
    };


    if (e.key in keyMap) {
        pacman.nextDirection = keyMap[e.key];
    }
});

function startGame() {
    gameRunning = true;
    gamePaused = false;
    document.getElementById("start-btn").textContent = "PAUSE";
    updateMessage("IN GAME...");
    gamesPlayed++;
    updateStats();

}

function checkGhostCollision() {
    if (hitCooldown || gamePaused || gameEnded) return;

    for (const ghost of ghosts) {
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            loseLife();
            break;
        }
    }
}

document.getElementById("start-btn").addEventListener("click", () => {
        if (gameEnded) return;   // ⬅ DAS FEHLT
    if (!gameRunning) {
        startGame();
    } else {
        gamePaused = !gamePaused;
        document.getElementById("start-btn").textContent = gamePaused ? "RESUME" : "PAUSE";
        updateMessage(gamePaused ? "PAUSED" : "IN GAME...");
    }
});

document.getElementById("reset-stats").addEventListener("click", () => {
    gamesPlayed = 0;
    gamesWon = 0;
    highScore = 0;
    highLevel = 1;
    localStorage.removeItem('pacman_highscore');
    localStorage.removeItem('pacman_highlevel');
    updateStats();
});

function updateMessage(text) {
    document.getElementById("message").textContent = text;
}

/* ================= INITIALIZATION ================= */
window.addEventListener("resize", () => {
    if (gameRunning) return;
    initGame();
    updateScore();
    draw();
});

window.addEventListener("load", () => {
    gamesPlayed = parseInt(localStorage.getItem('pacman_games') || 0);
    gamesWon = parseInt(localStorage.getItem('pacman_won') || 0);
    highScore = parseInt(localStorage.getItem('pacman_highscore') || 0);
    highLevel = parseInt(localStorage.getItem('pacman_highlevel') || 1);

    initGame();
    updateScore();
    updateStats();
    updateMessage("READY!");
    draw();
    gameLoop();
});
