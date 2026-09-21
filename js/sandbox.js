const iframe = document.getElementById("sandbox");

document.getElementById("run").onclick = () => {
    const code = editor.getValue();
    iframe.contentWindow.postMessage({ code }, "*");
};

window.addEventListener("message", (event) => {
    if (event.data.error) {
        console.error("Sandbox Error:", event.data.error);
    } else {
        console.log("Sandbox Result:", event.data.result);
    }
});

