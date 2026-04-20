const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 96;
const PADDLE_SPEED = 6;
const BALL_SIZE = 10;

let left = { x: 24, y: (H - PADDLE_HEIGHT) / 2 };
let right = { x: W - 24 - PADDLE_WIDTH, y: (H - PADDLE_HEIGHT) / 2 };
let ball = { x: W/2, y: H/2, vx: 5*(Math.random()>0.5?1:-1), vy: (Math.random()*4-2) };
let scoreLeft = 0, scoreRight = 0;
let running = false;
let paused = false;
let best = parseInt(localStorage.getItem('pongBest')||'0',10);
let livesLeft = 3, livesRight = 3;
let mode = 'bot'; // 'bot' or 'human'
let serveTimer = null;
let serveSeconds = 3;
let serveDisplay = null;
let difficulty = 'medium';
let aiMultiplier = 0.85; // default medium
let ballSpeedMultiplier = 1.0;
let serveDurationMs = 1000; // total duration of the countdown sequence (ms)
let panelAnimTimer = null;

const scoreLeftEl = document.getElementById('score-left');
const scoreRightEl = document.getElementById('score-right');
const livesLeftEl = document.getElementById('lives-left');
const livesRightEl = document.getElementById('lives-right');
const messageEl = document.getElementById('message');
const bestEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const modeSelect = document.getElementById('mode-select');
const difficultySelect = document.getElementById('difficulty-select');
const difficultyRow = document.getElementById('difficulty-row');
const difficultyLabel = document.getElementById('difficulty-label');
const panel = document.querySelector('.game-panel');

bestEl.textContent = best;

// stats
const statGamesEl = document.getElementById('stat-games');
const statWonEl = document.getElementById('stat-won');
const statRateEl = document.getElementById('stat-rate');
const statLevelEl = document.getElementById('stat-level');

const stats = JSON.parse(localStorage.getItem('pongStats')) || { games: 0, wins: 0, best: best };

function renderStats(){
  statGamesEl.textContent = stats.games;
  statWonEl.textContent = stats.wins;
  statRateEl.textContent = stats.games ? Math.round((stats.wins / stats.games) * 100) + '%' : '0%';
  bestEl.textContent = Math.max(best, stats.best || 0);
  if(statLevelEl) statLevelEl.textContent = 1;
}

renderStats();

function resetPositions(){
  left.y = (H - PADDLE_HEIGHT) / 2;
  right.y = (H - PADDLE_HEIGHT) / 2;
  ball.x = W/2; ball.y = H/2;
  const sign = Math.random()>0.5?1:-1;
  ball.vx = 5 * sign;
  ball.vy = (Math.random()*4-2);
}

function resetGame(){
  scoreLeft = 0; scoreRight = 0;
  livesLeft = 3; livesRight = 3;
  updateUI();
  resetPositions();
  running = false;
  paused = false;
  messageEl.textContent = 'PRESS START';
  clearServeTimer();
  // remove win/lose classes
  if(panel) panel.classList.remove('win','lose');
  if(panelAnimTimer){ clearTimeout(panelAnimTimer); panelAnimTimer = null; }
  // hide reset button if present
  const resetBtn = document.getElementById('reset-stats');
  if(resetBtn) resetBtn.classList.remove('hidden');
}

function updateUI(){
  scoreLeftEl.textContent = scoreLeft;
  scoreRightEl.textContent = scoreRight;
  bestEl.textContent = best;
  livesLeftEl.textContent = livesLeft;
  livesRightEl.textContent = livesRight;
}

function draw(){
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);

  // center line
  ctx.fillStyle = '#222';
  for(let y=10;y<H;y+=26) ctx.fillRect((W/2)-2,y,4,16);

  // paddles
  ctx.fillStyle = '#fff';
  ctx.fillRect(left.x,left.y,PADDLE_WIDTH,PADDLE_HEIGHT);
  ctx.fillRect(right.x,right.y,PADDLE_WIDTH,PADDLE_HEIGHT);

  // ball
  ctx.fillRect(ball.x - BALL_SIZE/2, ball.y - BALL_SIZE/2, BALL_SIZE, BALL_SIZE);

  // draw serve countdown big in center if active
  if(serveDisplay !== null){
    ctx.save();
    ctx.font = 'bold 120px PixelGame, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(serveDisplay, W/2, H/2);
    ctx.restore();
  }
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function step(){
  if(!running || paused) return;

  // move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // top/bottom
  if(ball.y - BALL_SIZE/2 <= 0 || ball.y + BALL_SIZE/2 >= H){
    ball.vy *= -1;
    ball.y = clamp(ball.y, BALL_SIZE/2, H - BALL_SIZE/2);
  }

  // left paddle collision
  if(ball.x - BALL_SIZE/2 <= left.x + PADDLE_WIDTH){
    if(ball.y >= left.y && ball.y <= left.y + PADDLE_HEIGHT){
      ball.x = left.x + PADDLE_WIDTH + BALL_SIZE/2;
      ball.vx = Math.abs(ball.vx) + 0.4; // speed up
      // add spin based on hit position
      const diff = (ball.y - (left.y + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
      ball.vy += diff * 2;
    }
  }

  // right paddle collision
  if(ball.x + BALL_SIZE/2 >= right.x){
    if(ball.y >= right.y && ball.y <= right.y + PADDLE_HEIGHT){
      ball.x = right.x - BALL_SIZE/2;
      ball.vx = -Math.abs(ball.vx) - 0.4;
      const diff = (ball.y - (right.y + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
      ball.vy += diff * 2;
    }
  }

  // scoring
  if(ball.x < -50){
    // left missed -> left loses a life
    handleLifeLost('left');
    return;
  }
  if(ball.x > W + 50){
    // right missed -> right loses a life
    handleLifeLost('right');
    return;
  }

  draw();
  requestAnimationFrame(step);
}

function gameOver(winner){
  running = false;
  messageEl.textContent = winner + ' WINS';
  restartBtn.classList.remove('hidden');
  // add win animation to panel (match Minesweeper style) only when playing vs bot
  if(mode === 'bot' && panel){
    panel.classList.remove('win','lose');
    // assume PLAYER A is human when vs bot; show green when human wins, red when human loses
    if(winner === 'PLAYER A') panel.classList.add('win');
    else panel.classList.add('lose');
    // remove the class after animation duration so it resets automatically
    if(panelAnimTimer) clearTimeout(panelAnimTimer);
    panelAnimTimer = setTimeout(()=>{
      if(panel) panel.classList.remove('win','lose');
      panelAnimTimer = null;
    }, 1200);
  }
  // update stats only when vs bot
  if(mode === 'bot'){
    stats.games++;
    // assume PLAYER A is human when vs bot; count wins when PLAYER A wins
    if(winner === 'PLAYER A') stats.wins++;
    stats.best = Math.max(stats.best || 0, best);
    localStorage.setItem('pongStats', JSON.stringify(stats));
    renderStats();
  }
}

function clearServeTimer(){
  if(serveTimer) { clearInterval(serveTimer); serveTimer = null; }
  serveDisplay = null;
}

function startServeCountdown(cb){
  clearServeTimer();
  let s = serveSeconds;
  serveDisplay = s;
  messageEl.textContent = 'NEXT SERVE IN ' + s;
  const tick = Math.max(40, Math.round(serveDurationMs / serveSeconds));
  serveTimer = setInterval(()=>{
    s--;
    serveDisplay = s;
    if(s <= 0){
      clearServeTimer();
      messageEl.textContent = '';
      serveDisplay = null;
      if(cb) cb();
      return;
    }
    messageEl.textContent = 'NEXT SERVE IN ' + s;
  }, tick);
}

function handleLifeLost(side){
  // side === 'left' means left missed the ball
  if(side === 'left'){
    livesLeft = Math.max(0, livesLeft - 1);
  } else {
    livesRight = Math.max(0, livesRight - 1);
  }

  updateUI();

  // check game over
  if(livesLeft <= 0){ gameOver('PLAYER B'); return; }
  if(livesRight <= 0){ gameOver('PLAYER A'); return; }

  // show scorer message briefly then start countdown to next serve
  if(side === 'left') messageEl.textContent = 'PLAYER B SCORES';
  else messageEl.textContent = 'PLAYER A SCORES';

  // prepare next serve after countdown
  running = false;
  restartBtn.classList.add('hidden');
  // small delay so player sees message, then countdown
  setTimeout(()=>{
    startServeCountdown(()=>{
      resetPositions();
      // randomize initial direction and set speed based on difficulty
      const sign = Math.random()>0.5?1:-1;
      const base = 5 * ballSpeedMultiplier;
      ball.vx = base * sign;
      ball.vy = (Math.random()*4-2) * ballSpeedMultiplier;
      running = true;
      requestAnimationFrame(step);
    });
  }, 500);
}

// input
const keys = {};
window.addEventListener('keydown', e=>{
  if(e.repeat) return;
  keys[e.code] = true;

  // Start game with Space before the game has started
  if(e.code === 'Space' && !running){
    e.preventDefault();
    if(startBtn) startBtn.click();
    return;
  }

  if(e.code === 'KeyP'){
    paused = !paused;
    messageEl.textContent = paused ? 'PAUSED' : '';
    if(!paused) requestAnimationFrame(step);
  }

});
window.addEventListener('keyup', e=>{ keys[e.code] = false; });

function inputMove(){
  // Controls:
  // - When playing vs bot (default), player uses Arrow Up/Down to control the paddle.
  // - When mode === 'human' (human vs human), left uses W/S and right uses Arrow keys.
  if(mode === 'bot'){
    if(keys['ArrowUp']) left.y -= PADDLE_SPEED;
    if(keys['ArrowDown']) left.y += PADDLE_SPEED;
  } else {
    if(keys['KeyW']) left.y -= PADDLE_SPEED;
    if(keys['KeyS']) left.y += PADDLE_SPEED;
    if(keys['ArrowUp']) right.y -= PADDLE_SPEED;
    if(keys['ArrowDown']) right.y += PADDLE_SPEED;
  }
  left.y = clamp(left.y, 0, H - PADDLE_HEIGHT);
  right.y = clamp(right.y, 0, H - PADDLE_HEIGHT);
}

// game loop for paddles + draw
function frame(){
  inputMove();
  // AI move when in bot mode
  if(mode === 'bot'){
    // simple medium AI: track ball with slight delay and limited speed
    const center = right.y + PADDLE_HEIGHT/2;
    const diff = ball.y - center;
    const thresh = 6;
    const aiSpeed = PADDLE_SPEED * aiMultiplier;
    if(Math.abs(diff) > thresh){
      right.y += diff > 0 ? aiSpeed : -aiSpeed;
    }
    right.y = clamp(right.y, 0, H - PADDLE_HEIGHT);
  }
  draw();
  requestAnimationFrame(frame);
}

startBtn.addEventListener('click', ()=>{
  restartBtn.classList.add('hidden');
  clearServeTimer();
  // always run the 3->2->1 serve countdown (total duration configured by serveDurationMs)
  startServeCountdown(()=>{
    messageEl.textContent = '';
    running = true;
    paused = false;
    // give ball a fresh push with difficulty multiplier
    const sign = Math.random()>0.5?1:-1;
    const base = 5 * ballSpeedMultiplier;
    ball.vx = base * sign;
    ball.vy = (Math.random()*4-2) * ballSpeedMultiplier;
    requestAnimationFrame(step);
  });
});

restartBtn.addEventListener('click', ()=>{
  resetGame();
  restartBtn.classList.add('hidden');
  clearServeTimer();
  messageEl.textContent = 'PRESS START';
});

// mode select handler
if(modeSelect){
  modeSelect.addEventListener('change', e=>{
    mode = e.target.value === 'human' ? 'human' : 'bot';
    // hide difficulty when human vs human
    if(difficultyRow){
      difficultyRow.style.display = mode === 'human' ? 'none' : '';
    }
    if(difficultyLabel){
      difficultyLabel.style.display = mode === 'human' ? 'none' : '';
    }
  });
}

// difficulty handler
function applyDifficulty(d){
  difficulty = d;
  switch(d){
    case 'easy': aiMultiplier = 0.6; ballSpeedMultiplier = 0.9; break;
    case 'hard': aiMultiplier = 1.15; ballSpeedMultiplier = 1.15; break;
    case 'medium':
    default: aiMultiplier = 0.85; ballSpeedMultiplier = 1.0; break;
  }
}

if(difficultySelect){
  difficultySelect.addEventListener('change', e=>{
    applyDifficulty(e.target.value);
  });
  // init from select
  applyDifficulty(difficultySelect.value || 'medium');
  // hide difficulty if current mode is human
  if(difficultyRow){
    difficultyRow.style.display = mode === 'human' ? 'none' : '';
  }
  if(difficultyLabel){
    difficultyLabel.style.display = mode === 'human' ? 'none' : '';
  }
}

// Reset stats button
const resetStatsBtn = document.getElementById('reset-stats');
if(resetStatsBtn){
  resetStatsBtn.addEventListener('click', ()=>{
    const ok = confirm('Bist du sicher?\n\nDas löscht dauerhaft ALLE Pong-Statistiken.');
    if(!ok) return;
    localStorage.removeItem('pongStats');
    stats.games = 0; stats.wins = 0; stats.best = 0;
    best = 0;
    localStorage.removeItem('pongBest');
    renderStats();
  });
}

// init
resetGame();
frame();

// keep UI updated regularly
setInterval(()=>{
  updateUI();
},250);
