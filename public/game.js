const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const movement = { up: false, down: false, left: false, right: false };

document.addEventListener('keydown', (event) => {
  switch(event.code) {
    case 'ArrowUp': movement.up = true; break;
    case 'ArrowDown': movement.down = true; break;
    case 'ArrowLeft': movement.left = true; break;
    case 'ArrowRight': movement.right = true; break;
  }
});

document.addEventListener('keyup', (event) => {
  switch(event.code) {
    case 'ArrowUp': movement.up = false; break;
    case 'ArrowDown': movement.down = false; break;
    case 'ArrowLeft': movement.left = false; break;
    case 'ArrowRight': movement.right = false; break;
  }
});

setInterval(() => {
  socket.emit('movement', movement);
}, 1000 / 60);

socket.on('state', (players) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let id in players) {
    const p = players[id];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 20, 20);
  }
});