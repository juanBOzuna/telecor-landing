// Header moderno: menú móvil, tema, progreso, hide-on-scroll, reveal, parallax, nav activo, toTop
document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('menuToggle');
  const mobile = document.getElementById('mobileNav');
  const panel  = mobile?.querySelector('nav');
  const iconOpen  = document.getElementById('iconOpen');
  const iconClose = document.getElementById('iconClose');
  const themeToggle = document.getElementById('themeToggle');
  const iconSun  = document.getElementById('iconSun');
  const iconMoon = document.getElementById('iconMoon');
  const progress = document.getElementById('scrollProgress');
  const toTop = document.getElementById('toTop');
  const metaTheme = document.getElementById('metaThemeColor');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  // --- Drawer móvil ---
  const openMenu = () => {
    if (!mobile || !panel) return;
    mobile.classList.remove('hidden');
    requestAnimationFrame(() => {
      panel.classList.remove('translate-x-full', 'opacity-0');
      panel.classList.add('translate-x-0', 'opacity-100');
    });
    toggle?.setAttribute('aria-expanded', 'true');
    iconOpen?.classList.add('hidden');
    iconClose?.classList.remove('hidden');
    body.classList.add('overflow-hidden', 'touch-none');
    mobile.setAttribute('aria-hidden', 'false');
  };

  const closeMenu = () => {
    if (!mobile || !panel) return;
    panel.classList.add('translate-x-full', 'opacity-0');
    panel.classList.remove('translate-x-0', 'opacity-100');
    toggle?.setAttribute('aria-expanded', 'false');
    iconOpen?.classList.remove('hidden');
    iconClose?.classList.add('hidden');
    body.classList.remove('overflow-hidden', 'touch-none');
    mobile.setAttribute('aria-hidden', 'true');
    setTimeout(() => mobile.classList.add('hidden'), 300);
  };

  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });

  mobile?.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeMenu();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // --- Toggle de tema (persistente + meta theme-color) ---
  const setTheme = (mode) => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      iconSun?.classList.remove('hidden');
      iconMoon?.classList.add('hidden');
      metaTheme?.setAttribute('content', '#0f172a'); // slate-900
    } else {
      root.classList.remove('dark');
      iconSun?.classList.add('hidden');
      iconMoon?.classList.remove('hidden');
      metaTheme?.setAttribute('content', '#ffffff');
    }
    localStorage.setItem('theme', mode);
  };
  const initialDark = document.documentElement.classList.contains('dark');
  setTheme(initialDark ? 'dark' : 'light');

  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  });

  // --- Efectos de scroll: sombra + hide-on-scroll + progreso lineal + toTop circular ---
  let lastY = window.scrollY;
  let ticking = false;

  const updateToTop = (ratio) => {
    if (!toTop) return;
    // Mostrar/ocultar
    if (window.scrollY > 300) {
      toTop.style.opacity = '1';
      toTop.style.transform = 'translateY(0)';
      toTop.style.pointerEvents = 'auto';
    } else {
      toTop.style.opacity = '0';
      toTop.style.transform = 'translateY(8px)';
      toTop.style.pointerEvents = 'none';
    }
    // Progreso circular
    const deg = Math.min(360, ratio * 360);
    toTop.style.setProperty('--p', `${deg}deg`);
  };

  const onScroll = () => {
    const y = window.scrollY;

    // Sombra más marcada cuando no estamos en top
    if (y > 4) header.classList.add('shadow-header'); else header.classList.remove('shadow-header');

    // Ocultar header al desplazarse hacia abajo, mostrar al subir
    const goingDown = y > lastY && y > 64;
    header.style.transform = goingDown ? 'translateY(-100%)' : 'translateY(0)';
    lastY = y;

    // Progreso de lectura
    const docH = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = docH ? Math.min(1, y / docH) : 0;
    if (progress) progress.style.width = (ratio * 100).toFixed(2) + '%';

    // Botón toTop
    updateToTop(ratio);

    ticking = false;
  };

  const onScrollRAF = () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  };
  onScroll();
  window.addEventListener('scroll', onScrollRAF, { passive: true });

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Reveal on scroll (IntersectionObserver) ---
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    revealEls.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          entry.target.classList.remove('reveal');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  // --- Nav activo por sección visible ---
  const navLinks = Array.from(document.querySelectorAll('header nav a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('main section[id], section#hero'));
  if (navLinks.length && sections.length) {
    const map = new Map(navLinks.map(a => [a.getAttribute('href'), a]));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const id = '#' + e.target.id;
        const link = map.get(id);
        if (!link) return;
        if (e.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 });
    sections.forEach(sec => sec.id && obs.observe(sec));
  }

  // --- Parallax suave del hero (si no hay reduced motion) ---
  const parallaxImg = document.querySelector('[data-parallax]');
  if (parallaxImg && !prefersReduced) {
    const parScroll = () => {
      const y = window.scrollY;
      // factor leve para no marear
      const offset = Math.max(-40, Math.min(40, y * -0.06));
      parallaxImg.style.transform = `translateY(${offset}px) scale(1.02)`;
    };
    parScroll();
    window.addEventListener('scroll', () => requestAnimationFrame(parScroll), { passive: true });
  }
});

const toggleBtn = document.getElementById('toggleProductsBtn');
if (toggleBtn) {
  const productGrid = document.getElementById('product-grid');
  const btnText = document.getElementById('toggleProductsText');
  const btnIcon = document.getElementById('toggleProductsIcon');
  const toggleableProducts = productGrid.querySelectorAll('.product-toggleable');

  let isExpanded = false;

  toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;

    toggleableProducts.forEach((product, index) => {
      product.style.transitionDelay = isExpanded ? `${index * 50}ms` : '0ms';
      
      if (isExpanded) {
        product.classList.remove('product-hidden');
        product.classList.add('reveal', 'reveal-in');
      } else {
        product.classList.add('product-hidden');
        product.classList.remove('reveal-in');
      }
    });

    btnText.textContent = isExpanded ? 'Ver menos productos' : 'Ver más productos';
    btnIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';

    setTimeout(() => {
        const sectionTop = document.getElementById('servicios').offsetTop;
        window.scrollTo({
            top: sectionTop - 64, 
            behavior: 'smooth'
        });
    }, 150); 
  });
}