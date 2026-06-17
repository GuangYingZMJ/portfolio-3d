(function () {
  var BASE_PATH = "/portfolio-3d";
  var layer;
  var canvas;
  var ctx;
  var raf = 0;
  var cells = [];
  var width = 0;
  var height = 0;
  var dpr = 1;

  function matchesTarget() {
    var path = window.location.pathname.replace(/\/$/, "");
    return path === BASE_PATH + "/works" || path.indexOf(BASE_PATH + "/works/") === 0;
  }

  function installRouteHooks() {
    if (window.__shapeGridRouteHooks) return;
    window.__shapeGridRouteHooks = true;
    ["pushState", "replaceState"].forEach(function (method) {
      var original = history[method];
      history[method] = function () {
        var result = original.apply(this, arguments);
        window.dispatchEvent(new Event("shape-grid-route"));
        return result;
      };
    });
    window.addEventListener("popstate", updateVisibility);
    window.addEventListener("shape-grid-route", function () {
      requestAnimationFrame(updateVisibility);
    });
  }

  function createLayer() {
    if (layer) return;
    layer = document.createElement("div");
    layer.className = "shape-grid-bg";
    layer.setAttribute("aria-hidden", "true");
    canvas = document.createElement("canvas");
    layer.appendChild(canvas);
    document.body.appendChild(layer);
    ctx = canvas.getContext("2d", { alpha: true });
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
    seedCells();
  }

  function seedCells() {
    cells = [];
    var gap = width < 760 ? 28 : 38;
    var cols = Math.ceil(width / gap) + 3;
    var rows = Math.ceil(height / gap) + 3;
    for (var y = -1; y < rows; y++) {
      for (var x = -1; x < cols; x++) {
        var seed = Math.sin((x * 73.21 + y * 41.77) * 12.9898) * 43758.5453;
        var random = seed - Math.floor(seed);
        if (random < 0.44) {
          cells.push({
            x: x * gap,
            y: y * gap,
            size: gap * (0.44 + random * 0.7),
            delay: random * Math.PI * 2,
            speed: 0.62 + random * 0.86,
            angle: random > 0.66 ? Math.PI / 4 : 0,
            alpha: 0.28 + random * 0.46
          });
        }
      }
    }
  }

  function drawGrid(time) {
    var t = time * 0.001;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#100b18";
    ctx.fillRect(0, 0, width, height);

    var gap = width < 760 ? 28 : 38;
    var drift = (t * 24) % gap;

    var bloomA = ctx.createRadialGradient(width * 0.28, height * (0.26 + Math.sin(t * 0.28) * 0.08), 0, width * 0.28, height * 0.3, width * 0.62);
    bloomA.addColorStop(0, "rgba(166, 103, 255, 0.18)");
    bloomA.addColorStop(0.44, "rgba(88, 61, 150, 0.08)");
    bloomA.addColorStop(1, "rgba(16, 11, 24, 0)");
    ctx.fillStyle = bloomA;
    ctx.fillRect(0, 0, width, height);

    var bloomB = ctx.createRadialGradient(width * (0.68 + Math.cos(t * 0.22) * 0.06), height * 0.72, 0, width * 0.68, height * 0.72, width * 0.54);
    bloomB.addColorStop(0, "rgba(68, 214, 44, 0.12)");
    bloomB.addColorStop(0.5, "rgba(68, 214, 44, 0.045)");
    bloomB.addColorStop(1, "rgba(16, 11, 24, 0)");
    ctx.fillStyle = bloomB;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-drift, -drift * 0.45);
    ctx.strokeStyle = "rgba(204, 190, 255, 0.23)";
    ctx.lineWidth = 1;
    for (var x = -gap; x < width + gap * 2; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, -gap);
      ctx.lineTo(x, height + gap);
      ctx.stroke();
    }
    for (var y = -gap; y < height + gap * 2; y += gap) {
      ctx.beginPath();
      ctx.moveTo(-gap, y);
      ctx.lineTo(width + gap, y);
      ctx.stroke();
    }
    ctx.restore();

    cells.forEach(function (cell) {
      var pulse = (Math.sin(t * cell.speed + cell.delay) + 1) * 0.5;
      var offset = Math.sin(t * 0.86 + cell.delay) * 14;
      var size = cell.size * (0.68 + pulse * 0.46);
      var x = cell.x + offset - drift;
      var y = cell.y - offset * 0.6 - drift * 0.45;
      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      ctx.rotate(cell.angle);
      ctx.globalAlpha = cell.alpha * (0.55 + pulse * 0.75);
      ctx.shadowBlur = 10 + pulse * 20;
      ctx.shadowColor = pulse > 0.56 ? "rgba(180, 132, 255, 0.72)" : "rgba(112, 94, 178, 0.38)";
      ctx.fillStyle = pulse > 0.56 ? "rgba(178, 121, 255, 0.62)" : "rgba(58, 50, 82, 0.86)";
      ctx.strokeStyle = pulse > 0.56 ? "rgba(234, 222, 255, 0.76)" : "rgba(174, 151, 236, 0.34)";
      ctx.lineWidth = 1;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    });

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(178, 121, 255, 0.18)";
    ctx.lineWidth = 2;
    for (var band = -height; band < width + height; band += gap * 5) {
      var bandOffset = (band + t * 36) % (width + height);
      ctx.beginPath();
      ctx.moveTo(bandOffset - height, height);
      ctx.lineTo(bandOffset, 0);
      ctx.stroke();
    }
    ctx.restore();

    var vignette = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
    vignette.addColorStop(0, "rgba(13, 10, 18, 0)");
    vignette.addColorStop(0.62, "rgba(13, 10, 18, 0.1)");
    vignette.addColorStop(1, "rgba(13, 10, 18, 0.68)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    raf = requestAnimationFrame(drawGrid);
  }

  function start() {
    createLayer();
    resize();
    if (!raf && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(drawGrid);
    } else if (!raf) {
      drawGrid(0);
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function updateVisibility() {
    if (matchesTarget()) {
      document.body.classList.add("shape-grid-active");
      start();
    } else {
      document.body.classList.remove("shape-grid-active");
      stop();
    }
  }

  installRouteHooks();
  window.addEventListener("resize", resize, { passive: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateVisibility);
  } else {
    updateVisibility();
  }
})();
