// GSAP Scroll Animation & Reveal Lifecycle Manager
// Blueprint Section 5.B & 5.C

export function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !window.gsap) return;

  const gsap = window.gsap;

  // Staggered reveal of bento cards
  const cards = document.querySelectorAll('.feature-bento-card, .stat-card');
  if (cards.length > 0) {
    gsap.from(cards, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: cards[0],
        start: 'top 85%'
      }
    });
  }

  // Hero headline reveal
  const heroElements = document.querySelectorAll('.hero-subtitle, .hero-title, .hero-description, .hero-cta-group');
  if (heroElements.length > 0) {
    gsap.from(heroElements, {
      opacity: 0,
      y: 25,
      duration: 1.0,
      stagger: 0.15,
      ease: 'power3.out'
    });
  }
}
