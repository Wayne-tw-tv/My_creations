(function (global) {
  'use strict';

  var COLORS = [
    '#FFD93D',
    '#FF6B6B',
    '#6C5CE7',
    '#4ECDC4',
    '#FFB347',
    '#A8E6CF',
    '#FF8CC8',
    '#87CEEB'
  ];

  var canvas = null;
  var ctx = null;
  var names = [];
  var rotation = 0;
  var isSpinning = false;
  var spinResolve = null;
  var lastTickSegment = -1;

  function init() {
    canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', global.LuckySpin.utils.debounce(resizeCanvas, 150));
  }

  function resizeCanvas() {
    if (!canvas) return;
    var wrap = canvas.parentElement;
    var size = Math.min(wrap.clientWidth, 400);
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function setNames(newNames) {
    names = newNames.slice();
    rotation = rotation % 360;
    updatePlaceholder();
    draw();
  }

  function getNames() {
    return names.slice();
  }

  function updatePlaceholder() {
    var placeholder = document.getElementById('wheel-placeholder');
    if (!placeholder) return;
    placeholder.style.display = names.length === 0 ? 'flex' : 'none';
  }

  function draw() {
    if (!ctx || !canvas) return;

    var size = canvas.width / (window.devicePixelRatio || 1);
    var cx = size / 2;
    var cy = size / 2;
    var radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    if (names.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#dfe6e9';
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    var sliceAngle = (Math.PI * 2) / names.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);

    for (var i = 0; i < names.length; i++) {
      var startAngle = i * sliceAngle - Math.PI / 2;
      var endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      var textAngle = startAngle + sliceAngle / 2;
      ctx.rotate(textAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2d3436';
      ctx.font = 'bold ' + Math.max(11, Math.min(16, radius / names.length * 1.8)) + 'px "Segoe UI", "Microsoft JhengHei", sans-serif';

      var hubRadius = radius * 0.18;
      var textRadius = Math.max(hubRadius + 28, radius * 0.64);

      var label = names[i];
      if (label.length > 8) label = label.slice(0, 7) + '…';
      ctx.fillText(label, textRadius, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold ' + Math.max(14, radius * 0.08) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', 0, 0);

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function getIndexAtPointer() {
    if (names.length === 0) return -1;
    var normalized = ((rotation % 360) + 360) % 360;
    var sliceDeg = 360 / names.length;
    var pointerAngle = (360 - normalized + 360) % 360;
    var index = Math.floor(pointerAngle / sliceDeg) % names.length;
    return index;
  }

  function computeTargetRotation(targetIndex) {
    var sliceDeg = 360 / names.length;
    var segmentCenter = targetIndex * sliceDeg + sliceDeg / 2;
    var extraSpins = 5 + global.LuckySpin.utils.randomInt(4);
    var current = rotation;
    var targetMod = (360 - segmentCenter + 360) % 360;
    var currentMod = ((current % 360) + 360) % 360;
    var delta = (targetMod - currentMod + 360) % 360;
    if (delta < sliceDeg * 0.5) delta += 360;
    return current + extraSpins * 360 + delta;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function triggerPointerBounce() {
    var pointer = document.getElementById('wheel-pointer');
    if (!pointer) return;
    pointer.classList.remove('bounce');
    void pointer.offsetWidth;
    pointer.classList.add('bounce');
  }

  function checkTick() {
    if (names.length === 0) return;
    var seg = getIndexAtPointer();
    if (seg !== lastTickSegment) {
      lastTickSegment = seg;
      var soundOn = global.LuckySpin.settings &&
        global.LuckySpin.settings.getSettings().sound;
      if (soundOn && global.LuckySpin.audio) {
        global.LuckySpin.audio.tick();
      }
    }
  }

  function spinToIndex(targetIndex) {
    if (isSpinning || names.length === 0) {
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      isSpinning = true;
      spinResolve = resolve;
      lastTickSegment = -1;

      var startRotation = rotation;
      var endRotation = computeTargetRotation(targetIndex);
      var duration = 4000 + global.LuckySpin.utils.randomFloat() * 1500;
      var startTime = null;

      function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / duration, 1);

        var eased = easeOutCubic(progress);
        rotation = startRotation + (endRotation - startRotation) * eased;
        checkTick();
        draw();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          rotation = endRotation;
          draw();
          isSpinning = false;
          triggerPointerBounce();

          var soundOn = global.LuckySpin.settings &&
            global.LuckySpin.settings.getSettings().sound;
          if (soundOn && global.LuckySpin.audio) {
            global.LuckySpin.audio.win();
          }

          if (spinResolve) spinResolve();
          spinResolve = null;
        }
      }

      requestAnimationFrame(animate);
    });
  }

  function getIsSpinning() {
    return isSpinning;
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.wheel = {
    init: init,
    setNames: setNames,
    getNames: getNames,
    draw: draw,
    spinToIndex: spinToIndex,
    getIndexAtPointer: getIndexAtPointer,
    getIsSpinning: getIsSpinning
  };
})(window);
