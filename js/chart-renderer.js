/**
 * AstroChartRenderer
 * Unified visual rendering engine for Vedic Astrology charts (Kundalis)
 * Supports North Indian, South Indian, and Ashtakavarga charts using scalable SVG
 * Zero-collision typography, outer perimeter rashi placement, and responsive viewbox.
 */

class AstroChartRenderer {
    constructor() {
        this.signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        this.shortPlanets = {
            sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me',
            jupiter: 'Ju', venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke'
        };
    }

    /**
     * Helper to resolve DOM container element
     */
    _resolveContainer(container) {
        if (typeof container === 'string') {
            return document.getElementById(container);
        }
        return container;
    }

    /**
     * Normalizes (ascendant, planetaryDetails) arguments regardless of call order
     */
    _normalizeArgs(arg1, arg2) {
        if (typeof arg1 === 'number' && typeof arg2 === 'object') {
            return { ascendant: arg1, planetaryDetails: arg2 || {} };
        }
        if (typeof arg2 === 'number' && typeof arg1 === 'object') {
            return { ascendant: arg2, planetaryDetails: arg1 || {} };
        }
        return { ascendant: Number(arg1) || 0, planetaryDetails: arg2 || {} };
    }

    /**
     * Generates pure SVG string for North Indian style Kundali
     */
    renderNorthIndianSVG(ascendantInput, planetaryDetailsInput, options = {}) {
        const { ascendant, planetaryDetails } = this._normalizeArgs(ascendantInput, planetaryDetailsInput);
        const theme = options.theme || 'light';
        const isDark = (theme === 'dark');

        const size = 600;
        const padding = 24;
        const chartSize = size - (padding * 2); // 552
        const ascendantSign = Math.floor(ascendant / 30) + 1; // 1-indexed

        // Fixed rashi positions at outer tips/corners (zero-collision perimeter)
        const rashiPos = [
            { x: 300, y: 52 },   // H1  — top tip of upper diamond
            { x: 162, y: 46 },   // H2  — top base center of top-left triangle
            { x: 48,  y: 75 },   // H3  — upper corner of left triangle
            { x: 75,  y: 300 },  // H4  — left tip of left diamond
            { x: 48,  y: 525 },  // H5  — lower corner of left triangle
            { x: 162, y: 554 },  // H6  — bottom base center of bottom-left triangle
            { x: 300, y: 548 },  // H7  — bottom tip of lower diamond
            { x: 438, y: 554 },  // H8  — bottom base center of bottom-right triangle
            { x: 552, y: 525 },  // H9  — lower corner of right triangle
            { x: 525, y: 300 },  // H10 — right tip of right diamond
            { x: 552, y: 75 },   // H11 — upper corner of right triangle
            { x: 438, y: 46 }    // H12 — top base center of top-right triangle
        ];

        // Planet render zones — centered on house symmetry axes with generous boundary clearance
        const zones = [
            { x: 300, y: 175 },  // H1:  Top Center diamond
            { x: 162, y: 88 },   // H2:  Top Left triangle (vertical axis x=162, well clear of diagonal y=x)
            { x: 85,  y: 162 },  // H3:  Left Upper triangle (horizontal axis y=162, well clear of apex 162)
            { x: 180, y: 300 },  // H4:  Left Center diamond
            { x: 85,  y: 438 },  // H5:  Left Lower triangle (horizontal axis y=438, well clear of apex 162)
            { x: 162, y: 512 },  // H6:  Bottom Left triangle (vertical axis x=162, well clear of apex 438)
            { x: 300, y: 425 },  // H7:  Bottom Center diamond
            { x: 438, y: 512 },  // H8:  Bottom Right triangle (vertical axis x=438, well clear of apex 438)
            { x: 515, y: 438 },  // H9:  Right Lower triangle (horizontal axis y=438, well clear of apex 438)
            { x: 420, y: 300 },  // H10: Right Center diamond
            { x: 515, y: 162 },  // H11: Right Upper triangle (horizontal axis y=162, well clear of apex 438)
            { x: 438, y: 88 }    // H12: Top Right triangle (vertical axis x=438, well clear of diagonal)
        ];

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

            // 1. Draw Rashi number at fixed outer corner
            const rashiColor = isDark
                ? (isLagnaHouse ? '#f4c430' : '#8A7A56')
                : (isLagnaHouse ? '#785A00' : '#8A7A56');

            houseContentMarkup += `
                <text x="${rp.x}" y="${rp.y}" font-family="'Cinzel', 'Noto Serif', serif" font-size="12" font-weight="700" fill="${rashiColor}" text-anchor="middle" dominant-baseline="middle">${signNumber}</text>
            `;

            // 2. Collect items (Lagna badge for House 1 + planets)
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
                        code: this.shortPlanets[p] || p.substring(0, 2).toUpperCase(),
                        deg: Math.floor(d.degree),
                        min: Math.floor((d.degree % 1) * 60),
                        status: d.status,
                        isRetrograde: d.isRetrograde || p === 'rahu' || p === 'ketu'
                    });
                }
            }

            if (items.length === 0) continue;

            // Adaptive line-height: tighter when many planets, but never below readable threshold
            const lineHeight = items.length >= 4 ? 14 : 17;
            const fontSize = items.length >= 4 ? 11 : 12;
            const degFontSize = items.length >= 4 ? 7.5 : 8.5;
            const totalHeight = items.length * lineHeight;
            let startY = zone.y - (totalHeight / 2) + (lineHeight / 2);

            items.forEach(item => {
                if (item.isLagna) {
                    const lgColor = isDark ? '#f4c430' : '#785A00';
                    houseContentMarkup += `
                        <text x="${zone.x}" y="${startY}" text-anchor="middle" dominant-baseline="central">
                            <tspan font-family="'Cinzel', 'Noto Serif', serif" font-weight="800" font-size="${fontSize}" fill="${lgColor}">Lg</tspan>
                            <tspan font-family="Inter, sans-serif" font-weight="600" font-size="${degFontSize}" fill="${lgColor}" dx="3">${item.deg}°${String(item.min).padStart(2, '0')}'</tspan>
                        </text>
                    `;
                } else {
                    let suffixMarkup = '';
                    if (item.status === 'Exalted') {
                        suffixMarkup = `<tspan fill="${isDark ? '#ffd700' : '#059669'}" font-weight="bold"> ↑</tspan>`;
                    } else if (item.status === 'Debilitated') {
                        suffixMarkup = `<tspan fill="${isDark ? '#ff6b6b' : '#DC2626'}" font-weight="bold"> ↓</tspan>`;
                    }
                    if (item.isRetrograde) {
                        suffixMarkup += `<tspan fill="${isDark ? '#4dabf7' : '#DC2626'}" font-weight="bold"> ℞</tspan>`;
                    }

                    const planetCodeFill = isDark ? '#f8f8ff' : '#151528';
                    const planetDegFill = isDark ? '#e6e6fa' : '#525166';

                    houseContentMarkup += `
                        <text x="${zone.x}" y="${startY}" text-anchor="middle" dominant-baseline="central">
                            <tspan font-family="Inter, sans-serif" font-weight="700" font-size="${fontSize}" fill="${planetCodeFill}">${item.code}</tspan>${suffixMarkup}
                            <tspan font-family="Inter, sans-serif" font-weight="500" font-size="${degFontSize}" fill="${planetDegFill}" dx="3">${item.deg}°${String(item.min).padStart(2, '0')}'</tspan>
                        </text>
                    `;
                }
                startY += lineHeight;
            });
        }

        const bgFill = isDark ? '#0A0A1F' : '#FAF8F5';
        const borderColor = isDark ? '#f4c430' : '#C59820';
        const borderOpacity = isDark ? '0.6' : '0.85';

        return `
            <svg viewBox="-2 -2 604 604" preserveAspectRatio="xMidYMid meet" class="w-full h-full select-none" style="max-width: 100%; display: block; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="lagnaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${borderColor}" stop-opacity="${isDark ? '0.25' : '0.16'}"/>
                        <stop offset="100%" stop-color="${bgFill}" stop-opacity="0.6"/>
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="600" height="600" rx="12" fill="${bgFill}"/>
                <!-- 1st House Highlight (Lagna) -->
                <polygon points="300,24 438,162 300,300 162,162" fill="url(#lagnaGlow)"/>
                <!-- Outer Border -->
                <rect x="24" y="24" width="${chartSize}" height="${chartSize}" fill="none" stroke="${borderColor}" stroke-width="2" stroke-opacity="${borderOpacity}"/>
                <!-- Inner Inset Border -->
                <rect x="29" y="29" width="${chartSize - 10}" height="${chartSize - 10}" fill="none" stroke="${borderColor}" stroke-width="0.8" stroke-opacity="0.25"/>
                <!-- Inscribed Center Diamond -->
                <path d="M300,24 L576,300 L300,576 L24,300 Z" fill="none" stroke="${borderColor}" stroke-width="2" stroke-opacity="${borderOpacity}"/>
                <!-- Major Corner Diagonals -->
                <line x1="24" y1="24" x2="576" y2="576" stroke="${borderColor}" stroke-width="2" stroke-opacity="${borderOpacity}"/>
                <line x1="576" y1="24" x2="24" y2="576" stroke="${borderColor}" stroke-width="2" stroke-opacity="${borderOpacity}"/>
                <!-- House Content (Rashi numbers & Planets) -->
                ${houseContentMarkup}
            </svg>
        `;
    }

    /**
     * Generates pure SVG string for South Indian style Kundali
     */
    renderSouthIndianSVG(ascendantInput, planetaryDetailsInput, options = {}) {
        const { ascendant, planetaryDetails } = this._normalizeArgs(ascendantInput, planetaryDetailsInput);
        const theme = options.theme || 'light';
        const isDark = (theme === 'dark');

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
            const s = Math.floor((d.longitude !== undefined ? d.longitude : d.degree + ((d.house - 1) * 30)) / 30) + 1;
            const validSign = (s >= 1 && s <= 12) ? s : (((d.house - 1 + ascSign - 1) % 12) + 1);
            signPlanets[validSign].push({ planet: p, details: d });
        }

        const bgFill = isDark ? '#0A0A1F' : '#FAF8F5';
        const cellFill = isDark ? '#14142B' : '#FAF8F5';
        const lagnaCellFill = isDark ? '#2A2518' : '#FFF9E6';
        const strokeColor = isDark ? '#f4c430' : '#C59820';
        const textColor = isDark ? '#f8f8ff' : '#151528';
        const lagnaTextColor = isDark ? '#f4c430' : '#785A00';

        let cellsMarkup = '';
        cellCoords.forEach(item => {
            const x = item.c * cell;
            const y = item.r * cell;
            const isLagna = (item.sign === ascSign);

            cellsMarkup += `
                <rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${isLagna ? lagnaCellFill : cellFill}" stroke="${strokeColor}" stroke-width="1.2"/>
                <text x="${x + 8}" y="${y + 16}" font-family="'Noto Serif', serif" font-size="11" font-weight="700" fill="${isLagna ? lagnaTextColor : (isDark ? '#8A7A56' : '#807663')}">${item.sign} ${isLagna ? '(Lg)' : ''}</text>
            `;

            const list = signPlanets[item.sign];
            if (list && list.length > 0) {
                list.forEach((pItem, idx) => {
                    const code = this.shortPlanets[pItem.planet] || pItem.planet.substring(0, 2);
                    const deg = Math.floor(pItem.details.degree);
                    const retro = pItem.details.isRetrograde ? '℞' : '';
                    cellsMarkup += `
                        <text x="${x + cell / 2}" y="${y + 36 + (idx * 16)}" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="${textColor}" text-anchor="middle">
                            ${code} ${deg}° ${retro}
                        </text>
                    `;
                });
            }
        });

        const centerBg = isDark ? '#121226' : '#F5F3F0';

        return `
            <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" class="w-full h-full select-none" style="max-width: 100%; display: block; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="400" rx="8" fill="${bgFill}"/>
                <!-- Center Empty Space -->
                <rect x="${cell}" y="${cell}" width="${cell * 2}" height="${cell * 2}" fill="${centerBg}" stroke="${strokeColor}" stroke-width="1"/>
                <text x="200" y="195" font-family="'Noto Serif', serif" font-size="16" font-weight="700" fill="${lagnaTextColor}" text-anchor="middle">दक्षिण भारतीय</text>
                <text x="200" y="215" font-family="Inter, sans-serif" font-size="12" fill="${isDark ? '#a0a0c0' : '#63627A'}" text-anchor="middle">South Indian Kundali</text>
                ${cellsMarkup}
            </svg>
        `;
    }

    /**
     * Generates pure SVG string for Ashtakavarga chart
     */
    renderAshtavarghaSVG(sarvashtakavarga, ascendant, options = {}) {
        const size = 1000;
        const padding = 60;
        const chartSize = size - (padding * 2);
        const ascendantSign = Math.floor((Number(ascendant) || 0) / 30) + 1; // 1-indexed sign

        const zones = [
            { x: size / 2, y: size * 0.33 },          // H1
            { x: size * 0.25, y: size * 0.15 },       // H2
            { x: size * 0.15, y: size * 0.25 },       // H3
            { x: size * 0.33, y: size / 2 },           // H4
            { x: size * 0.15, y: size * 0.75 },       // H5
            { x: size * 0.25, y: size * 0.85 },       // H6
            { x: size / 2, y: size * 0.67 },           // H7
            { x: size * 0.75, y: size * 0.85 },       // H8
            { x: size * 0.85, y: size * 0.75 },       // H9
            { x: size * 0.67, y: size / 2 },           // H10
            { x: size * 0.85, y: size * 0.25 },       // H11
            { x: size * 0.75, y: size * 0.15 }        // H12
        ];

        const signPos = [
            { x: 500, y: 90 },    // H1 top tip
            { x: 130, y: 95 },    // H2 corner
            { x: 95, y: 130 },   // H3 corner
            { x: 100, y: 500 },   // H4 left tip
            { x: 95, y: 870 },   // H5 corner
            { x: 130, y: 905 },   // H6 corner
            { x: 500, y: 910 },   // H7 bottom tip
            { x: 870, y: 905 },   // H8 corner
            { x: 905, y: 870 },   // H9 corner
            { x: 900, y: 500 },   // H10 right tip
            { x: 905, y: 130 },   // H11 corner
            { x: 870, y: 95 }     // H12 corner
        ];

        let houseMarkup = '';
        zones.forEach((zone, i) => {
            const houseIndex = i;
            const signNumber = ((ascendantSign + houseIndex - 1) % 12) + 1;
            const points = (sarvashtakavarga && sarvashtakavarga[signNumber - 1] !== undefined)
                ? sarvashtakavarga[signNumber - 1]
                : 28;

            const sp = signPos[i];
            houseMarkup += `<text x="${sp.x}" y="${sp.y}" class="av-sign-num" text-anchor="middle" dominant-baseline="middle">${signNumber}</text>`;

            let color;
            if (points >= 28) color = '#ff8c42';      // Auspicious Orange
            else if (points < 25) color = '#64ffda';  // Inauspicious Cyan
            else color = '#f4c430';                   // Mixed Gold

            const circleRadius = 55;
            houseMarkup += `
                <circle cx="${zone.x}" cy="${zone.y}" r="${circleRadius}" fill="${color}" class="av-point-value" />
                <text x="${zone.x}" y="${zone.y}" class="av-points" text-anchor="middle" dominant-baseline="middle">${points}</text>
            `;
        });

        return `
            <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="max-width: 100%; display: block; margin: 0 auto;" viewBox="-2 -2 ${size + 4} ${size + 4}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="avGlow">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <style>
                    .av-line { stroke: #ff8c42; stroke-width: 3; fill: none; opacity: 0.5; }
                    .av-border { stroke: #64ffda; stroke-width: 2; fill: none; opacity: 0.4; }
                    .av-sign-num { fill: #f4c430; font-size: 24px; font-weight: bold; font-family: 'Cinzel', serif; opacity: 0.9; }
                    .av-points { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 48px; fill: #0a0a1f; }
                    .av-point-value { filter: url(#avGlow); }
                </style>
                <rect x="${padding}" y="${padding}" width="${chartSize}" height="${chartSize}" class="av-border" />
                <path d="M${size / 2},${padding} L${size - padding},${size / 2} L${size / 2},${size - padding} L${padding},${size / 2} Z" class="av-line" />
                <line x1="${padding}" y1="${padding}" x2="${size - padding}" y2="${size - padding}" class="av-line" />
                <line x1="${size - padding}" y1="${padding}" x2="${padding}" y2="${size - padding}" class="av-line" />
                ${houseMarkup}
            </svg>
        `;
    }

    /**
     * DOM Rendering Wrappers for backwards compatibility
     */
    drawNorthIndianChart(containerIdOrEl, planetaryDetails, ascendant, options) {
        const container = this._resolveContainer(containerIdOrEl);
        if (!container) return;
        container.innerHTML = this.renderNorthIndianSVG(ascendant, planetaryDetails, options);
    }

    drawSouthIndianChart(containerIdOrEl, planetaryDetails, ascendant, options) {
        const container = this._resolveContainer(containerIdOrEl);
        if (!container) return;
        container.innerHTML = this.renderSouthIndianSVG(ascendant, planetaryDetails, options);
    }

    drawAshtavarghaChart(containerIdOrEl, sarvashtakavarga, ascendant, options) {
        const container = this._resolveContainer(containerIdOrEl);
        if (!container) return;
        container.innerHTML = this.renderAshtavarghaSVG(sarvashtakavarga, ascendant, options);
    }

    nextSign(current, steps) {
        let sign = current + steps;
        while (sign > 12) sign -= 12;
        return sign;
    }
}

// Global Singleton Registration
if (typeof window !== 'undefined') {
    window.AstroChartRenderer = AstroChartRenderer;
    window.astroChartRenderer = new AstroChartRenderer();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AstroChartRenderer };
}
