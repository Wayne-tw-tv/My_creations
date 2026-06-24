(function (global) {
  'use strict';

  var canvas = null;
  var ctx = null;
  var particles = [];
  var animating = false;
  var animationId = null;

  var COLORS = ['#FFD93D', '#FF6B6B', '#6C5CE7', '#4ECDC4', '#ffffff'];

  function init() {
    canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', global.LuckySpin.utils.debounce(resize, 150));
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      opacity: 1
    };
  }

  function launch(count) {
    if (!canvas || !ctx) return;

    var n = count || 120;
    for (var i = 0; i < n; i++) {
      particles.push(createParticle());
    }

    if (!animating) {
      animating = true;
      animate();
      setTimeout(function () {
        animating = false;
        if (animationId) cancelAnimationFrame(animationId);
        particles = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 3000);
    }
  }

  function animate() {
    if (!animating || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    particles = particles.filter(function (p) {
      return p.y < canvas.height + 50;
    });

    if (animating) {
      animationId = requestAnimationFrame(animate);
    }
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.confetti = {
    init: init,
    launch: launch
  };
})(window);
