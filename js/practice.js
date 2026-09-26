import { getUserRotate } from "./sandbox.js";

// Practiceモード専用フック
window.typerisHooks = {

    rotate: (...args) => {

        const func = getUserRotate();

        if (typeof func === "function") {
            return func(...args);
        }

        // ユーザーコード未読込時は何もしない
        return args[0];
    }

};

// テトリス本体起動
import "./engine/core.js";