(function () {
  var canvas;
  var ctx;
  var raf = 0;
  var width = 0;
  var height = 0;
  var dpr = 1;
  var particles = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function createLayer() {
    if (canvas || prefersReduced.matches) return;
    canvas = document.createElement("canvas");
    canvas.className = "global-particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d", { alpha: true });
  }

  function particleCount() {
    var area = width * height;
    var count = Math.round(area / 26000);
    return Math.max(34, Math.min(count, 90));
  }

  function seedParticles() {
    particles = [];
    var count = particleCount();
    for (var i = 0; i < count; i++) {
      var drift = 0.16 + Math.random() * 0.34;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * drift,
        vy: (Math.random() - 0.5) * drift,
        size: 0.8 + Math.random() * 1.8,
        hue: Math.random() > 0.72 ? 118 : 267,
        alpha: 0.16 + Math.random() * 0.24
      });
    }
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }

  function wrap(particle) {
    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;
  }

  function drawParticle(particle) {
    var color = particle.hue === 118 ? "68, 214, 44" : "178, 121, 255";
    ctx.beginPath();
    ctx.fillStyle = "rgba(" + color + ", " + particle.alpha + ")";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(" + color + ", 0.42)";
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLinks() {
    ctx.shadowBlur = 0;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i];
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 118) {
          var alpha = (1 - dist / 118) * 0.08;
          ctx.strokeStyle = "rgba(199, 185, 255, " + alpha + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (pointer.active) {
        var dx = p.x - pointer.x;
        var dy = p.y - pointer.y;
        var distSq = dx * dx + dy * dy;
        if (distSq < 19000 && distSq > 0.01) {
          var force = (1 - distSq / 19000) * 0.045;
          p.vx += dx * force / Math.sqrt(distSq);
          p.vy += dy * force / Math.sqrt(distSq);
        }
      }

      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      wrap(p);
    }

    drawLinks();
    for (var k = 0; k < particles.length; k++) drawParticle(particles[k]);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    createLayer();
    if (!canvas) return;
    resize();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (canvas) {
      canvas.remove();
      canvas = null;
      ctx = null;
    }
  }

  function handlePointerMove(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  function handlePointerLeave() {
    pointer.active = false;
  }

  prefersReduced.addEventListener("change", function () {
    if (prefersReduced.matches) stop();
    else start();
  });

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("blur", handlePointerLeave);
  window.addEventListener("resize", resize, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
