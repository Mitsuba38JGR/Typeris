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
