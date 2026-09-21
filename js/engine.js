import { getUserRotate } from "./sandbox.js";
let userRotate = null;

window.addEventListener("message", (event) => {
    if (event.data.result) {
        userRotate = event.data.result;
    }
});

function rotatePiece(piece, board) {
    const userRotate = getUserRotate();

    if (typeof userRotate === "function") {
        try {
            return userRotate(piece, board);
        } catch (e) {
            console.error("ユーザー rotate() 実行中にエラー:", e);
        }
    }

    // デフォルト回転
    piece.rotation = (piece.rotation + 1) % 4;
    return piece;
}
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

function drawBoard() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] !== 0) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);

    ctx.strokeStyle = "#000";
    ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}
function drawPiece(piece) {
    piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value !== 0) {
                drawBlock(piece.x + dx, piece.y + dy, piece.color);
            }
        });
    });
}
const skinFiles = {
    I: [0, 90, 180, 270],
    O: [0],
    T: [0, 90, 180, 270],
    S: [0, 90],
    Z: [0, 90],
    J: [0, 90, 180, 270],
    L: [0, 90, 180, 270]
};
const skins = {
    I: {
        0: new Image(),
        90: new Image(),
    },
    O: {
        0: new Image()
    },
    T: {
        0: new Image(),
        90: new Image(),
        180: new Image(),
        270: new Image()
    },
    S: {
        0: new Image(),
        90: new Image()
    },
    Z: {
        0: new Image(),
        90: new Image()
    },
    J: {
        0: new Image(),
        90: new Image(),
        180: new Image(),
        270: new Image()
    },
    L: {
        0: new Image(),
        90: new Image(),
        180: new Image(),
        270: new Image()
    }
};

// 画像読み込み
for (const type in skins) {
    for (const rot in skins[type]) {
        skins[type][rot].src = `images/${type}${rot}.png`;
    }
}
function drawBlock(x, y, type, rotation) {
    const img = skins[type][rotation];

    if (!img.complete) {
        // 読み込み前はプレースホルダー
        ctx.fillStyle = "#333";
        ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
        return;
    }

    ctx.drawImage(img, x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}
