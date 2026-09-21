let editor;

require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById("editor"), {
        value: `function rotate(piece, board) {
    piece.rotation = (piece.rotation + 1) % 4;
    return piece;
}`,
        language: "javascript",
        theme: "vs-dark", // VSCode Dark+
        automaticLayout: true,
        fontSize: 15,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
    });
});

export function getEditorCode() {
    return editor.getValue();
}
