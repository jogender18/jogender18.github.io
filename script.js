const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroCard = document.querySelector('.hero-card');
const sceneCanvas = document.querySelector('.scene-canvas');
const projects = document.querySelectorAll('.project');
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const progressBar = document.querySelector('.scroll-progress');
const cursorGlow = document.querySelector('.cursor-glow');
const magneticButtons = document.querySelectorAll('.button');

function setupScene() {
  if (!sceneCanvas) return;
  const context = sceneCanvas.getContext('2d');
  if (!context) return;
  const points = Array.from({ length: 42 }, (_, index) => ({
    angle: (index / 42) * Math.PI * 2,
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
      const next = projected[(index + 1) % projected.length];
      context.strokeStyle = `rgba(216,243,106,${0.08 + point.depth * 0.14})`;
      context.lineWidth = 0.7;
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(next.x, next.y);
      context.stroke();
      context.fillStyle = `rgba(216,243,106,${0.38 + point.depth * 0.6})`;
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
  });
  heroCard?.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  });
  resize();
  frame = requestAnimationFrame(render);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
}

if (!reducedMotion) {
  setupScene();
  window.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
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
