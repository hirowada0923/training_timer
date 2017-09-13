// 文字盤の右側クリックで、5分
var rest = 5;
// 文字盤の左側をクリックで、20分
var work = 20;
// 文字盤を右クリックで、リセット

var duration = 0;
var center1;

var set_duration = false;

canvas.addEventListener('click', setDuration, false);
canvas.addEventListener('contextmenu', resetDuration, false);

// 時計を毎秒描画する
$(function() {
    setInterval(draw, 1000);
});

// 時計を描画する
function draw() {

    // 円のスタイルを定義する
    // radius はキャンバスサイズに対する比率
    var circle = {
        outer: {
            radius  : 0.9,
            color   : "#2a2a2a"
        },
        inner: {
            radius  : 0.85,
            color   : "#f6f6f6"
        },
				duration: {
						radius	: 0.85,
						color		: "#87ceeb"
				}
    };

    // 目盛りのスタイルを定義する
    // from, to はキャンバスサイズに対する比率
    var lines = {
        long: {
            from    : 0.8,
            to      : 0.68,
            width   : 3,
            color   : "#2a2a2a"
        },
        short: {
            from    : 0.8,
            to      : 0.75,
            width   : 1,
            color   : "#2a2a2a"
        }
    };

    // 針のスタイルを設定する
    // length は キャンバスサイズに対する比率
    // ratio は反対側の長さの比率
    var hands = {
        hour: {
            length  : 0.43,
            width   : 8,
            cap     : "round",
            color   : "#333",
            ratio   : 0.2
        },
        minute: {
            length  : 0.67,
            width   : 6,
            cap     : "round",
            color   : "#333",
            ratio   : 0.2
        },
        second: {
            length  : 0.67,
            width   : 2,
            cap     : "round",
            color   : "#dd3c3c",
            ratio   : 0.2
        }
    }

    // キャンバスを設定する
    var canvas = document.getElementById("canvas");
    canvas.width = $(window).width();
    canvas.height = $(window).height();
    var context = canvas.getContext("2d");
    var center = {
        x: Math.floor(canvas.width / 2),
        y: Math.floor(canvas.height / 2)
    };
    center1 = center.x;
    var radius = Math.min(center.x, center.y);
    var angle;
    var len;

		context.globalAlpha = 0.9;

    // 円を描画する
    context.beginPath();
    context.fillStyle = circle.outer.color;
    context.arc(center.x, center.y, radius * circle.outer.radius, 0, Math.PI * 2, false);
    context.fill();
    context.beginPath();
    context.fillStyle = circle.inner.color;
    context.arc(center.x, center.y, radius * circle.inner.radius, 0, Math.PI * 2, false);
    context.fill();

    // 目盛りを描画する
    for (var i = 0; i < 60; i++) {
        angle = Math.PI * i / 30;
        context.beginPath();
        var line = (i % 5 == 0) ? lines.long : lines.short;
        context.lineWidth = line.width;
        context.strokeStyle = line.color;
        context.moveTo(center.x + Math.sin(angle) * radius * line.from, center.y - Math.cos(angle) * radius * line.from);
        context.lineTo(center.x + Math.sin(angle) * radius * line.to, center.y - Math.cos(angle) * radius * line.to);
        context.stroke();
    }

    // 現在時刻を取得する
    var date = new Date();
    var h = date.getHours() % 12;
    var m = date.getMinutes();
    var s = date.getSeconds();

    // 作業時間・休憩時間を描画する
    if (set_duration == true) {
      if (Math.PI * (m + s / 60) / 30 - Math.PI / 2 < duration) {
        context.beginPath();
    		context.fillStyle = circle.duration.color;
        context.arc(center.x, center.y, radius * circle.inner.radius, Math.PI * (m + s / 60) / 30 - Math.PI / 2, duration, false);
    		context.lineTo(center.x, center.y)
    		context.fill();
      } else {
        play_desk_bell();
        set_duration = false;
      }
    }

    // 時針を描画する
    angle = Math.PI * (h + m / 60) / 6;
    len = radius * hands.hour.length;
    context.beginPath();
    context.lineWidth = hands.hour.width;
    context.lineCap = hands.hour.cap;
    context.strokeStyle = hands.hour.color;
    context.moveTo(center.x - Math.sin(angle) * len * hands.hour.ratio, center.y + Math.cos(angle) * len * hands.hour.ratio);
    context.lineTo(center.x + Math.sin(angle) * len, center.y - Math.cos(angle) * len);
    context.stroke();

    // 分針を描画する
    angle = Math.PI * (m + s / 60) / 30;
    len = radius * hands.minute.length;
    context.beginPath();
    context.lineWidth = hands.minute.width;
    context.lineCap = hands.minute.cap;
    context.strokeStyle = hands.minute.color;
    context.moveTo(center.x - Math.sin(angle) * len * hands.minute.ratio, center.y + Math.cos(angle) * len * hands.minute.ratio);
    context.lineTo(center.x + Math.sin(angle) * len, center.y - Math.cos(angle) * len);
    context.stroke();

    // 秒針を描画する
    angle = Math.PI * s / 30;
    len = radius * hands.second.length;
    context.beginPath();
    context.lineWidth = hands.second.width;
    context.lineCap = hands.second.cap;
    context.strokeStyle = hands.second.color;
    context.moveTo(center.x - Math.sin(angle) * len * hands.second.ratio, center.y + Math.cos(angle) * len * hands.second.ratio);
    context.lineTo(center.x + Math.sin(angle) * len, center.y - Math.cos(angle) * len);
    context.stroke();

}

function setDuration(e) {
  if (center1 > e.pageX) {
    interval = work;
  } else {
    interval = rest;
  }
  var date1 = new Date();
  var h1 = date1.getHours() % 12;
  var m1 = date1.getMinutes();
  var s1 = date1.getSeconds();
  duration = Math.PI * (m1 + s1 / 60) / 30 - Math.PI / 2 + Math.PI / 30 * interval;
  set_duration = true;
}

function resetDuration(e) {
  e.preventDefault();
  duration = 0;
  set_duration = false
}

function play_desk_bell()
{
	document.getElementById( 'sound-file' ).play();
}
