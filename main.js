/* ===== DOUBLED ROOK — main.js ===== */

// Nav scroll effect
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// Mobile menu toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.getElementById('navLinks');
if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });
  // Close on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('show');
    });
  });
}

// Reveal on scroll
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Stagger children animations
const staggerObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const children = entry.target.querySelectorAll(
        '.pain-item, .service-card, .case-card, .service-tag, .hotel-type, .faq-item'
      );
      children.forEach((child, i) => {
        child.style.opacity = '0';
        child.style.transform = 'translateY(14px)';
        child.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
        child.style.transitionDelay = `${i * 0.05}s`;
        requestAnimationFrame(() => {
          child.style.opacity = '1';
          child.style.transform = 'translateY(0)';
        });
      });
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.pain-grid, .services-grid, .cases-grid, .service-tags, .hotel-types, .faq-grid'
).forEach(el => staggerObserver.observe(el));

// Theme toggle
function updateThemeButtons(label) {
  document.querySelectorAll('.theme-toggle, .mobile-theme-toggle').forEach(btn => {
    btn.textContent = label;
  });
}

function toggleTheme() {
  const body = document.body;
  if (body.dataset.theme === 'espresso') {
    body.dataset.theme = 'moss';
    updateThemeButtons('Espresso');
    localStorage.setItem('dr-theme', 'moss');
  } else {
    body.dataset.theme = 'espresso';
    updateThemeButtons('Moss');
    localStorage.setItem('dr-theme', 'espresso');
  }
}

// Restore saved theme
(function() {
  const saved = localStorage.getItem('dr-theme');
  if (saved) {
    document.body.dataset.theme = saved;
    updateThemeButtons(saved === 'moss' ? 'Espresso' : 'Moss');
  }
})();

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== BELL BUTTON + FORM HANDLING =====
function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const btn = document.getElementById('bellBtn');
  if (!form || !btn) return;

  // Validate
  const name = form.querySelector('[name="name"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const property = form.querySelector('[name="property"]').value.trim();
  const message = form.querySelector('[name="message"]').value.trim();
  if (!name || !email) return;

  // Send form data to Formspree
  fetch('https://formspree.io/f/mzdkerkq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ name, email, property, message })
  }).catch(() => {});

  // Trigger bell ding animation
  btn.classList.remove('dinged');
  void btn.offsetWidth; // force reflow
  btn.classList.add('dinged');

  // Create sparkle particles around the bell
  const bellIcon = btn.querySelector('.bell-icon');
  const rect = bellIcon.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const spark = document.createElement('span');
    spark.className = 'bell-ring-line';
    const angle = (i / 6) * Math.PI * 2;
    const dist = 16 + Math.random() * 10;
    const x = (rect.left - btnRect.left) + rect.width / 2 + Math.cos(angle) * dist - 2;
    const y = (rect.top - btnRect.top) + rect.height / 2 + Math.sin(angle) * dist - 2;
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    spark.style.animationDelay = (i * 0.05) + 's';
    btn.appendChild(spark);
    setTimeout(() => spark.remove(), 800);
  }

  // After animation, show success state
  setTimeout(() => {
    const formParent = form.parentElement;
    form.remove();
    formParent.innerHTML = `
      <div class="form-success">
        <div class="bell-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            <line x1="12" y1="2" x2="12" y2="4" opacity="0.5"/>
          </svg>
        </div>
        <h3>We heard the bell</h3>
        <p>Thank you, ${name}. We'll be in touch within a business day.</p>
      </div>
    `;
  }, 900);

}
