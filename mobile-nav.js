/**
 * mobile-nav.js — Graha Tracker Mobile Navigation
 * Auto-injects: sticky bottom nav, More drawer, PWA registration,
 * and handles mobile interaction.
 */
(function () {
    'use strict';

    const PAGE_MAP = {
        'index.html': 'home', '': 'home',
        'transit-calendar.html': 'calendar',
        'transit-calendar': 'calendar',
    };

    const NAV_ITEMS = [
        { key: 'home', icon: '🪐', label: 'Live Lagna', href: 'index.html' },
        { key: 'calendar', icon: '📅', label: '5-Yr Transit', href: 'transit-calendar.html' },
        { key: 'retrograde', icon: '⚠️', label: 'Vakri Alerts', href: 'transit-calendar.html?filter=retrograde' },
        { key: 'more', icon: '☰', label: 'More', href: '#more', isMore: true },
    ];

    const MORE_ITEMS = [
        { icon: '🏛️', label: 'Lagna Kundali', href: 'index.html' },
        { icon: '⭐', label: 'Navagraha Cards', href: 'index.html#navagraha' },
        { icon: '📅', label: '5-Year Matrix', href: 'transit-calendar.html' },
        { icon: '⚡', label: 'Pivotal Epochs', href: 'transit-calendar.html#epochs' },
        { icon: '♃', label: 'Guru Gochar', href: 'transit-calendar.html?graha=guru' },
        { icon: '♄', label: 'Shani Gochar', href: 'transit-calendar.html?graha=shani' },
        { icon: '☊', label: 'Rahu-Ketu', href: 'transit-calendar.html?graha=nodes' },
        { icon: '🔴', label: 'Mangal Transit', href: 'transit-calendar.html?graha=mangal' },
    ];

    function getActiveKey() {
        const filename = window.location.pathname.split('/').pop() || '';
        for (const [pattern, key] of Object.entries(PAGE_MAP)) {
            if (filename === pattern || filename.includes(pattern.replace('.html', ''))) return key;
        }
        return 'home';
    }

    function addRipple(el, e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = el.getBoundingClientRect();
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const size = Math.max(rect.width, rect.height) * 0.6;
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${(touch.clientX - rect.left) - size / 2}px;top:${(touch.clientY - rect.top) - size / 2}px;`;
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 550);
    }

    function injectNav() {
        // If bottom nav is already present in custom template, wire its events
        const existingNav = document.querySelector('nav[data-graha-nav="custom"]');
        if (existingNav) return;

        const activeKey = getActiveKey();

        const nav = document.createElement('nav');
        nav.className = 'mob-nav';
        nav.setAttribute('aria-label', 'Main navigation');
        nav.innerHTML = `
            <div class="mob-nav__inner">
                ${NAV_ITEMS.map(item => `
                    <${item.isMore ? 'button' : 'a'}
                        ${item.isMore ? '' : `href="${item.href}"`}
                        class="mob-nav__item${activeKey === item.key ? ' active' : ''}"
                        ${item.isMore ? 'id="mobMoreBtn" aria-label="More pages"' : `aria-label="${item.label}"`}
                        ${activeKey === item.key ? 'aria-current="page"' : ''}>
                        <span class="mob-nav__icon">${item.icon}</span>
                        <span class="mob-nav__label">${item.label}</span>
                    </${item.isMore ? 'button' : 'a'}>
                `).join('')}
            </div>`;

        const drawer = document.createElement('div');
        drawer.className = 'mob-more-drawer';
        drawer.id = 'mobMoreDrawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-label', 'More features');
        drawer.innerHTML = `
            <button class="mob-more-close" id="mobDrawerClose" aria-label="Close menu">✕</button>
            <div class="mob-more-title" style="padding: 10px 15px; font-weight: bold; color: #785a00;">Graha Tracker • ग्रह मंडल</div>
            <div class="mob-more-grid">
                ${MORE_ITEMS.map(i => `<a href="${i.href}" class="mob-more-item"><span class="mob-more-item__icon">${i.icon}</span><span class="mob-more-item__label">${i.label}</span></a>`).join('')}
            </div>`;

        const backdrop = document.createElement('div');
        backdrop.className = 'mob-more-backdrop';
        backdrop.id = 'mobMoreBackdrop';

        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        document.body.appendChild(nav);

        const moreBtn = document.getElementById('mobMoreBtn');
        const closeBtn = document.getElementById('mobDrawerClose');

        const openDrawer = () => { drawer.classList.add('open'); backdrop.classList.add('open'); moreBtn && moreBtn.classList.add('active'); };
        const closeDrawer = () => { drawer.classList.remove('open'); backdrop.classList.remove('open'); moreBtn && moreBtn.classList.remove('active'); };

        moreBtn && moreBtn.addEventListener('click', function (e) { addRipple(this, e); drawer.classList.contains('open') ? closeDrawer() : openDrawer(); });
        closeBtn && closeBtn.addEventListener('click', closeDrawer);
        backdrop.addEventListener('click', closeDrawer);

        nav.querySelectorAll('.mob-nav__item').forEach(item => {
            item.addEventListener('touchstart', e => addRipple(item, e), { passive: true });
            item.addEventListener('click', e => addRipple(item, e));
        });
    }

    function registerPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(r => console.log('✅ Graha Tracker PWA:', r.scope))
                    .catch(e => console.warn('SW skipped:', e.message));
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { injectNav(); registerPWA(); });
    } else {
        injectNav();
        registerPWA();
    }
})();
