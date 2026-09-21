// ===============================
// Typeris engine.js（現時点フルコード）
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

// ----- PNG Skins -----
const skinFiles = {
    I: [0, 90], // 180,270 は位置補正で流用
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

    // I ミノは 0/90 を 180/270 に流用
    if (type === "I") {
        skins.I[180] = skins.I[0];
        skins.I[270] = skins.I[90];
    }
}

// ----- 回転補正テーブル -----
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

// ----- テトリミノ形状（簡易版：回転ごとに4x4） -----
const SHAPES = {
    I: {
        0: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        90: [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        180: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        270: [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    },
    O: {
        0: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ]
    },
    T: {
        0: [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        90: [
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        180: [
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        270: [
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    S: {
        0: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        90: [
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        180: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        270: [
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    Z: {
        0: [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        90: [
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        180: [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        270: [
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    J: {
        0: [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0]
        ],
        90: [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        180: [
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        270: [
            [1, 1, 0, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    },
    L: {
        0: [
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        90: [
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        180: [
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        270: [
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ]
    }
};

// ----- ピース生成（とりあえずランダム） -----
const TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

function spawnPiece() {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    currentPiece = {
        type,
        rotation: 0,
        x: 3,
        y: 0,
        shape: SHAPES[type]
    };
}

// ----- 描画 -----
function drawBoard() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = board[y][x];
            if (cell) {
                const img = skins[cell.type][cell.rotation];
                const off = offset[cell.type]?.[cell.rotation] || { x: 0, y: 0 };
                ctx.drawImage(
                    img,
                    (x + off.x) * BLOCK,
                    (y + off.y) * BLOCK,
                    BLOCK,
                    BLOCK
                );
            }
        }
    }
}

function drawPiece(piece) {
    const img = skins[piece.type][piece.rotation];
    const off = offset[piece.type]?.[piece.rotation] || { x: 0, y: 0 };
    const shape = piece.shape[piece.rotation];

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
}

function draw() {
    drawBoard();
    if (currentPiece) drawPiece(currentPiece);
}

// ----- 衝突判定 -----
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

// ----- ピース固定 -----
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

// ----- キー操作 -----
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
            rotatePiece(1); // 右回転
            break;
        case "z":
        case "Z":
            rotatePiece(-1); // 左回転
            break;
        case "ArrowDown":
            softDrop();
            break;
        case " ":
            hardDrop();
            break;
        // C は後でホールド実装
    }
});

function movePiece(dir) {
    const newX = currentPiece.x + dir;

    if (validPosition(currentPiece, newX, currentPiece.y)) {
        currentPiece.x = newX;
        draw();
    }
}

function rotatePiece(dir) {
    const userRotate = getUserRotate();

    let newRotation = (currentPiece.rotation + (dir === 1 ? 90 : -90)) % 360;
    if (newRotation < 0) newRotation += 360;

    let testPiece = {
        ...currentPiece,
        rotation: newRotation
    };

    if (typeof userRotate === "function") {
        try {
            testPiece = userRotate(testPiece, board);
        } catch (e) {
            console.error("ユーザー rotate() エラー:", e);
        }
    }

    if (validPosition(testPiece, testPiece.x, testPiece.y)) {
        currentPiece.rotation = testPiece.rotation;
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

// ----- 初期化 -----
spawnPiece();
draw();
