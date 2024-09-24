
// Configuration
const MAZE_SIZE = 21; // Must be an odd number
const CELL_SIZE = 5; // Size of each maze cell
const WALL_HEIGHT = 5;
const PLAYER_SIZE = 2;
const MOVE_SPEED = 0.4;

// Three.js Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, WALL_HEIGHT * 2, 0);
scene.add(directionalLight);

// Maze Generation 

// Initialize maze grid
let maze = [];
for (let y = 0; y < MAZE_SIZE; y++) {
    maze[y] = [];
    for (let x = 0; x < MAZE_SIZE; x++) {
        maze[y][x] = 1; // 1 represents wall, 0 represents path
    }
}

// Recursive Backtracking Algorithm
function generateMaze(x, y) {
    const directions = [
        [0, -2], // Up
        [2, 0],  // Right
        [0, 2],  // Down
        [-2, 0]  // Left
    ];

    // Shuffle directions
    directions.sort(() => Math.random() - 0.5);

    directions.forEach(direction => {
        const nx = x + direction[0];
        const ny = y + direction[1];

        if (nx > 0 && nx < MAZE_SIZE - 1 && ny > 0 && ny < MAZE_SIZE - 1 && maze[ny][nx] === 1) {
            maze[ny][nx] = 0;
            maze[y + direction[1] / 2][x + direction[0] / 2] = 0;
            generateMaze(nx, ny);
        }
    });
}

// Start maze generation from (1,1)
maze[1][1] = 0;
generateMaze(1, 1);

// Render Maze
const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const walls = []; // To store wall meshes for collision detection

for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
        if (maze[y][x] === 1) {
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(
                (x - MAZE_SIZE / 2) * CELL_SIZE,
                WALL_HEIGHT / 2,
                (y - MAZE_SIZE / 2) * CELL_SIZE
            );
            scene.add(wall);
            walls.push(wall);
        }
    }
}

// Player Setup
const playerGeometry = new THREE.SphereGeometry(PLAYER_SIZE / 2, 32, 32);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(
    (1 - MAZE_SIZE / 2) * CELL_SIZE,
    PLAYER_SIZE / 2,
    (1 - MAZE_SIZE / 2) * CELL_SIZE
);
scene.add(player);

// Camera Positioning (Top-Down View)
// Position the camera above the maze and look directly down.
camera.position.set(0, MAZE_SIZE * CELL_SIZE, 0); // Position camera high above the maze
camera.lookAt(0, 0, 0); // Look directly down at the center of the maze

// Controls
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Event listeners for key presses
document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
            keys.w = true;
            break;
        case 'a':
            keys.a = true;
            break;
        case 's':
            keys.s = true;
            break;
        case 'd':
            keys.d = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
            keys.w = false;
            break;
        case 'a':
            keys.a = false;
            break;
        case 's':
            keys.s = false;
            break;
        case 'd':
            keys.d = false;
            break;
    }
});

// Collision Detection
function detectCollision(newPosition) {
    const playerBox = new THREE.Box3().setFromObject(player);
    playerBox.translate(newPosition);

    for (let wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        if (playerBox.intersectsBox(wallBox)) {
            return true;
        }
    }
    return false;
}

// Game Loop
function animate() {
    requestAnimationFrame(animate);

    let moveX = 0;
    let moveZ = 0;

    // Calculate movement direction based on key inputs
    if (keys.w) moveZ -= MOVE_SPEED;
    if (keys.s) moveZ += MOVE_SPEED;
    if (keys.a) moveX -= MOVE_SPEED;
    if (keys.d) moveX += MOVE_SPEED;

    // Calculate proposed new position
    const proposedPosition = new THREE.Vector3(
        player.position.x + moveX,
        player.position.y,
        player.position.z + moveZ
    );

    // Collision Detection for each axis separately
    const deltaX = new THREE.Vector3(moveX, 0, 0); // Check X axis
    const deltaZ = new THREE.Vector3(0, 0, moveZ); // Check Z axis

    // Move along the X axis if there's no collision
    if (!detectCollision(deltaX)) {
        player.position.add(deltaX);
    }

    // Move along the Z axis if there's no collision
    if (!detectCollision(deltaZ)) {
        player.position.add(deltaZ);
    }

    renderer.render(scene, camera);
}

animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
