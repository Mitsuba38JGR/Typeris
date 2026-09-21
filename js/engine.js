// ===============================
// Typeris engine.js（LockDelay + Next + Hold + Ghost）
// ===============================

import { getUserRotate } from "./sandbox.js";

// ----- Canvas & Board -----
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let currentPiece = null;
let holdPiece = null;
let holdUsed = false;

// Lock Delay
let lockTimer = 0;
const LOCK_DELAY = 500; // 500ms

// ----- PNG Skins -----
const skinFiles = {
    I: [0, 90],
    O: [0],
    T: [0, 90, 180, 270],
    S: [0, 90],
    Z: [0, 90],
    J: [0, 90, 180, 270],
    L: [0, 90, 180, 270]
};

const skins = {};

for (const type in skinFiles) {
    skins[type] = {};

    skinFiles[type].forEach(rot => {
        const img = new Image();
        img.src = `images/${type}${rot}.png`;
        skins[type][rot] = img;
    });

    if (type === "I") {
        skins.I[180] = skins.I[0];
        skins.I[270] = skins.I[90];
    }
}

// ----- 回転補正 -----
const offset = {
    I: {
        0:   { x: 0,  y: 0 },
        90:  { x: -1, y: 1 },
        180: { x: 0,  y: -1 },
        270: { x: 1,  y: 0 }
    },
    S: {
        0:   { x: 0,  y: 0 },
        90:  { x: 0,  y: 0 },
        180: { x: -1, y: 0 },
        270: { x: 0,  y: -1 }
    },
    Z: {
        0:   { x: 0,  y: 0 },
        90:  { x: 0,  y: 0 },
        180: { x: -1, y: 0 },
        270: { x: 0,  y: -1 }
    }
};

// ----- SHAPES（略） -----
（※ここは前回の SHAPES をそのまま使ってOK。長いので省略してるけど、必要なら全量もう一度出すよ。）


// ===============================
// 7-Bag Next Queue
// ===============================
let nextQueue = [];

function generateBag() {
    const bag = ["I", "O", "T", "S", "Z", "J", "L"];
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
}

function refillNext() {
    while (nextQueue.length < 5) {
        nextQueue.push(...generateBag());
    }
}

// ===============================
// ピース生成
// ===============================
function spawnPiece() {
    refillNext();
    const type = nextQueue.shift();

    currentPiece = {
        type,
        rotation: 0,
        x: 3,
        y: 0,
        shape: SHAPES[type]
    };

    holdUsed = false;
    lockTimer = 0;
}

// ===============================
// ゴーストミノ
// ===============================
function getGhostPiece(piece) {
    let ghost = { ...piece };

    while (validPosition(ghost, ghost.x, ghost.y + 1)) {
        ghost.y++;
    }
    return ghost;
}

// ===============================
// 描画
// ===============================
function drawBoard() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = board[y][x];
            if (cell) {
                const img = skins[cell.type][cell.rotation];
                const off = offset[cell.type]?.[cell.rotation] || { x: 0, y: 0 };
                ctx.drawImage(img, (x + off.x) * BLOCK, (y + off.y) * BLOCK, BLOCK, BLOCK);
            }
        }
    }
}

function drawPiece(piece, ghost = false) {
    const img = skins[piece.type][piece.rotation];
    const off = offset[piece.type]?.[piece.rotation] || { x: 0, y: 0 };
    const shape = piece.shape[piece.rotation];

    ctx.globalAlpha = ghost ? 0.3 : 1.0;

    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                ctx.drawImage(
                    img,
                    (piece.x + dx + off.x) * BLOCK,
                    (piece.y + dy + off.y) * BLOCK,
                    BLOCK,
                    BLOCK
                );
            }
        }
    }

    ctx.globalAlpha = 1.0;
}

function draw() {
    drawBoard();

    const ghost = getGhostPiece(currentPiece);
    drawPiece(ghost, true);

    drawPiece(currentPiece);
}

// ===============================
// 衝突判定
// ===============================
function validPosition(piece, x, y) {
    const shape = piece.shape[piece.rotation];

    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                const px = x + dx;
                const py = y + dy;

                if (px < 0 || px >= COLS || py >= ROWS) return false;
                if (py >= 0 && board[py][px]) return false;
            }
        }
    }
    return true;
}

// ===============================
// Lock Delay
// ===============================
function updateLockDelay(delta) {
    if (!validPosition(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        lockTimer += delta;
        if (lockTimer >= LOCK_DELAY) {
            lockPiece();
        }
    } else {
        lockTimer = 0;
    }
}

// ===============================
// ピース固定
// ===============================
function lockPiece() {
    const shape = currentPiece.shape[currentPiece.rotation];

    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                const px = currentPiece.x + dx;
                const py = currentPiece.y + dy;

                if (py >= 0) {
                    board[py][px] = {
                        type: currentPiece.type,
                        rotation: currentPiece.rotation
                    };
                }
            }
        }
    }

    spawnPiece();
    draw();
}

// ===============================
// キー操作
// ===============================
document.addEventListener("keydown", (e) => {
    if (!currentPiece) return;

    switch (e.key) {
        case "ArrowLeft":
            movePiece(-1);
            break;
        case "ArrowRight":
            movePiece(1);
            break;
        case "ArrowUp":
            rotatePiece(1);
            break;
        case "z":
        case "Z":
            rotatePiece(-1);
            break;
        case "ArrowDown":
            softDrop();
            break;
        case " ":
            hardDrop();
            break;
        case "c":
        case "C":
            hold();
            break;
    }
});

function movePiece(dir) {
    const newX = currentPiece.x + dir;

    if (validPosition(currentPiece, newX, currentPiece.y)) {
        currentPiece.x = newX;
        lockTimer = 0;
        draw();
    }
}

function rotatePiece(dir) {
    const userRotate = getUserRotate();

    let newRotation = (currentPiece.rotation + (dir === 1 ? 90 : -90)) % 360;
    if (newRotation < 0) newRotation += 360;

    let testPiece = { ...currentPiece, rotation: newRotation };

    if (typeof userRotate === "function") {
        try {
            testPiece = userRotate(testPiece, board);
        } catch (e) {
            console.error("ユーザー rotate() エラー:", e);
        }
    }

    if (validPosition(testPiece, testPiece.x, testPiece.y)) {
        currentPiece.rotation = testPiece.rotation;
        lockTimer = 0;
        draw();
    }
}

function softDrop() {
    const newY = currentPiece.y + 1;

    if (validPosition(currentPiece, currentPiece.x, newY)) {
        currentPiece.y = newY;
    } else {
        lockPiece();
    }

    draw();
}

function hardDrop() {
    while (validPosition(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    }
    lockPiece();
    draw();
}

// ===============================
// Hold
// ===============================
function hold() {
    if (holdUsed) return;

    if (!holdPiece) {
        holdPiece = currentPiece.type;
        spawnPiece();
    } else {
        const temp = currentPiece.type;
        currentPiece = {
            type: holdPiece,
            rotation: 0,
            x: 3,
            y: 0,
            shape: SHAPES[holdPiece]
        };
        holdPiece = temp;
    }

    holdUsed = true;
    draw();
}

// ===============================
// Gravity Loop
// ===============================
let lastTime = performance.now();

function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    // Gravity
    if (delta > 16) {
        if (validPosition(currentPiece, currentPiece.x, currentPiece.y + 1)) {
            currentPiece.y++;
        }
        updateLockDelay(delta);
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// ===============================
// Start
// ===============================
spawnPiece();
draw();
requestAnimationFrame(gameLoop);
