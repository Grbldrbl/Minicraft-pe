const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Chunk/World Logic ---
const CHUNK_SIZE = 16;
const BLOCK_SIZE = 32;
const WORLD_HEIGHT = 8;

// Simple world storage: {chunkX: {chunkY: chunkData}}
const world = {};

// Generate a chunk at (chunkX, chunkY)
function generateChunk(chunkX, chunkY) {
  const chunk = [];
  for (let x = 0; x < CHUNK_SIZE; x++) {
    chunk[x] = [];
    for (let y = 0; y < CHUNK_SIZE; y++) {
      // Simple terrain: bottom 2 rows = dirt, above = air
      chunk[x][y] = (y > CHUNK_SIZE - 3) ? 1 : 0;
    }
  }
  return chunk;
}

// Load chunks around player
function loadChunks(px, py, radius = 1) {
  for (let cx = px - radius; cx <= px + radius; cx++) {
    for (let cy = py - radius; cy <= py + radius; cy++) {
      if (!world[cx]) world[cx] = {};
      if (!world[cx][cy]) world[cx][cy] = generateChunk(cx, cy);
    }
  }
}

// --- Player Logic ---
let player = {
  x: CHUNK_SIZE * BLOCK_SIZE / 2,
  y: (CHUNK_SIZE - 3) * BLOCK_SIZE,
  vx: 0,
  vy: 0,
  speed: 3,
  jump: false
};

// --- Touch Controls (Joystick) ---
let joystick = {active: false, startX: 0, startY: 0, dx: 0, dy: 0};
const joystickElem = document.getElementById('joystick');

joystickElem.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  joystick.active = true;
  joystick.startX = touch.clientX;
  joystick.startY = touch.clientY;
  joystick.dx = 0;
  joystick.dy = 0;
});
joystickElem.addEventListener('touchmove', (e) => {
  if (!joystick.active) return;
  const touch = e.touches[0];
  joystick.dx = touch.clientX - joystick.startX;
  joystick.dy = touch.clientY - joystick.startY;
});
joystickElem.addEventListener('touchend', () => {
  joystick.active = false;
  joystick.dx = 0;
  joystick.dy = 0;
});

// --- Jump Button ---
document.getElementById('jumpBtn').addEventListener('touchstart', () => {
  if (!player.jump) {
    player.vy = -12;
    player.jump = true;
  }
});

// --- Game Loop ---
function update() {
  // Joystick movement
  if (joystick.active) {
    let mx = Math.max(-50, Math.min(50, joystick.dx));
    player.vx = mx / 50 * player.speed;
  } else {
    player.vx = 0;
  }

  // Gravity
  player.vy += 0.7;
  player.x += player.vx;
  player.y += player.vy;

  // Simple collision with ground (chunk/block detection)
  let chunkX = Math.floor(player.x / (CHUNK_SIZE * BLOCK_SIZE));
  let chunkY = Math.floor(player.y / (CHUNK_SIZE * BLOCK_SIZE));
  loadChunks(chunkX, chunkY, 1); // Load chunks around player

  // Block collision (only bottom collision for simplicity)
  let bx = Math.floor((player.x % (CHUNK_SIZE * BLOCK_SIZE)) / BLOCK_SIZE);
  let by = Math.floor((player.y % (CHUNK_SIZE * BLOCK_SIZE)) / BLOCK_SIZE);

  let currentChunk = world[chunkX] && world[chunkX][chunkY];
  if (currentChunk && by < CHUNK_SIZE && bx < CHUNK_SIZE) {
    if (currentChunk[bx][by] === 1) {
      // Collided with dirt block
      player.y = by * BLOCK_SIZE + chunkY * CHUNK_SIZE * BLOCK_SIZE - 1;
      player.vy = 0;
      player.jump = false;
    }
  }

  // Prevent falling off the world
  if (player.y > canvas.height - BLOCK_SIZE) {
    player.y = canvas.height - BLOCK_SIZE;
    player.vy = 0;
    player.jump = false;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw chunks
  for (let cx in world) {
    for (let cy in world[cx]) {
      let chunk = world[cx][cy];
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          if (chunk[x][y] === 1) {
            ctx.fillStyle = "#8b5a2b";
            let drawX = x * BLOCK_SIZE + cx * CHUNK_SIZE * BLOCK_SIZE;
            let drawY = y * BLOCK_SIZE + cy * CHUNK_SIZE * BLOCK_SIZE;
            ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = "#222";
            ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
          }
        }
      }
    }
  }

  // Draw player
  ctx.fillStyle = "#2ecc40";
  ctx.fillRect(player.x - 16, player.y - 32, 32, 32);
}

// --- Main Loop ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
