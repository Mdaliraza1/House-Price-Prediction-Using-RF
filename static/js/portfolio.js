document.addEventListener('DOMContentLoaded', function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navOverlay = document.getElementById('navOverlay');
    const backToTop = document.getElementById('backToTop');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('[data-section-id]');
    const cursorGlow = document.getElementById('cursorGlow');

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
            if (mainNav.classList.contains('open')) closeMobileMenu();
            else openMobileMenu();
        });
    }

    if (navOverlay) navOverlay.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                closeMobileMenu();
                const top = target.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    /* Scroll reveal with stagger */
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
        el.style.transitionDelay = (i % 6) * 0.07 + 's';
        revealObserver.observe(el);
    });

    function updateActiveNav() {
        let current = '';
        sections.forEach(function (section) {
            if (window.scrollY >= section.offsetTop - 120) {
                current = section.getAttribute('data-section-id');
            }
        });
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-section') === current);
        });
    }

    /* Typing effect */
    const taglineEl = document.getElementById('typingTagline');
    if (taglineEl) {
        const phrases = [
            'LLM-powered AI microservices',
            'FastAPI · PostgreSQL · asyncpg',
            'Rules-first + LLM pipelines',
            'Django · AWS · Docker',
        ];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typeEffect() {
            const current = phrases[phraseIndex];
            taglineEl.textContent = isDeleting
                ? current.substring(0, charIndex - 1)
                : current.substring(0, charIndex + 1);
            charIndex += isDeleting ? -1 : 1;

            let delay = isDeleting ? 36 : 68;
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

    /* Count-up stats */
    document.querySelectorAll('[data-count]').forEach(function (el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        let start = null;

        function animateCount(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / 1500, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(animateCount);
        }

        const countObserver = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                requestAnimationFrame(animateCount);
                countObserver.disconnect();
            }
        }, { threshold: 0.5 });
        countObserver.observe(el);
    });

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ========== 3D INTERACTIONS ========== */
    if (prefersReduced || isTouch) {
        window.addEventListener('scroll', function () {
            updateActiveNav();
            if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
        }, { passive: true });
        updateActiveNav();
        return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;
    let scrollY = window.scrollY;
    let ticking = false;

    /* Soft cursor glow */
    if (cursorGlow) {
        document.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorGlow.classList.add('active');
        }, { passive: true });

        document.addEventListener('mouseleave', function () {
            cursorGlow.classList.remove('active');
        });
    }

    /* 3D tilt cards with shine */
    function initTilt(card) {
        const shine = card.querySelector('.tilt-shine');
        const maxTilt = card.id === 'heroCard' ? 12 : 8;

        card.addEventListener('mousemove', function (e) {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotY = (x - 0.5) * maxTilt * 2;
            const rotX = (0.5 - y) * maxTilt * 2;

            card.style.transform =
                'perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateZ(12px) scale(1.02)';

            if (shine) {
                shine.style.opacity = '1';
                shine.style.background =
                    'radial-gradient(circle at ' + (x * 100) + '% ' + (y * 100) + '%, rgba(255,255,255,0.22), transparent 55%)';
            }
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
            if (shine) shine.style.opacity = '0';
        });
    }

    document.querySelectorAll('.tilt-card').forEach(initTilt);

    /* Magnetic buttons */
    document.querySelectorAll('.magnetic-btn').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = 'translate(' + (x * 0.22) + 'px, ' + (y * 0.22) + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
            btn.style.transform = '';
        });
    });

    /* Parallax depth layers */
    const depthEls = document.querySelectorAll('[data-depth]');

    function updateParallax() {
        const cx = (mouseX / window.innerWidth - 0.5) * 2;
        const cy = (mouseY / window.innerHeight - 0.5) * 2;
        const scrollFactor = Math.min(scrollY / 600, 1);

        depthEls.forEach(function (el) {
            const depth = parseFloat(el.getAttribute('data-depth')) || 0.1;
            const tx = cx * depth * -40;
            const ty = cy * depth * -30 + scrollFactor * depth * 40;

            if (el.classList.contains('orb') || el.classList.contains('float-shape')) {
                el.style.setProperty('--px', tx + 'px');
                el.style.setProperty('--py', ty + 'px');
            } else if (!el.classList.contains('tilt-card')) {
                el.style.transform = 'translate3d(' + tx + 'px, ' + ty + 'px, 0)';
            }
        });
    }

    function animateFrame() {
        glowX += (mouseX - glowX) * 0.12;
        glowY += (mouseY - glowY) * 0.12;

        if (cursorGlow && cursorGlow.classList.contains('active')) {
            cursorGlow.style.transform =
                'translate(' + (glowX - 180) + 'px, ' + (glowY - 180) + 'px)';
        }

        updateParallax();
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(animateFrame);
            ticking = true;
        }
    }

    document.addEventListener('mousemove', requestTick, { passive: true });

    window.addEventListener('scroll', function () {
        scrollY = window.scrollY;
        updateActiveNav();
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 500);
        requestTick();
    }, { passive: true });

    updateActiveNav();
});
