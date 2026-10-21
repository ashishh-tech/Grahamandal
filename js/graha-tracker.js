/**
 * graha-tracker.js — Live Graha Dashboard & Dynamic Kundali Engine
 * Connects VedicAstrologyEngine to UI:
 * - Real-time planetary positions (degrees, minutes, seconds)
 * - Real-time rising Lagna (Ascendant) & LST
 * - Dynamic North Indian Diamond & South Indian Kundali SVG rendering
 * - Nakshatra, Pada, Dignity (Uccha, Neecha, Moolatrikona, Swarashi, Mitra, Shatru, Gandanta)
 * - Margi/Vakri (Direct/Retrograde) detection
 * - Bilingual ENG/हिंदी support & Date Time Picker
 */

(function () {
    'use strict';

    // Global state
    const state = {
        lang: 'ENG',
        chartStyle: 'north', // 'north' or 'south'
        currentDate: new Date(),
        isLive: true,
        coords: { lat: 28.6139, lon: 77.2090, city: 'New Delhi, India' },
        engine: null,
        chartRenderer: null
    };

    // Constant mappings
    const RASHIS_ENG = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const RASHIS_HIN = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
    
    const PLANET_META = {
        sun: { nameEng: 'Sun', nameHin: 'सूर्य', titleEng: 'Surya', symbol: '☉', emoji: '☀️', roleEng: 'Atmakaraka (Soul)', roleHin: 'आत्मकारक (आत्मा)' },
        moon: { nameEng: 'Moon', nameHin: 'चन्द्र', titleEng: 'Chandra', symbol: '☽', emoji: '🌙', roleEng: 'Manas (Mind)', roleHin: 'मनःकारक (मन)' },
        mars: { nameEng: 'Mars', nameHin: 'मंगल', titleEng: 'Mangal', symbol: '♂', emoji: '🔴', roleEng: 'Bhratrukaraka (Courage)', roleHin: 'भ्रातृकारक (साहस)' },
        mercury: { nameEng: 'Mercury', nameHin: 'बुध', titleEng: 'Budha', symbol: '☿', emoji: '💚', roleEng: 'Buddhi (Intellect)', roleHin: 'बुद्धिकारक (वाणी/बुद्धि)' },
        jupiter: { nameEng: 'Jupiter', nameHin: 'बृहस्पति', titleEng: 'Guru', symbol: '♃', emoji: '🟡', roleEng: 'Dharma & Wisdom', roleHin: 'धर्म व ज्ञानकारक' },
        venus: { nameEng: 'Venus', nameHin: 'शुक्र', titleEng: 'Shukra', symbol: '♀', emoji: '💗', roleEng: 'Kalatrakaraka (Love & Arts)', roleHin: 'कलत्रकारक (सौंदर्य/प्रेम)' },
        saturn: { nameEng: 'Saturn', nameHin: 'शनि', titleEng: 'Shani', symbol: '♄', emoji: '💙', roleEng: 'Karmakaraka (Destiny)', roleHin: 'कर्मकारक (न्याय/कर्म)' },
        rahu: { nameEng: 'Rahu', nameHin: 'राहु', titleEng: 'Rahu', symbol: '☊', emoji: '🟣', roleEng: 'North Node (Desire)', roleHin: 'छाया ग्रह (उत्तरी ध्रुव)' },
        ketu: { nameEng: 'Ketu', nameHin: 'केतु', titleEng: 'Ketu', symbol: '☋', emoji: '⬛', roleEng: 'South Node (Moksha)', roleHin: 'मोक्षकारक (दक्षिण ध्रुव)' }
    };

    const NAKSHATRAS_HIN = [
        'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा',
        'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी',
        'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
        'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा',
        'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'
    ];

    const HOUSE_NAMES_ENG = [
        '1st House (Lagna)', '2nd House (Dhana)', '3rd House (Sahaja)',
        '4th House (Sukha)', '5th House (Putra)', '6th House (Shatru)',
        '7th House (Kalatra)', '8th House (Ayur)', '9th House (Bhagya)',
        '10th House (Karma)', '11th House (Labha)', '12th House (Vyaya)'
    ];

    const HOUSE_NAMES_HIN = [
        'प्रथम भाव (लग्न)', 'द्वितीय भाव (धन)', 'तृतीय भाव (सहज)',
        'चतुर्थ भाव (सुख)', 'पंचम भाव (पुत्र/विद्या)', 'षष्ठ भाव (रिपु/शत्रु)',
        'सप्तम भाव (कलत्र/विवाह)', 'अष्टम भाव (आयु/गूढ़)', 'नवम भाव (भाग्य)',
        'दशम भाव (कर्म)', 'एकादश भाव (लाभ)', 'द्वादश भाव (व्यय/मोक्ष)'
    ];

    function formatDMS(deg) {
        const d = Math.floor(deg);
        const remM = (deg - d) * 60;
        const m = Math.floor(remM);
        const s = Math.floor((remM - m) * 60);
        return `${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
    }

    function getLocalDateString(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function getLocalTimeString(d) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    function checkGandanta(longitude) {
        // Gandanta occurs at the junctions of water and fire signs:
        // Pisces(356°-360°) - Aries(0°-3°20')
        // Cancer(116°40'-120°) - Leo(120°-123°20')
        // Scorpio(236°40'-240°) - Sagittarius(240°-243°20')
        const junctions = [0, 120, 240];
        for (const j of junctions) {
            let diff = Math.abs(longitude - j);
            if (diff > 180) diff = 360 - diff;
            if (diff <= 3.333) return true;
        }
        return false;
    }

    function calculateCelestialState(date) {
        if (!state.engine) {
            state.engine = new VedicAstrologyEngine();
        }

        const engine = state.engine;
        const jd = engine.calculateJulianDate(date);
        const t = (jd - 2451545.0) / 36525.0;
        const ayanamsa = engine.calculatePreciseAyanamsa(t);
        const planets = engine.calculatePrecisePlanets(t, ayanamsa);
        const ascendant = engine.calculatePreciseAscendant(jd, t, ayanamsa, state.coords.lat, state.coords.lon);
        const planetaryDetails = engine.getPlanetaryDetails(planets, ascendant);

        // Calculate LST
        let gmst = engine.normalize(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t);
        const lstDeg = engine.normalize(gmst + state.coords.lon);
        const lstHours = lstDeg / 15.0;
        const lstH = Math.floor(lstHours);
        const lstM = Math.floor((lstHours - lstH) * 60);
        const lstS = Math.floor(((lstHours - lstH) * 60 - lstM) * 60);
        const lstStr = `${String(lstH).padStart(2, '0')}h ${String(lstM).padStart(2, '0')}m ${String(lstS).padStart(2, '0')}s`;

        // Calculate Lagna Nakshatra
        const ascNak = engine.getNakshatra(ascendant);

        return {
            date,
            jd,
            t,
            ayanamsa,
            ascendant,
            ascNak,
            lstStr,
            planets,
            planetaryDetails
        };
    }

    // Render Dynamic SVG North Indian Kundali with AstroPsycho Symmetry & Layout
    function renderNorthIndianSVG(ascendant, planetaryDetails) {
        const size = 600;
        const padding = 24;
        const chartSize = size - (padding * 2); // 552
        const ascendantSign = Math.floor(ascendant / 30) + 1; // 1-indexed

        // Handpicked outer perimeter tip/corner positions with perfect 12-fold symmetry and zero collision
        const rashiPos = [
            { x: 300, y: 52 },   // H1  — top tip of upper diamond
            { x: 145, y: 50 },   // H2  — top edge of top-left triangle
            { x: 45, y: 75 },    // H3  — upper corner of left triangle (safe from center planets)
            { x: 80, y: 300 },   // H4  — left tip of left diamond
            { x: 45, y: 525 },   // H5  — lower corner of left triangle (safe from center planets)
            { x: 145, y: 550 },  // H6  — bottom edge of bottom-left triangle
            { x: 300, y: 550 },  // H7  — bottom tip of lower diamond
            { x: 455, y: 550 },  // H8  — bottom edge of bottom-right triangle
            { x: 555, y: 525 },  // H9  — lower corner of right triangle (safe from center planets)
            { x: 520, y: 300 },  // H10 — right tip of right diamond
            { x: 555, y: 75 },   // H11 — upper corner of right triangle (safe from center planets)
            { x: 455, y: 50 }    // H12 — top edge of top-right triangle
        ];

        // Planet render zones — centroid of each house where planets are vertically centered
        const zones = [
            { x: 300, y: 198 },  // H1 (Top Center diamond)
            { x: 150, y: 110 },  // H2 (Top Left triangle)
            { x: 105, y: 165 },  // H3 (Left Upper triangle)
            { x: 195, y: 300 },  // H4 (Left Center diamond)
            { x: 105, y: 435 },  // H5 (Left Lower triangle)
            { x: 150, y: 490 },  // H6 (Bottom Left triangle)
            { x: 300, y: 402 },  // H7 (Bottom Center diamond)
            { x: 450, y: 490 },  // H8 (Bottom Right triangle)
            { x: 495, y: 435 },  // H9 (Right Lower triangle)
            { x: 405, y: 300 },  // H10 (Right Center diamond)
            { x: 495, y: 165 },  // H11 (Right Upper triangle)
            { x: 450, y: 110 }   // H12 (Top Right triangle)
        ];

        const shortCodes = {
            sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me',
            jupiter: 'Ju', venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke'
        };

        const ascDegInSign = ascendant % 30;
        const ascDeg = Math.floor(ascDegInSign);
        const ascMin = Math.floor((ascDegInSign % 1) * 60);

        let houseContentMarkup = '';

        for (let i = 0; i < 12; i++) {
            const houseNum = i + 1;
            const signNumber = ((ascendantSign + i - 1) % 12) + 1;
            const rp = rashiPos[i];
            const zone = zones[i];
            const isLagnaHouse = (i === 0);

            // 1. Draw Rashi number at fixed outer corner position (AstroPsycho layout)
            houseContentMarkup += `
                <text x="${rp.x}" y="${rp.y}" font-family="'Cinzel', 'Noto Serif', serif" font-size="${isLagnaHouse ? '17' : '15'}" font-weight="700" fill="${isLagnaHouse ? '#785A00' : '#8A7A56'}" text-anchor="middle" dominant-baseline="middle">${signNumber}</text>
            `;

            // 2. Collect items (Lagna marker for House 1 + planets)
            const items = [];
            if (isLagnaHouse) {
                items.push({
                    isLagna: true,
                    code: 'Lg',
                    deg: ascDeg,
                    min: ascMin
                });
            }

            for (const [p, d] of Object.entries(planetaryDetails)) {
                if (d.house === houseNum) {
                    items.push({
                        isLagna: false,
                        planet: p,
                        code: shortCodes[p] || p.substring(0, 2).toUpperCase(),
                        deg: Math.floor(d.degree),
                        min: Math.floor((d.degree % 1) * 60),
                        status: d.status,
                        isRetrograde: d.isRetrograde || p === 'rahu' || p === 'ketu'
                    });
                }
            }

            if (items.length === 0) continue;

            const lineHeight = 21;
            const totalHeight = items.length * lineHeight;
            let startY = zone.y - (totalHeight / 2) + (lineHeight / 2);

            items.forEach(item => {
                if (item.isLagna) {
                    houseContentMarkup += `
                        <text x="${zone.x}" y="${startY}" text-anchor="middle" dominant-baseline="central">
                            <tspan font-family="'Cinzel', 'Noto Serif', serif" font-weight="800" font-size="15" fill="#785A00">Lg</tspan>
                            <tspan font-family="Inter, sans-serif" font-weight="600" font-size="11" fill="#785A00" dx="4">${item.deg}°${String(item.min).padStart(2, '0')}'</tspan>
                        </text>
                    `;
                } else {
                    let suffixMarkup = '';
                    if (item.status === 'Exalted') {
                        suffixMarkup = '<tspan fill="#059669" font-weight="bold"> ↑</tspan>';
                    } else if (item.status === 'Debilitated') {
                        suffixMarkup = '<tspan fill="#DC2626" font-weight="bold"> ↓</tspan>';
                    }
                    if (item.isRetrograde) {
                        suffixMarkup += '<tspan fill="#DC2626" font-weight="bold"> ℞</tspan>';
                    }

                    houseContentMarkup += `
                        <text x="${zone.x}" y="${startY}" text-anchor="middle" dominant-baseline="central">
                            <tspan font-family="Inter, sans-serif" font-weight="700" font-size="15" fill="#151528">${item.code}</tspan>${suffixMarkup}
                            <tspan font-family="Inter, sans-serif" font-weight="500" font-size="11" fill="#525166" dx="4">${item.deg}°${String(item.min).padStart(2, '0')}'</tspan>
                        </text>
                    `;
                }
                startY += lineHeight;
            });
        }

        return `
            <svg viewBox="-2 -2 604 604" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="lagnaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#C59820" stop-opacity="0.16"/>
                        <stop offset="100%" stop-color="#FAF8F5" stop-opacity="0.6"/>
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="600" height="600" rx="12" fill="#FAF8F5"/>
                <!-- 1st House Highlight (Lagna) -->
                <polygon points="300,24 438,162 300,300 162,162" fill="url(#lagnaGlow)"/>
                <!-- Outer Border -->
                <rect x="24" y="24" width="552" height="552" fill="none" stroke="#C59820" stroke-width="2" stroke-opacity="0.85"/>
                <!-- Inner Decorative Inset Border -->
                <rect x="29" y="29" width="542" height="542" fill="none" stroke="#C59820" stroke-width="0.8" stroke-opacity="0.25"/>
                <!-- Inscribed Center Diamond -->
                <path d="M300,24 L576,300 L300,576 L24,300 Z" fill="none" stroke="#C59820" stroke-width="2" stroke-opacity="0.85"/>
                <!-- Major Corner Diagonals -->
                <line x1="24" y1="24" x2="576" y2="576" stroke="#C59820" stroke-width="2" stroke-opacity="0.85"/>
                <line x1="576" y1="24" x2="24" y2="576" stroke="#C59820" stroke-width="2" stroke-opacity="0.85"/>
                <!-- House Content (Rashi numbers & Planets) -->
                ${houseContentMarkup}
            </svg>
        `;
    }

    // Render South Indian Square Chart
    function renderSouthIndianSVG(ascendant, planetaryDetails) {
        // South Indian chart has fixed signs (Aries is top-2nd, clockwise)
        const cellCoords = [
            { r: 0, c: 1, sign: 1 },  // Aries
            { r: 0, c: 2, sign: 2 },  // Taurus
            { r: 0, c: 3, sign: 3 },  // Gemini
            { r: 1, c: 3, sign: 4 },  // Cancer
            { r: 2, c: 3, sign: 5 },  // Leo
            { r: 3, c: 3, sign: 6 },  // Virgo
            { r: 3, c: 2, sign: 7 },  // Libra
            { r: 3, c: 1, sign: 8 },  // Scorpio
            { r: 3, c: 0, sign: 9 },  // Sagittarius
            { r: 2, c: 0, sign: 10 }, // Capricorn
            { r: 1, c: 0, sign: 11 }, // Aquarius
            { r: 0, c: 0, sign: 12 }, // Pisces
        ];

        const ascSign = Math.floor(ascendant / 30) + 1;
        const size = 400;
        const cell = size / 4;

        // Group planets by sidereal sign (1 to 12)
        const signPlanets = Array.from({ length: 13 }, () => []);
        for (const [p, d] of Object.entries(planetaryDetails)) {
            const s = Math.floor(d.longitude / 30) + 1;
            signPlanets[s].push({ planet: p, details: d });
        }

        const shortCodes = {
            sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me',
            jupiter: 'Ju', venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke'
        };

        let cellsMarkup = '';
        cellCoords.forEach(item => {
            const x = item.c * cell;
            const y = item.r * cell;
            const isLagna = (item.sign === ascSign);

            cellsMarkup += `
                <rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${isLagna ? '#FFF9E6' : '#FAF8F5'}" stroke="#C59820" stroke-width="1.2"/>
                <text x="${x + 8}" y="${y + 16}" font-family="'Noto Serif', serif" font-size="11" font-weight="700" fill="${isLagna ? '#785A00' : '#807663'}">${item.sign} ${isLagna ? '(Lg)' : ''}</text>
            `;

            const list = signPlanets[item.sign];
            if (list && list.length > 0) {
                list.forEach((pItem, idx) => {
                    const code = shortCodes[pItem.planet] || pItem.planet.substring(0, 2);
                    const deg = Math.floor(pItem.details.degree);
                    const retro = pItem.details.isRetrograde ? '℞' : '';
                    cellsMarkup += `
                        <text x="${x + cell / 2}" y="${y + 36 + (idx * 16)}" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#151528" text-anchor="middle">
                            ${code} ${deg}° ${retro}
                        </text>
                    `;
                });
            }
        });

        return `
            <svg viewBox="0 0 400 400" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="400" rx="8" fill="#FAF8F5"/>
                <!-- Center Empty Space -->
                <rect x="${cell}" y="${cell}" width="${cell * 2}" height="${cell * 2}" fill="#F5F3F0" stroke="#C59820" stroke-width="1"/>
                <text x="200" y="195" font-family="'Noto Serif', serif" font-size="16" font-weight="700" fill="#785A00" text-anchor="middle">दक्षिण भारतीय</text>
                <text x="200" y="215" font-family="Inter, sans-serif" font-size="12" fill="#63627A" text-anchor="middle">South Indian Kundali</text>
                ${cellsMarkup}
            </svg>
        `;
    }

    // Render 9 Navagraha Cards List
    function renderGrahaCards(data) {
        const container = document.getElementById('graha-cards-container');
        if (!container) return;

        const pOrder = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
        let html = '';

        pOrder.forEach(p => {
            const meta = PLANET_META[p];
            const d = data.planetaryDetails[p];
            if (!d) return;

            const signIdx = Math.floor(d.longitude / 30);
            const rashiEng = RASHIS_ENG[signIdx];
            const rashiHin = RASHIS_HIN[signIdx];
            const degInSign = d.degree;
            const pct = ((degInSign / 30) * 100).toFixed(1);
            const dms = formatDMS(degInSign);

            const nak = state.engine.getNakshatra(d.longitude);
            const nakHin = NAKSHATRAS_HIN[nak.index] || nak.name;

            const isVakri = d.isRetrograde || p === 'rahu' || p === 'ketu';
            const isGandanta = checkGandanta(d.longitude);

            // Dignity badge formatting
            let dignityBadge = '';
            if (isGandanta) {
                dignityBadge = `<span class="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-sm text-label-sm font-semibold flex items-center gap-0.5">⚠️ Gandanta Junction</span>`;
            } else if (d.status === 'Exalted') {
                dignityBadge = `<span class="px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">${state.lang === 'HIN' ? 'उच्च' : 'Exalted / उच्च'}</span>`;
            } else if (d.status === 'Debilitated') {
                dignityBadge = `<span class="px-2 py-0.5 rounded-full bg-retrograde-ruby/15 text-retrograde-ruby font-label-sm text-label-sm font-semibold">${state.lang === 'HIN' ? 'नीच' : 'Debilitated / नीच'}</span>`;
            } else if (d.status === 'Moolatrikona') {
                dignityBadge = `<span class="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm font-semibold">${state.lang === 'HIN' ? 'मूलत्रिकोण' : 'Moolatrikona'}</span>`;
            } else if (d.status === 'Own Sign') {
                dignityBadge = `<span class="px-2 py-0.5 rounded-full bg-secondary-container/30 text-secondary font-label-sm text-label-sm font-semibold">${state.lang === 'HIN' ? 'स्वराशि' : 'Own Sign / स्वराशि'}</span>`;
            } else if (d.relationship === 'Friend' || d.relationship === 'Great Friend') {
                dignityBadge = `<span class="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm font-semibold">${state.lang === 'HIN' ? 'मित्र' : 'Friend / मित्र'}</span>`;
            } else {
                dignityBadge = `<span class="px-2 py-0.5 rounded-full bg-surface-container-high text-muted-lavender font-label-sm text-label-sm font-semibold">${state.lang === 'HIN' ? 'सम' : 'Neutral / सम'}</span>`;
            }

            const motionBadge = isVakri
                ? `<span class="px-2 py-0.5 rounded-full bg-retrograde-ruby/15 text-retrograde-ruby font-label-sm text-label-sm font-bold">${state.lang === 'HIN' ? 'वक्री ℞' : 'वक्री Retrograde ℞'}</span>`
                : `<span class="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm font-semibold">${state.lang === 'HIN' ? 'मार्गी' : 'मार्गी Direct'}</span>`;

            const houseName = state.lang === 'HIN' ? HOUSE_NAMES_HIN[d.house - 1] : HOUSE_NAMES_ENG[d.house - 1];
            const titleDisplay = state.lang === 'HIN' ? `${meta.nameHin} (${meta.titleEng})` : `${meta.nameHin} • ${meta.nameEng}`;
            const roleDisplay = state.lang === 'HIN' ? meta.roleHin : meta.roleEng;
            const rashiDisplay = state.lang === 'HIN' ? `${rashiHin} (${rashiEng})` : `${rashiHin} (${rashiEng})`;

            // Color bar theme
            let barColor = 'bg-primary-container';
            if (isVakri) barColor = 'bg-retrograde-ruby';
            else if (d.status === 'Exalted') barColor = 'bg-exalted-emerald';

            html += `
                <div class="flex flex-col bg-surface-container-lowest rounded-xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(197,152,32,0.05)] space-y-2 border border-black/5 hover:border-gold-border-focus transition-all">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-8 h-8 rounded-full bg-primary-container/15 text-primary flex items-center justify-center text-[16px] shrink-0 shadow-sm">${meta.emoji}</span>
                            <div class="flex flex-col min-w-0">
                                <span class="font-headline-sm text-sm sm:text-base font-bold text-cosmic-slate leading-tight truncate">${titleDisplay}</span>
                                <span class="text-xs text-muted-lavender truncate">${roleDisplay}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 flex-wrap justify-end shrink-0">
                            ${dignityBadge}
                            ${motionBadge}
                        </div>
                    </div>

                    <div class="flex items-baseline justify-between pt-0.5 flex-wrap gap-1">
                        <div>
                            <span class="text-sm sm:text-base font-bold text-cosmic-slate font-headline-md">${dms}</span>
                            <span class="text-xs sm:text-sm text-muted-lavender ml-1">in ${rashiDisplay}</span>
                        </div>
                        <span class="text-[11px] text-cosmic-slate font-medium bg-surface-container-low px-2 py-0.5 rounded-full">${houseName}</span>
                    </div>

                    <div class="flex flex-col space-y-1">
                        <div class="flex justify-between items-center text-[11px] text-muted-lavender flex-wrap gap-1">
                            <span>Nakshatra: <strong class="text-cosmic-slate font-medium">${nakHin} (${nak.name})</strong> • Pada ${nak.pada}</span>
                            <span>${pct}% through sign</span>
                        </div>
                        <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                            <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Update Telemetry Header & Kundali Container
    function updateDashboard() {
        const data = calculateCelestialState(state.currentDate);

        // Update live clock
        const clockEl = document.getElementById('live-clock');
        if (clockEl) {
            const hrs = String(state.currentDate.getHours()).padStart(2, '0');
            const mins = String(state.currentDate.getMinutes()).padStart(2, '0');
            const secs = String(state.currentDate.getSeconds()).padStart(2, '0');
            clockEl.textContent = `${hrs}:${mins}:${secs} IST`;
        }

        // Update Live / Custom Status Badge & Reset Button
        const dotEl = document.getElementById('live-indicator-dot');
        const statusLabel = document.getElementById('live-status-label');
        const resetBtn = document.getElementById('reset-today-btn');
        const resetText = document.getElementById('reset-btn-text');
        const timeTravelLabel = document.getElementById('time-travel-label');

        if (timeTravelLabel) {
            timeTravelLabel.textContent = state.lang === 'HIN' ? 'समय गति / Step:' : 'Time Step / समय गति:';
        }

        if (state.isLive) {
            if (dotEl) {
                dotEl.innerHTML = `
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                `;
            }
            if (statusLabel) {
                statusLabel.textContent = state.lang === 'HIN' ? 'लाइव गोचर' : 'LIVE GOCHAR';
                statusLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
            }
            if (resetBtn) {
                resetBtn.className = 'px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1';
            }
            if (resetText) {
                resetText.textContent = state.lang === 'HIN' ? 'आज Live' : 'Live Now';
            }

            // Keep date and time inputs in sync with current clock if user is not actively typing
            const dateInput = document.getElementById('chart-date-input');
            if (dateInput && document.activeElement !== dateInput) {
                dateInput.value = getLocalDateString(state.currentDate);
            }
            const timeInput = document.getElementById('chart-time-input');
            if (timeInput && document.activeElement !== timeInput) {
                timeInput.value = getLocalTimeString(state.currentDate);
            }
        } else {
            if (dotEl) {
                dotEl.innerHTML = `
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container shadow-sm"></span>
                `;
            }
            if (statusLabel) {
                statusLabel.textContent = state.lang === 'HIN' ? 'विशेष समय' : 'CUSTOM TIME';
                statusLabel.className = 'text-xs font-bold text-tertiary uppercase tracking-wider';
            }
            if (resetBtn) {
                resetBtn.className = 'px-2.5 py-0.5 rounded-full bg-tertiary-container text-white text-xs font-bold shadow-md animate-pulse active:scale-95 transition-all flex items-center gap-1';
            }
            if (resetText) {
                resetText.textContent = state.lang === 'HIN' ? '⚡ लाइव लौटें' : '⚡ Return Live';
            }
        }

        // Update Lagna Telemetry Badge
        const ascSignIdx = Math.floor(data.ascendant / 30);
        const ascSignEng = RASHIS_ENG[ascSignIdx];
        const ascSignHin = RASHIS_HIN[ascSignIdx];
        const ascDeg = data.ascendant % 30;
        const ascDMS = formatDMS(ascDeg);
        const ascNakHin = NAKSHATRAS_HIN[data.ascNak.index] || data.ascNak.name;

        const lagnaTitleEl = document.getElementById('lagna-title-badge');
        if (lagnaTitleEl) {
            lagnaTitleEl.textContent = state.lang === 'HIN' ? `लग्न: ${ascSignHin}` : `Lagna: ${ascSignHin}`;
        }

        const lagnaDegEl = document.getElementById('lagna-deg-badge');
        if (lagnaDegEl) {
            lagnaDegEl.textContent = `(${ascSignEng} ${ascDMS.substring(0, 6)})`;
        }

        const lagnaNakEl = document.getElementById('lagna-nak-badge');
        if (lagnaNakEl) {
            lagnaNakEl.textContent = `Nakshatra: ${ascNakHin} (Pada ${data.ascNak.pada})`;
        }

        const ayanamsaEl = document.getElementById('ayanamsa-badge');
        if (ayanamsaEl) {
            ayanamsaEl.textContent = `Lahiri ${formatDMS(data.ayanamsa)}`;
        }

        const lstEl = document.getElementById('lst-badge');
        if (lstEl) {
            lstEl.textContent = data.lstStr;
        }

        // Render Kundali
        const chartContainer = document.getElementById('kundali-chart-svg');
        if (chartContainer) {
            if (state.chartStyle === 'north') {
                chartContainer.innerHTML = renderNorthIndianSVG(data.ascendant, data.planetaryDetails);
            } else {
                chartContainer.innerHTML = renderSouthIndianSVG(data.ascendant, data.planetaryDetails);
            }
        }

        // Render Navagraha cards
        renderGrahaCards(data);
    }

    // Setup interactive event listeners
    function setupEvents() {
        // Clock tick every second if in live mode
        setInterval(() => {
            if (state.isLive) {
                state.currentDate = new Date();
                updateDashboard();
            }
        }, 1000);

        function setInputs(d) {
            const dateInput = document.getElementById('chart-date-input');
            if (dateInput) dateInput.value = getLocalDateString(d);
            const timeInput = document.getElementById('chart-time-input');
            if (timeInput) timeInput.value = getLocalTimeString(d);
        }

        function shiftTime(deltaMinutes) {
            state.isLive = false;
            state.currentDate = new Date(state.currentDate.getTime() + deltaMinutes * 60 * 1000);
            setInputs(state.currentDate);
            updateDashboard();
        }

        // Quick Steppers
        const subHourBtn = document.getElementById('time-step-sub-hour');
        if (subHourBtn) subHourBtn.addEventListener('click', () => shiftTime(-60));

        const sub15Btn = document.getElementById('time-step-sub-15m');
        if (sub15Btn) sub15Btn.addEventListener('click', () => shiftTime(-15));

        const add15Btn = document.getElementById('time-step-add-15m');
        if (add15Btn) add15Btn.addEventListener('click', () => shiftTime(15));

        const addHourBtn = document.getElementById('time-step-add-hour');
        if (addHourBtn) addHourBtn.addEventListener('click', () => shiftTime(60));

        const nowBtn = document.getElementById('time-step-now');
        if (nowBtn) {
            nowBtn.addEventListener('click', () => {
                state.isLive = true;
                state.currentDate = new Date();
                setInputs(state.currentDate);
                updateDashboard();
            });
        }

        // Reset to Today/Live button
        const resetBtn = document.getElementById('reset-today-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                state.isLive = true;
                state.currentDate = new Date();
                setInputs(state.currentDate);
                updateDashboard();
            });
        }

        // Date input picker
        const dateInput = document.getElementById('chart-date-input');
        if (dateInput) {
            dateInput.value = getLocalDateString(state.currentDate);
            dateInput.addEventListener('change', (e) => {
                if (e.target.value) {
                    state.isLive = false;
                    const parts = e.target.value.split('-');
                    state.currentDate.setFullYear(parseInt(parts[0], 10));
                    state.currentDate.setMonth(parseInt(parts[1], 10) - 1);
                    state.currentDate.setDate(parseInt(parts[2], 10));
                    updateDashboard();
                }
            });
        }

        // Time input picker
        const timeInput = document.getElementById('chart-time-input');
        if (timeInput) {
            timeInput.value = getLocalTimeString(state.currentDate);
            timeInput.addEventListener('change', (e) => {
                if (e.target.value) {
                    state.isLive = false;
                    const [h, m] = e.target.value.split(':');
                    const hour = parseInt(h, 10);
                    const minute = parseInt(m, 10);
                    if (!isNaN(hour) && !isNaN(minute)) {
                        state.currentDate.setHours(hour, minute, 0);
                        updateDashboard();
                    }
                }
            });
            timeInput.addEventListener('input', (e) => {
                if (e.target.value && e.target.value.includes(':')) {
                    const [h, m] = e.target.value.split(':');
                    const hour = parseInt(h, 10);
                    const minute = parseInt(m, 10);
                    if (!isNaN(hour) && !isNaN(minute)) {
                        state.isLive = false;
                        state.currentDate.setHours(hour, minute, 0);
                        updateDashboard();
                    }
                }
            });
        }

        // North / South chart toggles
        const northBtn = document.getElementById('north-btn');
        const southBtn = document.getElementById('south-btn');

        if (northBtn && southBtn) {
            northBtn.addEventListener('click', () => {
                state.chartStyle = 'north';
                northBtn.className = "px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold bg-primary-container text-on-primary shadow-sm transition-all";
                southBtn.className = "px-3 py-1 rounded-full font-label-sm text-label-sm font-medium text-muted-lavender hover:text-cosmic-slate transition-all";
                updateDashboard();
            });

            southBtn.addEventListener('click', () => {
                state.chartStyle = 'south';
                southBtn.className = "px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold bg-primary-container text-on-primary shadow-sm transition-all";
                northBtn.className = "px-3 py-1 rounded-full font-label-sm text-label-sm font-medium text-muted-lavender hover:text-cosmic-slate transition-all";
                updateDashboard();
            });
        }

        // Language toggle buttons
        const engBtn = document.getElementById('lang-eng-btn');
        const hinBtn = document.getElementById('lang-hin-btn');

        if (engBtn && hinBtn) {
            engBtn.addEventListener('click', () => {
                state.lang = 'ENG';
                engBtn.className = "px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold bg-primary-container text-on-primary shadow-sm";
                hinBtn.className = "px-2.5 py-1 rounded-full font-label-sm text-label-sm font-medium text-muted-lavender hover:text-cosmic-slate";
                updateDashboard();
            });

            hinBtn.addEventListener('click', () => {
                state.lang = 'HIN';
                hinBtn.className = "px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold bg-primary-container text-on-primary shadow-sm";
                engBtn.className = "px-2.5 py-1 rounded-full font-label-sm text-label-sm font-medium text-muted-lavender hover:text-cosmic-slate";
                updateDashboard();
            });
        }

        // Night vision red observatory toggle
        const nightBtn = document.getElementById('night-mode-btn');
        if (nightBtn) {
            nightBtn.addEventListener('click', () => {
                document.body.classList.toggle('night-observatory-mode');
            });
        }
    }

    // Initialization on DOM ready
    function init() {
        setupEvents();
        updateDashboard();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
