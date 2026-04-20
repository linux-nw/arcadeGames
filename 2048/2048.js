// 2048 implementation with configurable size, merge animation and best-tile tracking
const SIZE = 7;
const BOARD = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const msg = document.getElementById('message');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const panel = document.querySelector('.game-panel');

let grid = [];
let running = false;
let score = 0;
// track merged tile positions to animate
let mergedPositions = new Set();

function storageKeys(){
  return { games: '2048_games', won: '2048_won', bestTile: '2048_bestTile' };
}

function loadStats(){
  const keys = storageKeys();
  return {
    games: parseInt(localStorage.getItem(keys.games)||'0',10),
    won: parseInt(localStorage.getItem(keys.won)||'0',10),
    best: parseInt(localStorage.getItem(keys.bestTile)||'0',10)
  };
}

function saveBestTile(v){ localStorage.setItem(storageKeys().bestTile, String(v)); }

function resetBoard(){
  grid = Array.from({length:SIZE}, ()=>Array.from({length:SIZE}, ()=>0));
  score = 0; mergedPositions.clear(); updateUI(); render();
  spawn(); spawn();
}

function render(){
  BOARD.innerHTML = '';
  for(let y=0;y<SIZE;y++){
    for(let x=0;x<SIZE;x++){
      const v = grid[y][x];
      const el = document.createElement('div');
      el.className = 'tile' + (v? (' v'+v):'');
      if(v) el.textContent = v;
      // apply merge animation if this pos was merged this turn
      const key = `${y},${x}`;
      if(mergedPositions.has(key)) el.classList.add('merge');
      BOARD.appendChild(el);
    }
  }
  // clear merged markers after a short delay so animation can play
  setTimeout(()=> mergedPositions.clear(), 260);
}

function updateUI(){
  scoreEl.textContent = score;
  const best = parseInt(localStorage.getItem(storageKeys().bestTile)||'0',10);
  bestEl.textContent = best;
}

function spawn(){
  const empties = [];
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) if(!grid[y][x]) empties.push([y,x]);
  if(!empties.length) return;
  const [y,x] = empties[Math.floor(Math.random()*empties.length)];
  grid[y][x] = Math.random() < 0.9 ? 2 : 4;
}

function move(dir){
  // dir: 'left','right','up','down'
  let moved = false;
  mergedPositions.clear();

  function compress(row, absoluteCoords){
    const arr = row.filter(v=>v);
    const mergedIdxs = [];
    for(let i=0;i<arr.length-1;i++){
      if(arr[i]===arr[i+1]){ arr[i]*=2; score+=arr[i]; arr.splice(i+1,1); mergedIdxs.push(i); }
    }
    while(arr.length<SIZE) arr.push(0);
    // translate mergedIdxs into absolute coordinates and record them
    for(const mi of mergedIdxs){
      const coord = absoluteCoords(mi);
      mergedPositions.add(`${coord[0]},${coord[1]}`);
    }
    return arr;
  }

  if(dir==='left' || dir==='right'){
    for(let y=0;y<SIZE;y++){
      let row = [...grid[y]];
      if(dir==='right') row.reverse();
      const compressed = compress(row, idx => dir==='right' ? [y, SIZE - 1 - idx] : [y, idx]);
      if(dir==='right') compressed.reverse();
      for(let x=0;x<SIZE;x++) if(grid[y][x]!==compressed[x]) moved=true;
      grid[y]=compressed;
    }
  } else {
    for(let x=0;x<SIZE;x++){
      let col=[]; for(let y=0;y<SIZE;y++) col.push(grid[y][x]);
      if(dir==='down') col.reverse();
      const compressed = compress(col, idx => dir==='down' ? [SIZE - 1 - idx, x] : [idx, x]);
      if(dir==='down') compressed.reverse();
      for(let y=0;y<SIZE;y++) if(grid[y][x]!==compressed[y]) moved=true;
      for(let y=0;y<SIZE;y++) grid[y][x]=compressed[y];
    }
  }
  if(moved) spawn();
  // update best tile on each move
  const curMax = Math.max(...grid.flat());
  const storedBest = parseInt(localStorage.getItem(storageKeys().bestTile)||'0',10);
  if(curMax > storedBest) saveBestTile(curMax);
  updateUI(); render();
  checkEnd();
}

function hasMoves(){
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){
    if(!grid[y][x]) return true;
    if(x<SIZE-1 && grid[y][x]===grid[y][x+1]) return true;
    if(y<SIZE-1 && grid[y][x]===grid[y+1][x]) return true;
  }
  return false;
}

function checkEnd(){
  // win (reach 2048)
  for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++) if(grid[y][x]===2048){
    finish(true); return;
  }
  if(!hasMoves()){ finish(false); }
}

function finish(won){
  running=false;
  msg.textContent = won? 'YOU WIN!' : 'GAME OVER';
  restartBtn.classList.remove('hidden');
  const panelEl = document.querySelector('.game-panel');
  if(panelEl){ panelEl.classList.remove('win','lose'); panelEl.classList.add(won? 'win':'lose'); }
  // stats
  const keys = storageKeys();
  const games = parseInt(localStorage.getItem(keys.games)||'0',10)+1;
  const wonCount = parseInt(localStorage.getItem(keys.won)||'0',10) + (won?1:0);
  localStorage.setItem(keys.games, String(games));
  localStorage.setItem(keys.won, String(wonCount));
  // ensure best tile stored
  const curMax = Math.max(...grid.flat());
  const storedBest = parseInt(localStorage.getItem(keys.bestTile)||'0',10);
  if(curMax > storedBest) saveBestTile(curMax);
}

function startGame(){ resetBoard(); running=true; msg.textContent=''; restartBtn.classList.remove('hidden'); updateUI(); }

document.addEventListener('keydown', e=>{
  if(!running){ if(e.code==='Space'){ e.preventDefault(); startGame(); } return; }
  if(e.key==='ArrowLeft') move('left');
  if(e.key==='ArrowRight') move('right');
  if(e.key==='ArrowUp') move('up');
  if(e.key==='ArrowDown') move('down');
  if(e.key.toLowerCase()==='r') resetBoard();
});

startBtn.addEventListener('click', ()=>{ startGame(); });
restartBtn.addEventListener('click', ()=>{ resetBoard(); running=true; msg.textContent=''; restartBtn.classList.remove('hidden'); });

document.getElementById('reset-stats').addEventListener('click', ()=>{
  const keys = storageKeys();
  localStorage.removeItem(keys.games); localStorage.removeItem(keys.won); localStorage.removeItem(keys.bestTile);
  document.getElementById('stat-games').textContent='0'; document.getElementById('stat-won').textContent='0'; document.getElementById('stat-rate').textContent='0%'; document.getElementById('stat-high').textContent='0';
});

// init
resetBoard(); const s = loadStats(); document.getElementById('stat-games').textContent = s.games; document.getElementById('stat-won').textContent = s.won; document.getElementById('stat-high').textContent = s.best; updateUI();

// auto-clear animation classes
if(panel){ panel.addEventListener('animationend', (e)=>{ if(e.animationName==='loseShake' || e.animationName==='winPulse'){ panel.classList.remove('lose'); panel.classList.remove('win'); } }); }
