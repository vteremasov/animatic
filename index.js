// Creates a transparent, full-screen canvas with two lightly-swaying snowflakes
// hanging from the provided top_line image via simple yellow chain links.

(() => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1';

  const dpr = () => window.devicePixelRatio || 1;
  const assets = {
    topLine: 'top_line.png',
    snowflake1: 'snowflake1.png',
    snowflake2: 'snowflake2png.png',
    snowflake3: 'snowflake3.png',
    sosul: 'sosul.png',
    sock1: 'sock1.png',
    sock2: 'sock2.png',
    kendy: 'kendy.png',
    leaves1: 'leaves1.png',
    cherry1: 'cherry1.png',
    leaves2: 'leaves2.png',
  };

  const state = {
    images: {},
    lineBounds: null,
    flakeBounds: {},
    ready: false,
    anchorY: 40,
    flakes: [],
    sock: null,
    sock2s: [],
    kendys: [],
    leaves: null,
    cherry: null,
    cherry2: null,
    leaves2: null,
    lights: [],
    spin3: {
      angle: 0,
      speed: 0,
      targetSpeed: 0.8,
      dir: 1,
      nextSwitch: 0,
    },
  };

  function resizeCanvas() {
    const ratio = dpr();
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function loadAssets() {
    const [topLine, snowflake1, snowflake2, snowflake3, sosul, sock1, sock2, kendy, leaves1, cherry1, leaves2] = await Promise.all([
      loadImage(assets.topLine),
      loadImage(assets.snowflake1),
      loadImage(assets.snowflake2),
      loadImage(assets.snowflake3),
      loadImage(assets.sosul),
      loadImage(assets.sock1),
      loadImage(assets.sock2),
      loadImage(assets.kendy),
      loadImage(assets.leaves1),
      loadImage(assets.cherry1),
      loadImage(assets.leaves2),
    ]);

    state.images = { topLine, snowflake1, snowflake2, snowflake3, sosul, sock1, sock2, kendy, leaves1, cherry1, leaves2 };
    state.lineBounds = getOpaqueBounds(topLine);
    state.flakeBounds = {
      snowflake1: getOpaqueBounds(snowflake1),
      snowflake2: getOpaqueBounds(snowflake2),
      snowflake3: getOpaqueBounds(snowflake3),
      sock1: getOpaqueBounds(sock1),
      sock2: getOpaqueBounds(sock2),
      kendy: getOpaqueBounds(kendy),
      leaves1: getOpaqueBounds(leaves1),
      cherry1: getOpaqueBounds(cherry1),
      leaves2: getOpaqueBounds(leaves2),
    };
    createFlakes();
    buildLights();
    state.ready = true;
    requestAnimationFrame(tick);
  }

  function getOpaqueBounds(img) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const cctx = c.getContext('2d');
    cctx.drawImage(img, 0, 0);
    const { data, width, height } = cctx.getImageData(0, 0, img.width, img.height);

    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4 + 3; // alpha channel
        if (data[idx] > 10) { // treat low alpha as transparent
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX === -1) {
      return { minX: 0, minY: 0, maxX: img.width, maxY: img.height };
    }
    return { minX, minY, maxX, maxY };
  }

  function createFlakes() {
    const { topLine, snowflake1, snowflake2 } = state.images;
    const midX = window.innerWidth / 2;
    const bottomY = state.lineBounds ? state.lineBounds.maxY : topLine.height / 2;
    const lineY = state.anchorY + bottomY;
    const lineTopY = state.anchorY + (state.lineBounds ? state.lineBounds.minY : 0);

    const configs = [
      { offsetX: topLine.width * 0.18, offsetY: -12, length: 360, img: snowflake1 },
      { offsetX: topLine.width * 0.32, offsetY: -55, length: 520, img: snowflake2 },
    ];

    const spacing = 16;
    state.flakes = configs.map((cfg) => {
      const segments = Math.max(8, Math.round(cfg.length / spacing));
      return {
        img: cfg.img,
        anchor: { x: midX + cfg.offsetX, y: lineY + (cfg.offsetY || 0) },
        offsetX: cfg.offsetX,
        offsetY: cfg.offsetY || 0,
        length: cfg.length,
        segments,
        angle: (Math.random() * 0.8 - 0.4), // larger random start
        angularVelocity: (Math.random() - 0.5) * 0.6,
        driveRate: 0.0007 + Math.random() * 0.0006,
        drivePhase: Math.random() * Math.PI * 2,
        driveAmp: 0.18 + Math.random() * 0.08,
      };
    });

    // sock hanging from the line
    const sockOffsetX = topLine.width * 0.05;
    const sockOffsetY = 0;
    const sockLength = 20;
    const sockSegments = Math.max(2, Math.round(sockLength / 10));
    state.sock = {
      anchor: { x: midX + sockOffsetX, y: lineY + sockOffsetY },
      offsetX: sockOffsetX,
      offsetY: sockOffsetY,
      length: sockLength,
      segments: sockSegments,
      angle: (Math.random() * 0.4 - 0.2),
      angularVelocity: 0,
      driveRate: 0.0009 + Math.random() * 0.0007,
      drivePhase: Math.random() * Math.PI * 2,
      driveAmp: 0.22 + Math.random() * 0.12,
    };

    // two sock2 copies around sock1
    const sock2Length = 20;
    const sock2Segments = Math.max(2, Math.round(sock2Length / 10));
    const sock2Offsets = [
			{
				offsetX: topLine.width * -0.42,
				offsetY: -117,
			}, {
				offsetX: topLine.width * 0.40,
				offsetY: -82
			}
		];
    state.sock2s = sock2Offsets.map(({offsetX, offsetY}) => ({
      anchor: { x: midX + offsetX, y: lineY + offsetY + (offsetX < 0 ? 2 : 0) },
      offsetX,
      offsetY: offsetY - 12,
      length: sock2Length,
      segments: sock2Segments,
      angle: (Math.random() * 0.4 - 0.2),
      angularVelocity: 0,
      driveRate: 0.0009 + Math.random() * 0.0007,
      drivePhase: Math.random() * Math.PI * 2,
      driveAmp: 0.22 + Math.random() * 0.12,
    }));

    // two kendy copies around sock1 (closer than sock2)
    const kendyLength = 18;
    const kendySegments = Math.max(2, Math.round(kendyLength / 9));
    const kendyConfigs = [
      { offsetX: topLine.width * -0.1, offsetY: -10 },
      { offsetX: topLine.width * 0.28, offsetY: -30 },
    ];
    state.kendys = kendyConfigs.map((cfg) => ({
      anchor: { x: midX + cfg.offsetX, y: lineY + cfg.offsetY },
      offsetX: cfg.offsetX,
      offsetY: cfg.offsetY,
      length: kendyLength,
      segments: kendySegments,
      angle: (Math.random() * 0.6 - 0.3),
      angularVelocity: (Math.random() - 0.5) * 0.5,
      driveRate: 0.001 + Math.random() * 0.0007,
      drivePhase: Math.random() * Math.PI * 2,
      driveAmp: 0.2 + Math.random() * 0.1,
    }));

    // leaves resting on top of the line, gentle sway
    const leavesOffsetX = topLine.width * 0.16 - 1;
    state.leaves = {
      anchor: { x: midX + leavesOffsetX, y: lineTopY + 114 },
      offsetX: leavesOffsetX,
      offsetY: 114,
      angle: 0,
      angularVelocity: 0,
      driveRate: 0.0007 + Math.random() * 0.0005,
      drivePhase: Math.random() * Math.PI * 2,
    };

    // leaves2 resting on top of the line, gentle sway
    const leaves2OffsetX = topLine.width * -0.24;
    state.leaves2 = {
      anchor: { x: midX + leaves2OffsetX, y: lineTopY + 48 },
      offsetX: leaves2OffsetX,
      offsetY: 48,
      angle: 0,
      angularVelocity: 0,
      driveRate: 0.0007 + Math.random() * 0.0005,
      drivePhase: Math.random() * Math.PI * 2,
    };

    // cherry resting near leaves (static, independent offsets)
    const cherryOffsetX = topLine.width * 0.24 - 145;
    const cherryOffsetY = 117;
    state.cherry = {
      offsetX: cherryOffsetX,
      offsetY: cherryOffsetY,
      anchorX: midX + cherryOffsetX,
      anchorY: lineTopY + cherryOffsetY,
    };

    // second cherry on left side of scene (static)
    const cherry2OffsetX = topLine.width * -0.24 - 3;
    const cherry2OffsetY = 75;
    state.cherry2 = {
      offsetX: cherry2OffsetX,
      offsetY: cherry2OffsetY,
      anchorX: midX + cherry2OffsetX,
      anchorY: lineTopY + cherry2OffsetY,
    };
  }

  function updateAnchors() {
    const { topLine } = state.images;
    if (!topLine) return;
    const midX = window.innerWidth / 2;
    const bottomY = state.lineBounds ? state.lineBounds.maxY : topLine.height / 2;
    const lineY = state.anchorY + bottomY;
    state.flakes.forEach((flake) => {
      flake.anchor.x = midX + flake.offsetX;
      flake.anchor.y = lineY + flake.offsetY;
    });

    if (state.sock) {
      state.sock.anchor.x = midX + state.sock.offsetX;
      state.sock.anchor.y = lineY + state.sock.offsetY;
    }
    if (state.sock2s.length) {
      state.sock2s.forEach((s) => {
        s.anchor.x = midX + s.offsetX;
        s.anchor.y = lineY + s.offsetY;
      });
    }
    if (state.kendys.length) {
      state.kendys.forEach((k) => {
        k.anchor.x = midX + k.offsetX;
        k.anchor.y = lineY + k.offsetY;
      });
    }
    if (state.leaves) {
      const lineTopY = state.anchorY + (state.lineBounds ? state.lineBounds.minY : 0);
      state.leaves.anchor.x = midX + state.leaves.offsetX;
      state.leaves.anchor.y = lineTopY + state.leaves.offsetY;
    }
    if (state.leaves2) {
      const lineTopY = state.anchorY + (state.lineBounds ? state.lineBounds.minY : 0);
      state.leaves2.anchor.x = midX + state.leaves2.offsetX;
      state.leaves2.anchor.y = lineTopY + state.leaves2.offsetY;
    }
    if (state.cherry) {
      const lineTopY = state.anchorY + (state.lineBounds ? state.lineBounds.minY : 0);
      state.cherry.anchorX = midX + state.cherry.offsetX;
      state.cherry.anchorY = lineTopY + state.cherry.offsetY;
    }
    if (state.cherry2) {
      const lineTopY = state.anchorY + (state.lineBounds ? state.lineBounds.minY : 0);
      state.cherry2.anchorX = midX + state.cherry2.offsetX;
      state.cherry2.anchorY = lineTopY + state.cherry2.offsetY;
    }
    if (state.lights.length) {
      buildLights();
    }
  }

  function pickChristmasColor() {
    const palette = ['#ff4d4f', '#2ecc71', '#f4d03f', '#00c3ff', '#ff6f61'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function buildLights() {
    const { topLine } = state.images;
    if (!topLine) return;
    const margin = 12;
    const usableWidth = Math.max(200, window.innerWidth - margin * 2);
    const anchorY = state.anchorY + (state.lineBounds
      ? state.lineBounds.maxY + 10
      : topLine.height * 0.6);
    const sceneHeight = Math.max(220, Math.min(window.innerHeight * 0.65, 520));

    const lanes = 6;
    const perLane = Math.max(8, Math.floor(usableWidth / 70));
    const lights = [];

    for (let lane = 0; lane < lanes; lane += 1) {
      const laneT = lanes === 1 ? 0.5 : lane / (lanes - 1);
      const laneY = anchorY + (laneT - 0.25) * sceneHeight + (Math.random() * 30 - 15);
      for (let i = 0; i < perLane; i += 1) {
        const t = (i + Math.random() * 0.7 + lane * 0.1) / perLane;
        const arcAmp = 28 + Math.random() * 32;
        const arc = Math.sin(t * Math.PI * 2 + lane * 0.8) * arcAmp;
        const jitterY = Math.random() * 30 - 15;
        const x = margin + t * usableWidth + (Math.random() - 0.5) * 26;
        lights.push({
          baseX: x,
          baseY: laneY + arc + jitterY,
          offsetX: 0,
          offsetY: 0,
          targetX: (Math.random() - 0.5) * 8,
          targetY: (Math.random() - 0.5) * 8,
          nextMove: performance.now() + 200 + Math.random() * 800,
          color: pickChristmasColor(),
          on: Math.random() > 0.35,
          glow: Math.random(),
          interval: 1200 + Math.random() * 1600,
          nextSwitch: performance.now() + Math.random() * 1400,
        });
      }
    }

    state.lights = lights;
  }

  function drawChain(anchor, bob, segments, angle) {
    const dx = bob.x - anchor.x;
    const dy = bob.y - anchor.y;
    const sagBase = Math.min(18, Math.hypot(dx, dy) * 0.08);
    const sag = sagBase * (1 + Math.min(Math.abs(angle), 1));
    ctx.save();
    ctx.fillStyle = '#ffd133';
    ctx.shadowColor = 'rgba(255, 179, 0, 1)';
    ctx.shadowBlur = 44;
    for (let i = 1; i <= segments; i += 1) {
      const t = i / segments;
      const sagFactor = Math.sin(Math.PI * t);
      const x = anchor.x + dx * t;
      const y = anchor.y + dy * t + sag * sagFactor;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function stepPhysics(dtMs) {
    // damped pendulum with gentle self-driven sway
    const dt = dtMs / 1000; // seconds
    const gravity = 45; // stronger gravity for weightier swing
    const damping = 0.99;
    const now = performance.now();

    // sock physics (self-driven sway)
    if (state.sock) {
      const drive = Math.sin(now * state.sock.driveRate + state.sock.drivePhase) * state.sock.driveAmp;
      let micro = (Math.random() - 0.5) * 0.006;
      if (Math.abs(state.sock.angularVelocity) < 0.00008 || Math.abs(state.sock.angle) > 0.24) {
        micro += (Math.random() - 0.5) * 0.03;
      }
      const centerPull = -0.15 * state.sock.angle; // allow wider drift
      const angularAcceleration = -(gravity / state.sock.length) * Math.sin(state.sock.angle) + drive + micro + centerPull;
      state.sock.angularVelocity += angularAcceleration * dt;
      state.sock.angularVelocity *= damping;
      state.sock.angle += state.sock.angularVelocity * dt;
      state.sock.angle = Math.max(Math.min(state.sock.angle, 0.32), -0.32);
    }

    // sock2 copies physics
    state.sock2s.forEach((s) => {
      const drive = Math.sin(now * s.driveRate + s.drivePhase) * s.driveAmp;
      let micro = (Math.random() - 0.5) * 0.006;
      if (Math.abs(s.angularVelocity) < 0.00008 || Math.abs(s.angle) > 0.24) {
        micro += (Math.random() - 0.5) * 0.03;
      }
      const centerPull = -0.15 * s.angle; // allow wider drift
      const angularAcceleration = -(gravity / s.length) * Math.sin(s.angle) + drive + micro + centerPull;
      s.angularVelocity += angularAcceleration * dt;
      s.angularVelocity *= damping;
      s.angle += s.angularVelocity * dt;
      s.angle = Math.max(Math.min(s.angle, 0.32), -0.32);
    });

    // kendy copies physics
    state.kendys.forEach((k) => {
      const drive = Math.sin(now * k.driveRate + k.drivePhase) * k.driveAmp;
      let micro = (Math.random() - 0.5) * 0.006;
      if (Math.abs(k.angularVelocity) < 0.00008 || Math.abs(k.angle) > 0.24) {
        micro += (Math.random() - 0.5) * 0.03;
      }
      const centerPull = -0.15 * k.angle; // allow wider drift like socks
      const angularAcceleration = -(gravity / k.length) * Math.sin(k.angle) + drive + micro + centerPull;
      k.angularVelocity += angularAcceleration * dt;
      k.angularVelocity *= damping;
      k.angle += k.angularVelocity * dt;
      k.angle = Math.max(Math.min(k.angle, 0.32), -0.32);
    });

    // leaves sway (small rotational sway driven by slow oscillation)
    if (state.leaves) {
      const target = Math.sin(now * state.leaves.driveRate + state.leaves.drivePhase) * 0.05;
      const swayAccel = (target - state.leaves.angle) * 0.55;
      state.leaves.angularVelocity += swayAccel * dt;
      state.leaves.angularVelocity *= 0.997;
      state.leaves.angle += state.leaves.angularVelocity * dt;
      state.leaves.angle = Math.max(Math.min(state.leaves.angle, 0.06), -0.06);
    }
    if (state.leaves2) {
      const target = Math.sin(now * state.leaves2.driveRate + state.leaves2.drivePhase) * 0.05;
      const swayAccel = (target - state.leaves2.angle) * 0.55;
      state.leaves2.angularVelocity += swayAccel * dt;
      state.leaves2.angularVelocity *= 0.997;
      state.leaves2.angle += state.leaves2.angularVelocity * dt;
      state.leaves2.angle = Math.max(Math.min(state.leaves2.angle, 0.06), -0.06);
    }

    // update middle snowflake spin (slow-fast-slow with random direction flips)
    if (now > state.spin3.nextSwitch) {
      state.spin3.dir = Math.random() > 0.5 ? 1 : -1;
      state.spin3.targetSpeed = 1.6 + Math.random() * 1.8; // even faster rad/s
      state.spin3.nextSwitch = now + 1200 + Math.random() * 1400;
    }
    const desired = state.spin3.targetSpeed * state.spin3.dir;
    const spinAccel = (desired - state.spin3.speed) * 2.2;
    state.spin3.speed += spinAccel * dt;
    state.spin3.speed *= 0.995; // mild drag
    state.spin3.angle += state.spin3.speed * dt;

    state.flakes.forEach((flake) => {
      const drive = Math.sin(now * flake.driveRate + flake.drivePhase) * flake.driveAmp;
      let micro = (Math.random() - 0.5) * 0.006;
      if (Math.abs(flake.angularVelocity) < 0.00008 || Math.abs(flake.angle) > 0.24) {
        micro += (Math.random() - 0.5) * 0.03; // stronger nudge if stalled or near edge
      }
      const centerPull = -0.25 * flake.angle; // stronger spring toward center
      const angularAcceleration = -(gravity / flake.length) * Math.sin(flake.angle) + drive + micro + centerPull;
      flake.angularVelocity += angularAcceleration * dt;
      flake.angularVelocity *= damping;
      flake.angle += flake.angularVelocity * dt;
      flake.angle = Math.max(Math.min(flake.angle, 0.3), -0.3); // tighter cap to avoid lingering far aside
    });

    state.lights.forEach((light) => {
      if (now > light.nextSwitch) {
        light.on = !light.on;
        if (!light.on && Math.random() < 0.25) {
          light.color = pickChristmasColor();
        }
        light.nextSwitch = now + light.interval * (0.5 + Math.random());
      }
      const targetGlow = light.on ? 1 : 0;
      light.glow += (targetGlow - light.glow) * 0.12;

      const invisible = light.glow < 0.08;
      if (!light.on && invisible && now > light.nextMove) {
        light.targetX = (Math.random() - 0.5) * 16;
        light.targetY = (Math.random() - 0.5) * 16;
        light.nextMove = now + 600 + Math.random() * 1600;
      }
      if (!light.on && invisible) {
        light.offsetX += (light.targetX - light.offsetX) * 0.04;
        light.offsetY += (light.targetY - light.offsetY) * 0.04;
      }
    });
  }

  function getCenterOffsets(imgKey, img, scale) {
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const bounds = state.flakeBounds[imgKey];
    const cx = bounds
      ? ((bounds.minX + bounds.maxX) / 2 / img.width) * drawW
      : drawW / 2;
    const cy = bounds
      ? ((bounds.minY + bounds.maxY) / 2 / img.height) * drawH
      : drawH / 2;
    return { drawW, drawH, cx, cy };
  }

  function drawScene() {
    if (!state.ready) return;
    const { topLine, snowflake3 } = state.images;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const lineX = (window.innerWidth - topLine.width) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 208, 120, 0.8)';
    ctx.shadowBlur = 36;
    ctx.drawImage(topLine, lineX, state.anchorY);
    if (state.images.sosul) {
      ctx.drawImage(state.images.sosul, lineX, state.anchorY);
    }
    ctx.restore();

    // festive lights riding the line
    if (state.lights.length) {
      state.lights.forEach((light) => {
        if (light.glow < 0.02) return; // fully off
        const drawX = light.baseX + light.offsetX;
        const drawY = light.baseY + light.offsetY;
        ctx.save();
        ctx.globalAlpha = 0.75 * light.glow;
        ctx.fillStyle = light.color;
        ctx.shadowColor = `${light.color}cc`;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, 6 * light.glow, 4.5 * light.glow, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, 3.6, 2.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // Draw sock with a thin rope
    if (state.sock && state.images.sock1) {
      const { sock1 } = state.images;
      const bob = {
        x: state.sock.anchor.x + state.sock.length * Math.sin(state.sock.angle),
        y: state.sock.anchor.y + state.sock.length * Math.cos(state.sock.angle),
      };

      // rope sag
      const dx = bob.x - state.sock.anchor.x;
      const dy = bob.y - state.sock.anchor.y;
      const sagBase = Math.min(16, Math.hypot(dx, dy) * 0.06);
      const sag = sagBase * (1 + Math.min(Math.abs(state.sock.angle), 1));
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(state.sock.anchor.x, state.sock.anchor.y);
      for (let i = 1; i <= state.sock.segments; i += 1) {
        const t = i / state.sock.segments;
        const sagFactor = Math.sin(Math.PI * t);
        const x = state.sock.anchor.x + dx * t;
        const y = state.sock.anchor.y + dy * t + sag * sagFactor;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      const scale = 0.8;
      const bounds = state.flakeBounds.sock1;
      const drawW = sock1.width * scale;
      const drawH = sock1.height * scale;
      const attachX = bounds
        ? ((bounds.minX + bounds.maxX) / 2 / sock1.width) * drawW
        : drawW / 2;
      const attachY = bounds
        ? (bounds.minY / sock1.height) * drawH
        : 0;
      ctx.save();
      ctx.translate(bob.x, bob.y);
      ctx.drawImage(sock1, -attachX, -attachY, drawW, drawH);
      ctx.restore();
    }

    state.flakes.forEach((flake) => {
      const bob = {
        x: flake.anchor.x + flake.length * Math.sin(flake.angle),
        y: flake.anchor.y + flake.length * Math.cos(flake.angle),
      };

      drawChain(flake.anchor, bob, flake.segments, flake.angle);

      const scale = 0.8;
      const { drawW, drawH, cx, cy } = getCenterOffsets(
        flake.img === state.images.snowflake1 ? 'snowflake1' : 'snowflake2',
        flake.img,
        scale,
      );

      ctx.save();
      ctx.translate(bob.x, bob.y);
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 58;
      ctx.drawImage(flake.img, -cx, -cy, drawW, drawH);
      ctx.restore();

      if (flake.img === state.images.snowflake2 && snowflake3) {
        // Place snowflake3 at mid-chain position following the sag curve.
        const dx = bob.x - flake.anchor.x;
        const dy = bob.y - flake.anchor.y;
        const sagBase = Math.min(18, Math.hypot(dx, dy) * 0.08);
        const sag = sagBase * (1 + Math.min(Math.abs(flake.angle), 1));
        const t = 0.5;
        const sagFactor = Math.sin(Math.PI * t);
        const midX = flake.anchor.x + dx * t;
        const midY = flake.anchor.y + dy * t + sag * sagFactor;

        const midScale = 0.65;
        const { drawW: mW, drawH: mH, cx: mCx, cy: mCy } = getCenterOffsets('snowflake3', snowflake3, midScale);
        ctx.save();
        ctx.translate(midX, midY);
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 58;
        ctx.rotate(state.spin3.angle);
        ctx.drawImage(snowflake3, -mCx, -mCy, mW, mH);
        ctx.restore();
      }
    });

    // Draw leaves last so they sit above chains/flakes; pivot at opaque top-left
    if (state.leaves && state.images.leaves1) {
      const { leaves1 } = state.images;
      const scale = 0.68; // slightly smaller on the right
      const drawW = leaves1.width * scale;
      const drawH = leaves1.height * scale;
      const bounds = state.flakeBounds.leaves1;
      const offsetX = bounds ? (bounds.minX / leaves1.width) * drawW : 0;
      const offsetY = bounds ? (bounds.minY / leaves1.height) * drawH : 0;
      ctx.save();
      ctx.translate(state.leaves.anchor.x, state.leaves.anchor.y);
      ctx.rotate(state.leaves.angle);
      ctx.drawImage(leaves1, -offsetX, -offsetY, drawW, drawH);
      ctx.restore();
    }

    // leaves2 above chains as well; pivot at opaque top-left
    if (state.leaves2 && state.images.leaves2) {
      const { leaves2 } = state.images;
      const scale = 0.62; // slightly smaller on the left
      const drawW = leaves2.width * scale;
      const drawH = leaves2.height * scale;
      const bounds = state.flakeBounds.leaves2;
      const offsetX = bounds ? (bounds.minX / leaves2.width) * drawW : 0;
      const offsetY = bounds ? (bounds.minY / leaves2.height) * drawH : 0;
      ctx.save();
      ctx.translate(state.leaves2.anchor.x, state.leaves2.anchor.y);
      ctx.rotate(state.leaves2.angle);
      ctx.drawImage(leaves2, -offsetX, -offsetY, drawW, drawH);
      ctx.restore();
    }

    // cherries on top (static, independent of leaves movement)
    if (state.images.cherry1) {
      const { cherry1 } = state.images;
      const scale = 0.6;
      const drawW = cherry1.width * scale;
      const drawH = cherry1.height * scale;
      const bounds = state.flakeBounds.cherry1;
      const offsetX = bounds ? (bounds.minX / cherry1.width) * drawW : 0;
      const offsetY = bounds ? (bounds.minY / cherry1.height) * drawH : 0;
      [state.cherry, state.cherry2].forEach((ch) => {
        if (!ch) return;
        ctx.save();
        ctx.translate(ch.anchorX, ch.anchorY);
        ctx.drawImage(cherry1, -offsetX, -offsetY, drawW, drawH);
        ctx.restore();
      });
    }

    // Draw sock2 copies with ropes
    if (state.sock2s.length && state.images.sock2) {
      const { sock2 } = state.images;
      const bounds = state.flakeBounds.sock2;
      state.sock2s.forEach((s) => {
        const bob = {
          x: s.anchor.x + s.length * Math.sin(s.angle),
          y: s.anchor.y + s.length * Math.cos(s.angle),
        };

        const dx = bob.x - s.anchor.x;
        const dy = bob.y - s.anchor.y;
        const sagBase = Math.min(16, Math.hypot(dx, dy) * 0.06);
        const sag = sagBase * (1 + Math.min(Math.abs(s.angle), 1));
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.anchor.x, s.anchor.y);
        for (let i = 1; i <= s.segments; i += 1) {
          const t = i / s.segments;
          const sagFactor = Math.sin(Math.PI * t);
          const x = s.anchor.x + dx * t;
          const y = s.anchor.y + dy * t + sag * sagFactor;
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        const scale = 0.8;
        const drawW = sock2.width * scale;
        const drawH = sock2.height * scale;
        const attachX = bounds
          ? ((bounds.minX + bounds.maxX) / 2 / sock2.width) * drawW
          : drawW / 2;
        const attachY = bounds
          ? (bounds.minY / sock2.height) * drawH
          : 0;
        ctx.save();
        ctx.translate(bob.x, bob.y);
        ctx.drawImage(sock2, -attachX, -attachY, drawW, drawH);
        ctx.restore();
      });
    }

    // Draw kendy copies with ropes
    if (state.kendys.length && state.images.kendy) {
      const { kendy } = state.images;
      const bounds = state.flakeBounds.kendy;
      state.kendys.forEach((k) => {
        const bob = {
          x: k.anchor.x + k.length * Math.sin(k.angle),
          y: k.anchor.y + k.length * Math.cos(k.angle),
        };

        const dx = bob.x - k.anchor.x;
        const dy = bob.y - k.anchor.y;
        const sagBase = Math.min(16, Math.hypot(dx, dy) * 0.06);
        const sag = sagBase * (1 + Math.min(Math.abs(k.angle), 1));
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(k.anchor.x, k.anchor.y);
        for (let i = 1; i <= k.segments; i += 1) {
          const t = i / k.segments;
          const sagFactor = Math.sin(Math.PI * t);
          const x = k.anchor.x + dx * t;
          const y = k.anchor.y + dy * t + sag * sagFactor;
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        const scale = 0.7;
        const drawW = kendy.width * scale;
        const drawH = kendy.height * scale;
        const attachX = bounds
          ? ((bounds.minX + bounds.maxX) / 2 / kendy.width) * drawW
          : drawW / 2;
        const attachY = bounds
          ? (bounds.minY / kendy.height) * drawH
          : 0;
        ctx.save();
        ctx.translate(bob.x, bob.y);
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 20;
        ctx.drawImage(kendy, -attachX, -attachY, drawW, drawH);
        ctx.restore();
      });
    }
  }

  let lastTime = performance.now();
  function tick(now) {
    const delta = Math.min(now - lastTime, 32); // cap big jumps
    stepPhysics(delta);
    drawScene();
    lastTime = now;
    requestAnimationFrame(tick);
  }

  function init() {
    if (!document.body.contains(canvas)) {
      document.body.appendChild(canvas);
    }
    resizeCanvas();
    loadAssets();
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    updateAnchors();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
