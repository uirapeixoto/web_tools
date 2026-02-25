document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === '/' && currentPath === '/') return;
    if (href !== '/' && currentPath.endsWith(href)) {
      link.setAttribute('aria-current', 'page');
    }
  });
});

