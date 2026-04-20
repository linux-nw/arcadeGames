// Simple grid-based snake game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const speedEl = document.getElementById('speed');

const statGames = document.getElementById('stat-games');
const statWon = document.getElementById('stat-won');
const statRate = document.getElementById('stat-rate');
const statHigh = document.getElementById('stat-high');
const resetStatsBtn = document.getElementById('reset-stats');

const gridSize = 20;
const cols = canvas.width / gridSize;
const rows = canvas.height / gridSize;

let snake = [{x:5,y:5}];
let dir = {x:1,y:0};
let food = null;
let running = false;
let speed = 6; // frames per second base
let score = 0;
let level = 1;
let lastFrameTime = 0;

function randPos(){
  return { x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows) };
}

function placeFood(){
  let p = randPos();
  while(snake.some(s=>s.x===p.x && s.y===p.y)) p = randPos();
  food = p;
}

function draw(){
  // background
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // subtle grid
  ctx.strokeStyle = 'rgba(200,200,200,0.08)';
  ctx.lineWidth = 1;
  for(let x=0;x<=cols;x++){
    ctx.beginPath();
    ctx.moveTo(x*gridSize+0.5, 0);
    ctx.lineTo(x*gridSize+0.5, canvas.height);
    ctx.stroke();
  }
  for(let y=0;y<=rows;y++){
    ctx.beginPath();
    ctx.moveTo(0, y*gridSize+0.5);
    ctx.lineTo(canvas.width, y*gridSize+0.5);
    ctx.stroke();
  }

  // food as small diamond
  if(food){
    const cx = food.x*gridSize + gridSize/2;
    const cy = food.y*gridSize + gridSize/2;
    const size = gridSize * 0.45;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI/4);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.restore();
  }

  // snake (head different color)
  for(let i=0;i<snake.length;i++){
    const s = snake[i];
    if(i===0){ ctx.fillStyle = '#32cd32'; } else { ctx.fillStyle = '#7CFC00'; }
    ctx.fillRect(s.x*gridSize+1, s.y*gridSize+1, gridSize-2, gridSize-2);
  }
}

function update(){
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  // wall collision - fatal
  if(head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows){
    gameOver();
    return;
  }

  // self collision
  if(snake.some(s=>s.x===head.x && s.y===head.y)){
    gameOver();
    return;
  }

  snake.unshift(head);
  if(food && head.x===food.x && head.y===food.y){
    score += 10;
    if(score % 50 === 0){ level++; speed++; }
    placeFood();
    updateStatsDisplay();
  } else {
    snake.pop();
  }

  // win: filled entire board
  if(snake.length >= cols * rows){
    win();
  }
}

function loop(ts){
  if(!running) return;
  const secs = (ts - lastFrameTime) / 1000;
  if(secs > 1 / speed){
    lastFrameTime = ts;
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

function startGame(){
  if(!food) placeFood();
  running = true;
  messageEl.textContent = '';
  startBtn.classList.add('hidden');
  restartBtn.classList.remove('hidden');
  requestAnimationFrame(loop);
}

function pauseGame(){
  running = false;
  messageEl.textContent = 'PAUSED';
  startBtn.classList.remove('hidden');
}

function resetGame(){
  snake = [{x:Math.floor(cols/2), y:Math.floor(rows/2)}];
  dir = {x:1,y:0};
  score = 0; level = 1; speed = 6;
  food = null; placeFood();
  updateStatsDisplay();
  draw();
  const panel = document.querySelector('.game-panel');
  if(panel){ panel.classList.remove('win'); panel.classList.remove('lose'); }
}

function gameOver(){
  running = false;
  messageEl.textContent = 'GAME OVER';
  startBtn.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  const panel = document.querySelector('.game-panel');
  if(panel){ panel.classList.remove('win'); panel.classList.add('lose'); }
  // stats
  incrementGames(false);
}

function win(){
  running = false;
  messageEl.textContent = 'YOU WIN!';
  startBtn.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  const panel = document.querySelector('.game-panel');
  if(panel){ panel.classList.remove('lose'); panel.classList.add('win'); }
  incrementGames(true);
}

// input
window.addEventListener('keydown', e=>{
  if(e.key === 'ArrowUp' && dir.y!==1) dir = {x:0,y:-1};
  if(e.key === 'ArrowDown' && dir.y!==-1) dir = {x:0,y:1};
  if(e.key === 'ArrowLeft' && dir.x!==1) dir = {x:-1,y:0};
  if(e.key === 'ArrowRight' && dir.x!==-1) dir = {x:1,y:0};
  if(e.code === 'Space'){
    if(!running) startGame();
  }
  if(e.key.toLowerCase() === 'r') resetGame();
});

startBtn.addEventListener('click', ()=>{
  if(running) pauseGame(); else startGame();
});
restartBtn.addEventListener('click', ()=>{ resetGame(); });

// stats handling
function loadStats(){
  const games = parseInt(localStorage.getItem('snake_games')||'0',10);
  const won = parseInt(localStorage.getItem('snake_won')||'0',10);
  const high = parseInt(localStorage.getItem('snake_high')||'0',10);
  document.getElementById('stat-games').textContent = games;
  document.getElementById('stat-won').textContent = won;
  document.getElementById('stat-high').textContent = high;
  const rate = games? Math.round((won/games)*100) : 0;
  document.getElementById('stat-rate').textContent = rate + '%';
}

function incrementGames(won){
  const games = parseInt(localStorage.getItem('snake_games')||'0',10) + 1;
  const wonCount = parseInt(localStorage.getItem('snake_won')||'0',10) + (won?1:0);
  localStorage.setItem('snake_games', games);
  localStorage.setItem('snake_won', wonCount);
  const high = Math.max(parseInt(localStorage.getItem('snake_high')||'0',10), score);
  localStorage.setItem('snake_high', high);
  loadStats();
}

function updateStatsDisplay(){
  scoreEl.textContent = score;
  levelEl.textContent = level;
  speedEl.textContent = speed;
  const high = parseInt(localStorage.getItem('snake_high')||'0',10);
  if(score > high){ localStorage.setItem('snake_high', score); document.getElementById('stat-high').textContent = score; }
}

resetStatsBtn.addEventListener('click', ()=>{
  localStorage.removeItem('snake_games');
  localStorage.removeItem('snake_won');
  localStorage.removeItem('snake_high');
  loadStats();
});

// init
resetGame();
loadStats();
draw();

// remove win/lose classes automatically when animation ends (so red/green clears)
{
  const panel = document.querySelector('.game-panel');
  if(panel){
    panel.addEventListener('animationend', (e) => {
      if(e.animationName === 'loseShake' || e.animationName === 'winPulse'){
        panel.classList.remove('lose');
        panel.classList.remove('win');
      }
    });
  }
}
