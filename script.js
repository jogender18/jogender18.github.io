const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroCard = document.querySelector('.hero-card');
const sceneCanvas = document.querySelector('.scene-canvas');
const projects = document.querySelectorAll('.project');
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const progressBar = document.querySelector('.scroll-progress');
const cursorGlow = document.querySelector('.cursor-glow');
const magneticButtons = document.querySelectorAll('.button');
const ambientBackground = document.querySelector('.ambient-background');
const wireCanvas = document.querySelector('.wire-canvas');
const threeDScene = document.querySelector('.three-d-scene');
const mapStatus = document.querySelector('.map-status');

function setupWires() {
  if (!wireCanvas) return;
  const context = wireCanvas.getContext('2d');
  if (!context) return;
  const nodes = Array.from({ length: 30 }, (_, index) => ({
    x: (index * 97) % 1000,
    y: (index * 149) % 900,
    vx: (index % 2 ? 0.08 : -0.06),
    vy: (index % 3 ? 0.05 : -0.04),
    phase: index * 0.7,
  }));
  let targetX = 0.5;
  let targetY = 0.5;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let selectedNode = null;
  let frame;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    wireCanvas.width = window.innerWidth * ratio;
    wireCanvas.height = window.innerHeight * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    nodes.forEach((node, index) => {
      node.x = ((index * 97) % 1000) / 1000 * window.innerWidth;
      node.y = ((index * 149) % 900) / 900 * window.innerHeight;
    });
  };
  const render = (time) => {
    pointerX += (targetX - pointerX) * 0.04;
    pointerY += (targetY - pointerY) * 0.04;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < -30 || node.x > window.innerWidth + 30) node.vx *= -1;
      if (node.y < -30 || node.y > window.innerHeight + 30) node.vy *= -1;
    });
    const projected = nodes.map((node) => ({
      node,
      x: node.x + (pointerX - 0.5) * 24,
      y: node.y + (pointerY - 0.5) * 24,
    }));
    const links = [];
    projected.forEach((point, index) => {
      const nearest = projected
        .filter((candidate, candidateIndex) => candidateIndex !== index)
        .sort((a, b) => Math.hypot(point.x - a.x, point.y - a.y)
          - Math.hypot(point.x - b.x, point.y - b.y))
        .slice(0, 2);
      nearest.forEach((other) => {
        const key = [point.node, other.node].sort((a, b) => a.phase - b.phase);
        if (!links.some((link) => link[0] === key[0] && link[1] === key[1])) {
          links.push(key);
        }
      });
    });
    links.forEach(([source, destination], index) => {
      const from = projected.find((point) => point.node === source);
      const to = projected.find((point) => point.node === destination);
      if (!from || !to) return;
      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      const selected = selectedNode === source || selectedNode === destination;
      context.strokeStyle = selected
        ? 'rgba(15,118,110,.78)'
        : `rgba(20,184,166,${Math.max(.06, .25 - distance / 900)})`;
      context.lineWidth = selected ? 1.8 : 1;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      const progress = ((time * 0.00012 + index * 0.13) % 1);
      const packetX = from.x + (to.x - from.x) * progress;
      const packetY = from.y + (to.y - from.y) * progress;
      context.fillStyle = 'rgba(45,212,191,.9)';
      context.beginPath();
      context.arc(packetX, packetY, 2, 0, Math.PI * 2);
      context.fill();
    });
    projected.forEach(({ node, x, y }) => {
      context.fillStyle = selectedNode === node ? 'rgba(15,118,110,1)' : 'rgba(15,118,110,.72)';
      context.shadowColor = 'rgba(45,212,191,.55)';
      context.shadowBlur = 5;
      context.fillRect(x - 1.5, y - 1.5, 3, 3);
      context.shadowBlur = 0;
      if (selectedNode === node) {
        context.strokeStyle = 'rgba(45,212,191,.9)';
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(x, y, 10 + Math.sin(time * .005) * 2, 0, Math.PI * 2);
        context.stroke();
      }
      if (Math.sin(time * 0.002 + node.phase) > 0.96) {
        context.strokeStyle = 'rgba(45,212,191,.45)';
        context.beginPath();
        context.arc(x, y, 7, 0, Math.PI * 2);
        context.stroke();
      }
    });
    frame = requestAnimationFrame(render);
  };
  window.addEventListener('resize', resize);
  const updatePointer = (event) => {
    targetX = event.clientX / window.innerWidth;
    targetY = event.clientY / window.innerHeight;
  };
  window.addEventListener('pointermove', updatePointer, { passive: true });
  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (touch) updatePointer(touch);
  }, { passive: true });
  ambientBackground?.addEventListener('pointerdown', (event) => {
    const x = event.clientX;
    const y = event.clientY;
    const nearest = nodes
      .map((node) => ({
        node,
        distance: Math.hypot(
          node.x + (pointerX - 0.5) * 24 - x,
          node.y + (pointerY - 0.5) * 24 - y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!nearest || nearest.distance > 90) return;
    selectedNode = nearest.node;
    if (mapStatus) mapStatus.textContent = 'Connection selected — move to explore more.';
  });
  resize();
  frame = requestAnimationFrame(render);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
}

function setupScene() {
  if (!sceneCanvas) return;
  const context = sceneCanvas.getContext('2d');
  if (!context) return;
  const points = Array.from({ length: 30 }, (_, index) => ({
    angle: (index / 30) * Math.PI * 2,
    radius: 48 + (index % 5) * 11,
    depth: (index % 7) / 7,
    speed: 0.00025 + (index % 4) * 0.00008,
  }));
  let pointerX = 0;
  let pointerY = 0;
  let frame;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    sceneCanvas.width = sceneCanvas.clientWidth * ratio;
    sceneCanvas.height = sceneCanvas.clientHeight * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const render = (time) => {
    const width = sceneCanvas.clientWidth;
    const height = sceneCanvas.clientHeight;
    context.clearRect(0, 0, width, height);
    const centerX = width * (0.53 + pointerX * 0.06);
    const centerY = height * (0.4 + pointerY * 0.04);
    const projected = points.map((point) => {
      const angle = point.angle + time * point.speed;
      const scale = 0.65 + point.depth * 0.5;
      return {
        x: centerX + Math.cos(angle) * point.radius * scale,
        y: centerY + Math.sin(angle) * point.radius * 0.48 * scale,
        size: 1.5 + point.depth * 2.5,
        depth: point.depth,
      };
    });
    projected.forEach((point, index) => {
      if (index % 2 === 0) {
        const next = projected[(index + 1) % projected.length];
        context.strokeStyle = `rgba(99,230,190,${0.06 + point.depth * 0.1})`;
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
      context.fillStyle = `rgba(200,255,106,${0.3 + point.depth * 0.55})`;
      context.beginPath();
      context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      context.fill();
    });
    frame = requestAnimationFrame(render);
  };

  window.addEventListener('resize', resize);
  heroCard?.addEventListener('pointermove', (event) => {
    const bounds = heroCard.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
    threeDScene?.style.setProperty('--scene-y', `${pointerX * 18}deg`);
    threeDScene?.style.setProperty('--scene-x', `${pointerY * -18}deg`);
  });
  heroCard?.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
    threeDScene?.style.setProperty('--scene-x', '0deg');
    threeDScene?.style.setProperty('--scene-y', '0deg');
  });
  resize();
  frame = requestAnimationFrame(render);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
}

setupWires();

if (!reducedMotion) {
  setupScene();
  window.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
    if (ambientBackground) {
      const x = (event.clientX / window.innerWidth - 0.5) * 70;
      const y = (event.clientY / window.innerHeight - 0.5) * 70;
      ambientBackground.style.setProperty('--bg-x', `${x}px`);
      ambientBackground.style.setProperty('--bg-y', `${y}px`);
    }
    if (cursorGlow) {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    }
  }, { passive: true });

  magneticButtons.forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      button.style.setProperty('--mag-x', `${x * 7}px`);
      button.style.setProperty('--mag-y', `${y * 5}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mag-x', '0px');
      button.style.setProperty('--mag-y', '0px');
    });
  });

  window.addEventListener('scroll', () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && scrollable > 0) progressBar.style.transform = `scaleX(${window.scrollY / scrollable})`;
  }, { passive: true });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  heroCard?.addEventListener('pointermove', (event) => {
    const bounds = heroCard.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroCard.style.setProperty('--rotate-y', `${x * 7}deg`);
    heroCard.style.setProperty('--rotate-x', `${y * -7}deg`);
  });

  heroCard?.addEventListener('pointerleave', () => {
    heroCard.style.setProperty('--rotate-x', '0deg');
    heroCard.style.setProperty('--rotate-y', '0deg');
  });

  projects.forEach((project) => {
    project.addEventListener('pointermove', (event) => {
      const bounds = project.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      project.style.setProperty('--card-y', `${x * 2.5}deg`);
      project.style.setProperty('--card-x', `${y * -2.5}deg`);
    });

    project.addEventListener('pointerleave', () => {
      project.style.setProperty('--card-x', '0deg');
      project.style.setProperty('--card-y', '0deg');
    });
  });
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle(
      'is-active',
      link.getAttribute('href') === `#${entry.target.id}`,
    ));
  });
}, { rootMargin: '-35% 0px -55% 0px' });

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
