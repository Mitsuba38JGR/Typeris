// ===============================
// Typeris engine.js（Full PNG Piece Rendering + Correct Placement）
// ===============================

import { getUserRotate } from "./sandbox.js";

// ----- Canvas & Board -----
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

// ★ boardPieces：設置済みミノを「ミノ単位」で保存する
let board =
Array.from(
{ length: ROWS },
() => Array(COLS).fill(0)
);

let currentPiece = null;
let holdPiece = null;
let holdUsed = false;

// Lock Delay
let lockTimer = 0;
const LOCK_DELAY = 500;

// ----- PNG Skins -----
const TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

const skins = {};

for (const type of TYPES) {
    const img = new Image();
    img.src = `images/${type}.png`;
    skins[type] = img;
}
// ----- SHAPES（当たり判定用） -----
const SHAPES = {
    I: {
        0: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        90:[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        180:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        270:[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
    },
    O: {
        0:[[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]
    },
    T: {
        0:[[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
        90:[[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
        180:[[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
        270:[[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]]
    },
    S: {
        0:[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
        90:[[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
        180:[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
        270:[[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]
    },
    Z: {
        0:[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
        90:[[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
        180:[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
        270:[[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]]
    },
    J: {
        0:[[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
        90:[[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
        180:[[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
        270:[[1,1,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0]]
    },
    L: {
        0:[[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
        90:[[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
        180:[[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
        270:[[1,0,0,0],[1,0,0,0],[1,1,0,0],[0,0,0,0]]
    }
};

// ===============================
// Next Queue (7-Bag)
// ===============================
let nextQueue = [];

function generateBag() {
    const bag = ["I","O","T","S","Z","J","L"];
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
// Spawn
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

    drawNext();
    drawHold();
    updateGuide();
}

// ===============================
// Ghost
// ===============================
function getGhostPiece(piece) {
    let ghost = { ...piece };

    while (validPosition(ghost, ghost.x, ghost.y + 1)) {
        ghost.y++;
    }
    return ghost;
}
function drawBlock(x, y, type, alpha = 1) {

    const img = skins[type];

    ctx.globalAlpha = alpha;

    ctx.drawImage(
        img,
        x * BLOCK,
        y * BLOCK,
        BLOCK,
        BLOCK
    );

    ctx.globalAlpha = 1;
}
// ===============================
// Draw Board (PNG 全体方式)
// ===============================
function drawBoard() {

    ctx.fillStyle = "#111";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (let y = 0; y < ROWS; y++) {

        for (let x = 0; x < COLS; x++) {

            if (board[y][x]) {

                drawBlock(
                    x,
                    y,
                    board[y][x]
                );
            }
        }
    }
}

// ===============================
// Draw Piece (PNG 全体方式)
// ===============================
function drawPiece(piece, ghost = false) {

    const shape =
        piece.shape[
            piece.rotation
        ];

    for (let y = 0; y < shape.length; y++) {

        for (let x = 0; x < shape[y].length; x++) {

            if (!shape[y][x]) continue;

            drawBlock(
                piece.x + x,
                piece.y + y,
                piece.type,
                ghost ? 0.3 : 1
            );
        }
    }
}

function draw() {
    drawBoard();
    const ghost = getGhostPiece(currentPiece);
    drawPiece(ghost, true);
    drawPiece(currentPiece);
}

// ===============================
// Next / Hold UI
// ===============================
function drawNext() {
    const nextDiv = document.getElementById("next");
    nextDiv.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        const type = nextQueue[i];
        const img = skins[type][0];
        const el = document.createElement("img");
        el.src = img.src;
        el.style.width = "40px";
        nextDiv.appendChild(el);
    }
}

function drawHold() {
    const holdDiv = document.getElementById("hold");
    holdDiv.innerHTML = "";

    if (holdPiece) {
        const img = skins[holdPiece][0];
        const el = document.createElement("img");
        el.src = img.src;
        el.style.width = "40px";
        holdDiv.appendChild(el);
    }
}

// ===============================
// Practice Guide
// ===============================
function updateGuide() {
    const guide = document.getElementById("guide");
    guide.innerHTML = `
📘 <b>rotate() ガイド</b><br>
・piece.rotation は 0,90,180,270<br>
・戻り値は piece オブジェクト<br>
・piece.x, piece.y を変更すると位置が動く<br>
・board[y][x] で盤面が見れる<br>
・validPosition(piece, x, y) で衝突判定<br>
`;
}

// ===============================
// Collision（shape を使う）
// ===============================
function validPosition(piece, x, y) {

    const shape =
        piece.shape[
            piece.rotation
        ];

    for (let dy = 0; dy < shape.length; dy++) {

        for (let dx = 0; dx < shape[dy].length; dx++) {

            if (!shape[dy][dx]) continue;

            const px = x + dx;
            const py = y + dy;

            // 左右の壁
            if (px < 0 || px >= COLS) {
                return false;
            }

            // 床
            if (py >= ROWS) {
                return false;
            }

            // 固定済みミノとの衝突
            if (
                py >= 0 &&
                board[py][px]
            ) {
                return false;
            }
        }
    }

    return true;
}
// ===============================
// Line Clear（ミノ単位で処理）
// ===============================
function clearLines() {
    let cleared = 0;

    for (let y = ROWS - 1; y >= 0; y--) {
        // その行が埋まっているかチェック
        let full = true;
        for (let x = 0; x < COLS; x++) {
            let found = false;
            for (const p of boardPieces) {
                const s = SHAPES[p.type][p.rotation];
                for (let sy = 0; sy < 4; sy++) {
                    for (let sx = 0; sx < 4; sx++) {
                        if (s[sy][sx]) {
                            if (p.y + sy === y && p.x + sx === x) {
                                found = true;
                            }
                        }
                    }
                }
            }
            if (!found) {
                full = false;
                break;
            }
        }

        if (full) {
            cleared++;

            // ミノを下にずらす
            boardPieces = boardPieces.map(p => {
                const s = SHAPES[p.type][p.rotation];
                let touchesLine = false;

                for (let sy = 0; sy < 4; sy++) {
                    for (let sx = 0; sx < 4; sx++) {
                        if (s[sy][sx]) {
                            if (p.y + sy === y) touchesLine = true;
                        }
                    }
                }

                if (touchesLine) {
                    // ミノのブロックが消える → ミノ全体を削除
                    return null;
                }

                // 上のミノは1段下げる
                if (p.y < y) {
                    return { ...p, y: p.y + 1 };
                }

                return p;
            }).filter(p => p !== null);

            y++;
        }
    }

    return cleared;
}

function isPerfectClear() {
    return boardPieces.length === 0;
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
// Lock Piece（ミノ単位で保存）
// ===============================
function lockPiece() {

    const shape =
        currentPiece.shape[
            currentPiece.rotation
        ];

    for (let dy = 0; dy < shape.length; dy++) {

        for (let dx = 0; dx < shape[dy].length; dx++) {

            if (!shape[dy][dx]) continue;

            const px = currentPiece.x + dx;
            const py = currentPiece.y + dy;

            if (
                py >= 0 &&
                py < ROWS &&
                px >= 0 &&
                px < COLS
            ) {
                board[py][px] =
                    currentPiece.type;
            }
        }
    }

    const cleared =
        clearLines();

    if (
        cleared > 0 &&
        isPerfectClear()
    ) {
        console.log(
            "Perfect Clear!"
        );
    }

    spawnPiece();

    draw();
}
// ===============================
// Key Handling
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
            testPiece = userRotate(testPiece, boardPieces);
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
    drawHold();
    draw();
}

// ===============================
// Gravity Loop
// ===============================
let lastTime = performance.now();

function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    if (valid
