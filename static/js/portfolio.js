document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navOverlay = document.getElementById('navOverlay');
    const backToTop = document.getElementById('backToTop');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('[data-section-id]');

    function closeMobileMenu() {
        if (menuToggle) menuToggle.classList.remove('open');
        if (mainNav) mainNav.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        if (menuToggle) menuToggle.classList.add('open');
        if (mainNav) mainNav.classList.add('open');
        if (navOverlay) navOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            if (mainNav.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileMenu);
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                closeMobileMenu();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll(
        '.section, .skill-card, .timeline-item, .project-card, .info-card'
    ).forEach(function (el, i) {
        el.style.transitionDelay = (i % 6) * 0.06 + 's';
        revealObserver.observe(el);
    });

    function updateActiveNav() {
        let current = '';
        sections.forEach(function (section) {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.getAttribute('data-section-id');
            }
        });
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-section') === current);
        });
    }

    window.addEventListener('scroll', function () {
        updateActiveNav();
        if (backToTop) {
            backToTop.classList.toggle('visible', window.scrollY > 500);
        }
    }, { passive: true });

    updateActiveNav();

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const taglineEl = document.getElementById('typingTagline');
    if (taglineEl) {
        const phrases = [
            'LLM-powered AI microservices',
            'FastAPI · PostgreSQL · asyncpg',
            'Rules-first + LLM pipelines',
            'Django · AWS · Docker',
            'Available for freelance work',
        ];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typeEffect() {
            const current = phrases[phraseIndex];
            if (isDeleting) {
                taglineEl.textContent = current.substring(0, charIndex - 1);
                charIndex--;
            } else {
                taglineEl.textContent = current.substring(0, charIndex + 1);
                charIndex++;
            }

            let delay = isDeleting ? 40 : 70;

            if (!isDeleting && charIndex === current.length) {
                delay = 2200;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                delay = 400;
            }

            setTimeout(typeEffect, delay);
        }

        setTimeout(typeEffect, 800);
    }

    document.querySelectorAll('[data-count]').forEach(function (el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1500;
        let start = null;

        function animateCount(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) {
                requestAnimationFrame(animateCount);
            }
        }

        const countObserver = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                requestAnimationFrame(animateCount);
                countObserver.disconnect();
            }
        }, { threshold: 0.5 });

        countObserver.observe(el);
    });
});
