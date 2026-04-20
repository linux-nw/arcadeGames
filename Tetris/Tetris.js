const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

const COLS = 10
const ROWS = 20
const SIZE = 30
ctx.setTransform(SIZE, 0, 0, SIZE, 0, 0)

const scoreEl = document.getElementById("score")
const levelEl = document.getElementById("level")
const linesEl = document.getElementById("lines")
const msg = document.getElementById("message")
const wrapper = document.querySelector(".game-wrapper")

const sGames = document.getElementById("s-games")
const sHigh = document.getElementById("s-high")
const sLevel = document.getElementById("s-level")
const sLines = document.getElementById("s-lines")

const COLORS = [
    null,
    "#00e5ff",
    "#fff65b",
    "#c77dff",
    "#39ff14",
    "#ff355e",
    "#5f5cff",
    "#ff9f1c"
]

const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
]

let board, piece, score, level, lines
let dropCounter = 0
let dropInterval = 800
let lastTime = 0
let running = false
let rotateLocked = false;
let inputLocked = false;



const stats = JSON.parse(localStorage.getItem("tetrisStats")) || {
    games: 0,
    high: 0,
    bestLevel: 1,
    lines: 0
}

function renderStats() {
    sGames.textContent = stats.games
    sHigh.textContent = stats.high
    sLevel.textContent = stats.bestLevel
    sLines.textContent = stats.lines
}

renderStats()

function reset() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    piece = createPiece();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 800;

    holdPiece = null;
    holdLocked = false;
    nextPiece = null;

    holdCtx.clearRect(0, 0, 4, 4);
    nextCtx.clearRect(0, 0, 4, 4);

    updateUI();
}


function randomPiece() {
    const type = 1 + (Math.random() * 7 | 0);
    return {
        type,
        shape: SHAPES[type - 1]
    };
}

function cloneShape(shape) {
    return shape.map(r => [...r]);
}

function hold() {
    if (holdLocked) return;
    holdLocked = true;

    if (!holdPiece) {
        holdPiece = {
            type: piece.type,
            shape: cloneShape(piece.shape)
        };
        piece = createPiece();
    } else {
        const tmp = {
            type: holdPiece.type,
            shape: cloneShape(holdPiece.shape)
        };

        holdPiece = {
            type: piece.type,
            shape: cloneShape(piece.shape)
        };

        piece = {
            type: tmp.type,
            shape: cloneShape(tmp.shape),
            x: (COLS / 2 | 0) - (tmp.shape[0].length / 2 | 0),
            y: 0
        };
    }

    drawPreview(holdCtx, holdPiece);
}


function drawPreview(ctx, p) {
    ctx.clearRect(0, 0, 4, 4);
    p.shape.forEach((r, y) => r.forEach((v, x) => {
        if (v) {
            ctx.fillStyle = COLORS[p.type];
            ctx.fillRect(x, y, 1, 1);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = .08;
            ctx.strokeRect(x, y, 1, 1);
        }
    }));
}




function createPiece() {
    holdLocked = false;

    if (!nextPiece) nextPiece = randomPiece();

    const p = {
        type: nextPiece.type,
        shape: cloneShape(nextPiece.shape),
        x: (COLS / 2 | 0) - (nextPiece.shape[0].length / 2 | 0),
        y: 0
    };

    nextPiece = randomPiece();
    drawPreview(nextCtx, nextPiece);
    holdLocked = false;
    return p;
}


function collide() {
    return piece.shape.some((r, y) =>
        r.some((v, x) =>
            v && (board[y + piece.y]?.[x + piece.x] !== 0)
        )
    )
}

function merge() {
    piece.shape.forEach((r, y) => r.forEach((v, x) => {
        if (v) board[y + piece.y][x + piece.x] = piece.type
    }))
}

let locking = false;

function rotate() {
    const original = cloneShape(piece.shape);
    const ox = piece.x;
    const oy = piece.y;

    piece.shape = piece.shape[0].map((_, i) =>
        piece.shape.map(r => r[i]).reverse()
    );

    const kicks = [
        [0, 0],
        [-1, 0], [1, 0],
        [0, -1]
    ];

    for (const [dx, dy] of kicks) {
        piece.x = ox + dx;
        piece.y = oy + dy;
        if (!collide()) return;
    }

    piece.shape = original;
    piece.x = ox;
    piece.y = oy;
}
document.addEventListener("keydown", e => {
    // If not running yet, allow Space to start the game (avoid double-binding when running)
    if (!running) {
        if (e.code === "Space") {
            e.preventDefault();
            reset();
            running = true;
            msg.textContent = "PLAY!";
            update();
        }
        return;
    }

    // when running, prevent default for Space/Shift to keep gameplay consistent
    if (running && (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight")) {
        e.preventDefault();
    }

    if (e.repeat) return;
    if (inputLocked) return;

    switch (e.code) {

    case "ShiftLeft":
    case "ShiftRight":
      hold();
      break;

    case "ArrowLeft":
      piece.x--;
      if (collide()) piece.x++;
      break;

    case "ArrowRight":
      piece.x++;
      if (collide()) piece.x--;
      break;

    case "ArrowDown":
      piece.y++;
      if (collide()) piece.y--;
      break;

    case "ArrowUp":
      rotate();
      break;

    case "Space":
      while (!collide()) piece.y++;
      piece.y--;
      inputLocked = true;
      lockPiece();
      setTimeout(() => inputLocked = false, 0);
      break;
  }
});




function clearLines() {
    let cleared = 0
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) if (!board[y][x]) continue outer
        board.splice(y, 1)
        board.unshift(Array(COLS).fill(0))
        cleared++
        y++
    }
    if (cleared) {
        lines += cleared
        score += cleared * 150 * level
        level = 1 + (lines / 10 | 0)
        dropInterval = Math.max(120, 800 - level * 70)
        wrapper.classList.add("flash")
        setTimeout(() => wrapper.classList.remove("flash"), 150)
    }
}

function draw() {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, COLS, ROWS)

    board.forEach((r, y) => r.forEach((v, x) => {
        if (v) {
            ctx.fillStyle = COLORS[v]
            ctx.fillRect(x, y, 1, 1)
            ctx.strokeStyle = "#000"
            ctx.lineWidth = .1
            ctx.strokeRect(x, y, 1, 1)
        }
    }))

    piece.shape.forEach((r, y) => r.forEach((v, x) => {
        if (v) {
            ctx.fillStyle = COLORS[piece.type]
            ctx.fillRect(x + piece.x, y + piece.y, 1, 1)
            ctx.strokeStyle = "#000"
            ctx.lineWidth = .1
            ctx.strokeRect(x + piece.x, y + piece.y, 1, 1)
        }
    }))
}

function update(t = 0) {
    if (!running) return;

    const delta = t - lastTime;
    lastTime = t;
    dropCounter += delta;

    if (dropCounter > dropInterval) {
        piece.y++;
        if (collide()) {
            piece.y--;
            lockPiece();
        }
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(update);
}



function gameOver() {
    running = false
    stats.games++
    stats.high = Math.max(stats.high, score)
    stats.bestLevel = Math.max(stats.bestLevel, level)
    stats.lines += lines
    localStorage.setItem("tetrisStats", JSON.stringify(stats))
    renderStats()
    msg.textContent = "GAME OVER"
    document.getElementById("restart-btn").classList.remove("hidden")
    if (wrapper) {
        wrapper.classList.remove('win');
        wrapper.classList.add('lose');
    }
}

// add lose animation class and remove after animation ends
if (wrapper) {
    wrapper.addEventListener('animationend', (e) => {
        if (e.animationName === 'loseShake' || e.animationName === 'winPulse') {
            wrapper.classList.remove('lose');
            wrapper.classList.remove('win');
        }
    });
}

function updateUI() {
    scoreEl.textContent = score
    levelEl.textContent = level
    linesEl.textContent = lines
}

document.getElementById("start-btn").onclick = () => {
    reset()
    running = true
    msg.textContent = "PLAY!"
    update()
}

document.getElementById("restart-btn").onclick = () => {
    reset()
    running = true
    msg.textContent = "PLAY!"
    update()
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("text").textContent = "🏁 TETRIS"
})


document.addEventListener("DOMContentLoaded", () => {
    const texts = [
        "🏁 TETRIS"
    ]

    const colors = [
        "#ff355e",
        "#ff9f1c",
        "#fff65b",
        "#39ff14",
        "#00e5ff",
        "#5f5cff",
        "#c77dff"
    ]

    const scramble = "!@#$%^&*<>?/\\|~"
    const textEl = document.getElementById("text")
    const icon = document.getElementById("nextText")

    let index = 0
    let typing = false
    let timer

    const rand = () => scramble[Math.random() * scramble.length | 0]

    function span(c, color, drop) {
        const s = document.createElement("span")
        s.textContent = c
        s.style.color = color
        if (drop) s.classList.add("char-drop")
        return s
    }

    function type(txt) {
        if (typing) return
        typing = true
        textEl.innerHTML = ""

        const u = document.createElement("span")
        u.className = "console-underscore"
        u.textContent = "_"
        textEl.appendChild(u)

        let i = 0
        const chars = [...txt]

        function step() {
            if (i >= chars.length) {
                typing = false
                return
            }

            const fake = span(rand(), colors[i % colors.length], true)
            fake.style.opacity = ".4"
            textEl.insertBefore(fake, u)

            setTimeout(() => {
                fake.remove()
                const real = span(chars[i], colors[i % colors.length])
                textEl.insertBefore(real, u)
                i++
                setTimeout(step, 70)
            }, 60)
        }
        step()
    }

    function next() {
        index = (index + 1) % texts.length
        type(texts[index])
    }

    function loop() {
        clearInterval(timer)
        timer = setInterval(next, 8000)
    }

    type(texts[index])
    loop()

    textEl.onclick = () => { next(); loop() }
    icon.onclick = () => { next(); loop() }
})

document.getElementById("reset-stats").addEventListener("click", () => {
    const ok = confirm(
        "Are you sure?\n\nThis will permanently delete ALL Tetris statistics."
    );

    if (!ok) return;

    localStorage.removeItem("tetrisStats");

    stats.games = 0;
    stats.high = 0;
    stats.bestLevel = 1;
    stats.lines = 0;

    renderStats();
});

const nextCanvas = document.getElementById("nextCanvas");
const holdCanvas = document.getElementById("holdCanvas");
const nextCtx = nextCanvas.getContext("2d");
const holdCtx = holdCanvas.getContext("2d");

nextCtx.setTransform(30, 0, 0, 30, 0, 0);
holdCtx.setTransform(30, 0, 0, 30, 0, 0);

let nextPiece = null;
let holdPiece = null;
let holdLocked = false;

function lockPiece() {
    merge();
    clearLines();

    piece = createPiece();

    // 💀 GAME OVER CHECK
    if (collide()) {
        gameOver();
        return;
    }
}
