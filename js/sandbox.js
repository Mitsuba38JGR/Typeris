import { getEditorCode } from "./editor.js";

const iframe = document.getElementById("sandbox");

document.getElementById("run").onclick = () => {
    const code = getEditorCode(); // Monaco Editor から取得
    iframe.contentWindow.postMessage({ code }, "*");
};

let userRotate = null;

window.addEventListener("message", (event) => {
    if (event.data.rotateFunc) {
        userRotate = event.data.rotateFunc;
        console.log("ユーザー rotate() をロードしました");
    }
    if (event.data.error) {
        console.error("Sandbox Error:", event.data.error);
    }
});

export function getUserRotate() {
    return userRotate;
}
