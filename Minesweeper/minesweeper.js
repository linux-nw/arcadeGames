/* ================= HEADER ANIMATION ================= */
document.addEventListener("DOMContentLoaded", () => {
  const text = "💣 MINESWEEPER";

  const colors = [
    "#ff355e",
    "#ff9f1c",
    "#fff65b",
    "#39ff14",
    "#00e5ff",
    "#5f5cff",
    "#c77dff"
  ];

  const scrambleChars = "!@#$%^&*<>?/\\|~";
  const textEl = document.getElementById("text");
  const icon = document.getElementById("nextText");

  let typing = false;

  const randomChar = () =>
    scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  function span(char, color) {
    const s = document.createElement("span");
    s.textContent = char;
    s.style.color = color;
    return s;
  }

  
  function typeText() {
    if (typing) return;
    typing = true;

    textEl.innerHTML = "";
    const chars = Array.from(text);
    let i = 0;

    const underscore = document.createElement("span");
    underscore.classList.add("console-underscore");
    underscore.textContent = "_";
    textEl.appendChild(underscore);

    function next() {
      if (i >= chars.length) {
        setTimeout(() => {
          textEl.querySelectorAll(".char-final").forEach((l, idx) => {
            l.style.transition = "color .5s ease, transform .3s ease";
            l.style.color = colors[idx % colors.length];
            l.style.transform = "scale(1)";
          });
          typing = false;
        }, 100);
        return;
      }

      const fake = span(randomChar(), colors[i % colors.length]);
      fake.style.opacity = "0.5";
      fake.style.transform = "scale(0.8)";
      fake.style.transition = "opacity .2s ease, transform .2s ease";
      textEl.insertBefore(fake, underscore);

      setTimeout(() => {
        fake.remove();

        const real = span(chars[i], colors[i % colors.length]);
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

  typeText();
  textEl.addEventListener("click", typeText);
  icon.addEventListener("click", typeText);
});

/* ================= GAME LOGIC ================= */

const LEVELS = {
  beginner:     { rows: 9,  cols: 9,  bombs: 10 },
  intermediate: { rows: 16, cols: 16, bombs: 40 },
  expert:       { rows: 16, cols: 30, bombs: 99 }
};

const gridEl   = document.getElementById("grid");
const statusEl = document.getElementById("status");
const timerEl  = document.getElementById("timer");
const select   = document.getElementById("difficulty");
const restart  = document.getElementById("restart");
const panelEl  = document.querySelector(".ms-panel");

const statStarted = document.getElementById("stat-started");
const statWon     = document.getElementById("stat-won");
const statRate    = document.getElementById("stat-rate");
const statBest    = document.getElementById("stat-best");
const statAvg     = document.getElementById("stat-avg");

let ROWS, COLS, BOMBS;
let grid = [];
let revealed = new Set();
let flags = new Set();
let firstClick = true;
let gameOver = false;

let timer = 0;
let timerInterval = null;

/* ================= TIMER ================= */
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timer++;
    timerEl.textContent = "⏱ " + String(timer).padStart(3, "0");
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/* ================= STATS ================= */
function loadStats() {
  return JSON.parse(localStorage.getItem("ms_stats")) || {};
}

function saveStats(stats) {
  localStorage.setItem("ms_stats", JSON.stringify(stats));
}

function ensureStats(level) {
  const all = loadStats();
  if (!all[level]) {
    all[level] = { started: 0, won: 0, best: null, totalTime: 0 };
    saveStats(all);
  }
  return all;
}

function renderStats() {
  const s = loadStats()[select.value];
  statStarted.textContent = s.started;
  statWon.textContent = s.won;
  statRate.textContent = s.started ? Math.round((s.won / s.started) * 100) + "%" : "0%";
  statBest.textContent = s.best !== null ? s.best + "s" : "---";
  statAvg.textContent = s.won ? Math.round(s.totalTime / s.won) + "s" : "---";
}

/* ================= START ================= */
function start(level = "intermediate") {
  ({ rows: ROWS, cols: COLS, bombs: BOMBS } = LEVELS[level]);

  grid = Array(ROWS * COLS).fill(0);
  revealed.clear();
  flags.clear();
  firstClick = true;
  gameOver = false;

  panelEl.classList.remove("win", "lose");

  stopTimer();
  timer = 0;
  timerEl.textContent = "⏱ 000";
  statusEl.textContent = "READY";

  const all = ensureStats(level);
  all[level].started++;
  saveStats(all);

  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${COLS}, 44px)`;

  render();
  renderStats();
}

/* ================= RENDER GRID ================= */
function render() {
  for (let i = 0; i < grid.length; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";

    cell.oncontextmenu = e => {
      e.preventDefault();
      if (gameOver || cell.classList.contains("revealed")) return;

      if (cell.classList.contains("flag")) {
        cell.classList.remove("flag");
        cell.textContent = "";
        flags.delete(i);
      } else {
        cell.classList.add("flag");
        cell.textContent = "🚩";
        flags.add(i);
      }
    };

    cell.onclick = () => reveal(i, cell);
    gridEl.appendChild(cell);
  }
}

/* ================= REVEAL ================= */
function reveal(i, el) {
  if (gameOver || revealed.has(i) || el.classList.contains("flag")) return;

  if (firstClick) {
    generateField(i);
    firstClick = false;
    startTimer();
  }

  revealed.add(i);
  el.classList.add("revealed");
  el.textContent = "";

  if (grid[i] === "B") {
    el.textContent = "💣";
    statusEl.textContent = "GAME OVER";
    gameOver = true;
    stopTimer();
    revealAllBombs();

    panelEl.classList.add("lose");
    setTimeout(() => panelEl.classList.remove("lose"), 700);
    return;
  }

  if (grid[i] > 0) {
    el.textContent = grid[i];
    el.classList.add("n" + grid[i]);
  } else {
    floodFill(i);
  }

  checkWin();
}

/* ================= FIELD ================= */
function generateField(safe) {
  let placed = 0;
  while (placed < BOMBS) {
    const r = Math.floor(Math.random() * grid.length);
    if (r === safe || grid[r] === "B") continue;
    grid[r] = "B";
    placed++;
  }
  grid.forEach((v, i) => {
    if (v === "B") return;
    grid[i] = neighbors(i).filter(n => grid[n] === "B").length;
  });
}

function neighbors(i) {
  const x = i % COLS;
  const y = Math.floor(i / COLS);
  const res = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS)
        res.push(ny * COLS + nx);
    }
  return res;
}

function floodFill(i) {
  neighbors(i).forEach(n => {
    if (!revealed.has(n)) reveal(n, gridEl.children[n]);
  });
}

/* ================= END STATES ================= */
function revealAllBombs() {
  grid.forEach((v, i) => {
    if (v === "B") {
      const c = gridEl.children[i];
      c.classList.add("revealed");
      c.textContent = "💣";
    }
  });
}

function checkWin() {
  if (revealed.size === grid.length - BOMBS) {
    statusEl.textContent = "YOU WIN";
    gameOver = true;
    stopTimer();

    panelEl.classList.add("win");
    setTimeout(() => panelEl.classList.remove("win"), 1200);

    const all = loadStats();
    const s = all[select.value];
    s.won++;
    s.totalTime += timer;
    s.best = s.best === null ? timer : Math.min(s.best, timer);
    saveStats(all);

    renderStats();
  }
}

/* ================= CONTROLS ================= */
select.onchange = () => start(select.value);
restart.onclick = () => start(select.value);

/* ================= INIT ================= */
start("intermediate");

const resetStatsBtn = document.getElementById("reset-stats");

if (resetStatsBtn) {
  resetStatsBtn.onclick = () => {
    const sure = confirm(
      "Are you sure?\nThis will permanently delete ALL Minesweeper statistics."
    );
    if (!sure) return;

    localStorage.removeItem("ms_stats");
    renderStats();
    statusEl.textContent = "STATS RESET";
  };
}
