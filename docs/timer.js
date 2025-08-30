/**
 * @fileoverview アナログ時計、60分以内の作業や休憩の設定が可能
 * 設定方法：文字盤内の分単位の目盛りのあたりをクリックする
 * 解除方法：文字盤の外をクリックする
 * 作業時間、休憩時間が終わるとベルが7秒間鳴る
 * macOS Firefox, macOS Chrome, iOS Safariで動作確認済み
 */
'use strict';

// --- DOM Elements ---
const canvas = document.getElementById("canvas");
const sound = document.getElementById('sound-file');

// --- Drawing Styles (Constants) ---
const STYLES = {
    circle: {
        outer: { radius: 0.9, color: "#2a2a2a" },
        inner: { radius: 0.85, color: "#f6f6f6" },
        duration: { radius: 0.85, color: "#87ceeb" }
    },
    lines: {
        long: { from: 0.8, to: 0.68, width: 3, color: "#2a2a2a" },
        short: { from: 0.8, to: 0.75, width: 1, color: "#2a2a2a" }
    },
    hands: {
        hour: { length: 0.43, width: 8, cap: "round", color: "#333", ratio: 0.2 },
        minute: { length: 0.67, width: 6, cap: "round", color: "#333", ratio: 0.2 },
        second: { length: 0.67, width: 2, cap: "round", color: "#dd3c3c", ratio: 0.2 }
    }
};

// --- State ---
let center = { x: 0, y: 0 };
let radius = 0;
let targetDate = null;

// --- Functions ---

/**
 * Canvasのサイズをウィンドウに合わせ、再描画する
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    center = {
        x: Math.floor(canvas.width / 2),
        y: Math.floor(canvas.height / 2)
    };
    radius = Math.min(center.x, center.y);
    draw(); // Redraw after resizing
}

/**
 * 時計を描画する
 */
function draw() {
    const context = canvas.getContext("2d");
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    //　図形の描画の透明度を設定する
    context.globalAlpha = 0.9;

    // アナログ時計の枠を描画する
    context.beginPath();
    context.fillStyle = STYLES.circle.outer.color;
    context.arc(center.x, center.y, radius * STYLES.circle.outer.radius, 0, Math.PI * 2, false);
    context.fill();

    context.beginPath();
    context.fillStyle = STYLES.circle.inner.color;
    context.arc(center.x, center.y, radius * STYLES.circle.inner.radius, 0, Math.PI * 2, false);
    context.fill();

    // アナログ時計の文字盤の目盛りを描画する
    for (let i = 0; i < 60; i++) {
        const angle = Math.PI * i / 30;
        const line = (i % 5 === 0) ? STYLES.lines.long : STYLES.lines.short;
        context.beginPath();
        context.lineWidth = line.width;
        context.strokeStyle = line.color;
        context.moveTo(center.x + Math.sin(angle) * radius * line.from, center.y - Math.cos(angle) * radius * line.from);
        context.lineTo(center.x + Math.sin(angle) * radius * line.to, center.y - Math.cos(angle) * radius * line.to);
        context.stroke();
    }

    // 現在時刻を取得する
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();

    // 作業時間・休憩時間を描画する
    if (targetDate) {
        if (now >= targetDate) {
            //　タイムアップの音を鳴らす
            sound.play();
            targetDate = null;
        } else {
            const currentAngle = (Math.PI * (m + s / 60) / 30) - (Math.PI / 2);
            const targetMinutes = targetDate.getMinutes();
            const targetSeconds = targetDate.getSeconds();
            let targetAngle = (Math.PI * (targetMinutes + targetSeconds / 60) / 30) - (Math.PI / 2);

            // 12時をまたぐ場合の描画を補正
            if (targetAngle < currentAngle) {
                targetAngle += Math.PI * 2;
            }

            context.beginPath();
            context.fillStyle = STYLES.circle.duration.color;
            context.moveTo(center.x, center.y);
            context.arc(center.x, center.y, radius * STYLES.circle.inner.radius, currentAngle, targetAngle, false);
            context.lineTo(center.x, center.y);
            context.fill();
        }
    }

    // 各針を描画する
    drawHand(context, (Math.PI * (h + m / 60) / 6), STYLES.hands.hour); // 時針
    drawHand(context, (Math.PI * (m + s / 60) / 30), STYLES.hands.minute); // 分針
    drawHand(context, (Math.PI * s / 30), STYLES.hands.second); // 秒針
}

/**
 * 指定されたスタイルで時計の針を描画する
 * @param {CanvasRenderingContext2D} context - 描画コンテキスト
 * @param {number} angle - 針の角度 (ラジアン)
 * @param {object} style - 針のスタイル
 */
function drawHand(context, angle, style) {
    const len = radius * style.length;
    context.beginPath();
    context.lineWidth = style.width;
    context.lineCap = style.cap;
    context.strokeStyle = style.color;
    context.moveTo(center.x - Math.sin(angle) * len * style.ratio, center.y + Math.cos(angle) * len * style.ratio);
    context.lineTo(center.x + Math.sin(angle) * len, center.y - Math.cos(angle) * len);
    context.stroke();
}


/**
 * クリック位置からタイマーの終了時刻を設定する
 * @param {MouseEvent} e - マウスイベント
 */
function setDuration(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dist = Math.sqrt(Math.pow(clickX - center.x, 2) + Math.pow(clickY - center.y, 2));

    // 文字盤の外側がクリックされたらタイマーを解除
    if (dist > radius * STYLES.circle.outer.radius) {
        targetDate = null;
        return;
    }
    
    // 文字盤の内側（中心付近）すぎても何もしない
    if (dist < radius * 0.1) {
        return;
    }

    // クリックされた角度を計算 (0-59分にマッピング)
    let angle = Math.atan2(clickY - center.y, clickX - center.x) + Math.PI / 2;
    if (angle < 0) {
        angle += Math.PI * 2;
    }
    const clickedMinute = Math.round(angle * 30 / Math.PI);

    const now = new Date();
    const currentMinute = now.getMinutes();

    let durationInMinutes = clickedMinute - currentMinute;
    if (durationInMinutes <= 0) {
        durationInMinutes += 60;
    }

    // ターゲット時刻を設定
    targetDate = new Date();
    targetDate.setMinutes(targetDate.getMinutes() + durationInMinutes);
    targetDate.setSeconds(0);
    targetDate.setMilliseconds(0);

    // iOSで音声ファイルがロードされない問題に対応
    sound.load();
}

// --- Initialization ---

// イベントリスナーを設定
canvas.addEventListener('click', setDuration, false);
window.addEventListener('resize', resizeCanvas, false);

// 初期化
resizeCanvas(); // 初回描画
setInterval(draw, 1000); // 毎秒更新