let userRotate = null;

window.addEventListener("message", (event) => {
    if (event.data.result) {
        userRotate = event.data.result;
    }
});

function rotatePiece(piece, board) {
    if (typeof userRotate === "function") {
        return userRotate(piece, board);
    }
    return piece; // デフォルト（何もしない）
}

