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
