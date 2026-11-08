const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroCard = document.querySelector('.hero-card');
const projects = document.querySelectorAll('.project');
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];

if (!reducedMotion) {
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
