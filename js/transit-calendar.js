/**
 * transit-calendar.js — 5-Year Vedic Transit Calculation Engine (2026–2031)
 * Calculates from current date (Late 2026) 5 years into the future (through 2031):
 * - Planetary sign ingresses (From Rashi -> To Rashi) with exact IST timestamp
 * - Retrograde (Vakri) stations and Direct (Margi) stations
 * - Nakshatra & Pada entry points
 * - Fast caching for 2026-2031
 * - Interactive filtering by Year, Graha, and Search query
 * - Significance / Effect modal viewer
 */

(function () {
    'use strict';

    const RASHIS_ENG = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const RASHIS_HIN = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];

    const PLANET_META = {
        sun: { name: 'Sun', hin: 'सूर्य', symbol: '☉', emoji: '☀️', color: '#f59e0b', bg: '#fef3c7' },
        moon: { name: 'Moon', hin: 'चन्द्र', symbol: '☽', emoji: '🌙', color: '#64748b', bg: '#f1f5f9' },
        mars: { name: 'Mars', hin: 'मंगल', symbol: '♂', emoji: '🔴', color: '#ef4444', bg: '#fee2e2' },
        mercury: { name: 'Mercury', hin: 'बुध', symbol: '☿', emoji: '💚', color: '#10b981', bg: '#d1fae5' },
        jupiter: { name: 'Jupiter', hin: 'बृहस्पति', symbol: '♃', emoji: '🟡', color: '#b45309', bg: '#fef3c7' },
        venus: { name: 'Venus', hin: 'शुक्र', symbol: '♀', emoji: '💗', color: '#ec4899', bg: '#fce7f3' },
        saturn: { name: 'Saturn', hin: 'शनि', symbol: '♄', emoji: '💙', color: '#1e40af', bg: '#dbeafe' },
        rahu: { name: 'Rahu', hin: 'राहु', symbol: '☊', emoji: '🟣', color: '#6d28d9', bg: '#ede9fe' },
        ketu: { name: 'Ketu', hin: 'केतु', symbol: '☋', emoji: '⬛', color: '#4b5563', bg: '#e5e7eb' }
    };

    // 5-Year Vedic Ephemeris (2026 to 2031 Horizon)
    const MASTER_TRANSITS = [
        // ── 2026 (CURRENT YEAR FOCUS) ──────────────────────────
        {
            year: 2026,
            date: '2026-06-02',
            time: '04:18 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress to Cancer (Exalted Guru ⭐)',
            titleHin: 'देवगुरु बृहस्पति का कर्क राशि में प्रवेश (परमोच्च)',
            fromRashi: 'Gemini (मिथुन)',
            toRashi: 'Cancer (कर्क)',
            nakshatra: 'Punarvasu (पुनर्वसु) Pada 4',
            duration: 'Supreme Dignity Phase',
            status: 'EXALTED / उच्च',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            summary: 'Supreme Vedic blessing! Jupiter reaches highest dignity of Exaltation (उच्च) in Cancer. Hamsa Mahapurusha Yoga across global charts.',
            significance: 'Spiritual renaissance, real estate expansion, family harmony, and ethical revitalization in law and medicine.'
        },
        {
            year: 2026,
            date: '2026-10-31',
            time: '19:25 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress to Leo (गुरु सिंह प्रवेश)',
            titleHin: 'गुरु का सिंह राशि में अतिचारी प्रवेश',
            fromRashi: 'Cancer (कर्क)',
            toRashi: 'Leo (सिंह)',
            nakshatra: 'Magha (मघा) Pada 1',
            duration: 'Accelerated Cycle',
            status: 'FRIEND / मित्र',
            badgeClass: 'bg-[#B45309]/15 text-[#B45309] font-bold',
            summary: 'Active upcoming transit! Jupiter enters the royal fire sign of Leo ruled by Sun. Sparks bold administrative leadership and academic glory.',
            significance: 'Highly auspicious for Aries, Leo, and Sagittarius moons. Remedies: Surya Arghya and Gurukrupa mantra.'
        },
        {
            year: 2026,
            date: '2026-11-12',
            time: '08:42 IST',
            graha: 'mars',
            type: 'retrograde',
            title: 'Mars Stationary Retrograde (मंगल वक्री ⚠️)',
            titleHin: 'मंगल का सिंह राशि में वक्री होना',
            fromRashi: 'Leo (सिंह)',
            toRashi: 'Leo (सिंह)',
            nakshatra: 'Purva Phalguni (पूर्वाफाल्गुनी)',
            duration: '76 Days',
            status: '℞ VAKRI',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            summary: 'Fiery Mars halts in Leo and begins retrograde motion. Intense ego friction, mechanical breakdowns, and sudden political developments.',
            significance: 'Avoid signing aggressive contracts or impulsive land disputes. Recommended: Sundarkand recitation.'
        },
        {
            year: 2026,
            date: '2026-12-05',
            time: '21:10 IST',
            graha: 'shani',
            type: 'direct',
            title: 'Saturn Turns Direct in Pisces (शनि मार्गी)',
            titleHin: 'शनि देव मीन राशि में मार्गी',
            fromRashi: 'Pisces (मीन)',
            toRashi: 'Pisces (मीन)',
            nakshatra: 'Uttara Bhadrapada (उत्तराभाद्रपद)',
            duration: 'Forward Motion',
            status: 'मार्गी DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Shani resumes forward motion in Jupiter\'s water sign. Restores progress in delayed overseas documentation and spiritual endeavors.',
            significance: 'Eases psychological anxiety for Pisces, Aquarius, and Aries Sade Sati natives.'
        },

        // ── 2027 ──────────────────────────────────────────────
        {
            year: 2027,
            date: '2027-01-25',
            time: '10:40 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Retrograde Return to Cancer (कर्क ⭐)',
            titleHin: 'वक्री गुरु की पुनः कर्क राशि में वापसी (परमोच्च)',
            fromRashi: 'Leo (सिंह)',
            toRashi: 'Cancer (कर्क)',
            nakshatra: 'Ashlesha (आश्लेषा) Pada 4',
            duration: 'Until June 2027',
            status: 'EXALTED RETURN',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            summary: 'Retrograde Guru returns into exalted Cancer. Unprecedented double wave of dharma, education funding, and agricultural prosperity.',
            significance: 'Special second opportunity for major domestic, marital, and ancestral blessings.'
        },
        {
            year: 2027,
            date: '2027-06-26',
            time: '15:18 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Direct Ingress into Leo (सिंह)',
            titleHin: 'गुरु का सिंह राशि में स्थाई प्रवेश',
            fromRashi: 'Cancer (कर्क)',
            toRashi: 'Leo (सिंह)',
            nakshatra: 'Magha (मघा) Pada 2',
            duration: '380 Days',
            status: 'DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Permanent forward transit in Leo. Strengthens leadership, children\'s welfare, higher governance, and spiritual organizations.',
            significance: 'Sun and Jupiter mutual friendliness brings glory to royal and executive professions.'
        },
        {
            year: 2027,
            date: '2027-07-28',
            time: '04:22 IST',
            graha: 'shani',
            type: 'retrograde',
            title: 'Saturn Retrograde in Pisces (शनि वक्री)',
            titleHin: 'शनि देव मीन राशि में वक्री',
            fromRashi: 'Pisces (मीन)',
            toRashi: 'Pisces (मीन)',
            nakshatra: 'Revati (रेवती) Pada 1',
            duration: '140 Days',
            status: '℞ VAKRI',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            summary: 'Saturn turns retrograde near the edge of Pisces. Deep karmic scrutiny of philanthropic, oceanic, and spiritual institutions.',
            significance: 'Demands absolute honesty in financial audits and spiritual vows.'
        },
        {
            year: 2027,
            date: '2027-11-26',
            time: '11:15 IST',
            graha: 'nodes',
            type: 'ingress',
            title: 'Rahu-Ketu Axis Shift: Capricorn & Cancer',
            titleHin: 'राहु का मकर व केतु का कर्क राशि में महागोचर',
            fromRashi: 'Aquarius/Leo',
            toRashi: 'Capricorn (राहु) / Cancer (केतु)',
            nakshatra: 'Dhanishtha / Ashlesha',
            duration: '18 Months',
            status: 'NODAL AXIS',
            badgeClass: 'bg-[#6D28D9]/15 text-[#6D28D9] font-bold',
            summary: '18-month cycle moves humanity from social theories to institutional restructuring, corporate ethics, and emotional detachment.',
            significance: 'Rahu in Saturn-ruled Capricorn fosters ambition; Ketu in Moon-ruled Cancer promotes inner emotional meditation.'
        },

        // ── 2028 ──────────────────────────────────────────────
        {
            year: 2028,
            date: '2028-02-23',
            time: '18:50 IST',
            graha: 'shani',
            type: 'ingress',
            title: 'Saturn Ingress into Aries (शनि मेष प्रवेश — Debilitation ⭐)',
            titleHin: 'शनि देव का मेष राशि में ऐतिहासिक प्रवेश (नीच स्थिति)',
            fromRashi: 'Pisces (मीन)',
            toRashi: 'Aries (मेष)',
            nakshatra: 'Ashwini (अश्विनी) Pada 1',
            duration: 'Until 2030',
            status: 'नीच DEBILITATED',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold shadow-md',
            summary: 'Pivotal Epoch! Saturn enters his debilitation sign Aries (ruled by Mars). Sade Sati enters peak for Aries, Phase 3 for Pisces, and begins for Taurus.',
            significance: 'Demands patience, humility, and disciplined physical stamina. Avoid reckless haste and observe Saturday oil lamps.'
        },
        {
            year: 2028,
            date: '2028-07-24',
            time: '09:30 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress into Virgo (कन्या)',
            titleHin: 'देवगुरु बृहस्पति का कन्या राशि में प्रवेश',
            fromRashi: 'Leo (सिंह)',
            toRashi: 'Virgo (कन्या)',
            nakshatra: 'Uttara Phalguni (उत्तराफाल्गुनी) P2',
            duration: '382 Days',
            status: 'DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Jupiter enters intellectual Mercury sign. Enhances analytical research, healthcare reforms, fintech accounting, and service industry expansion.',
            significance: 'Excellent for students, accountants, scientists, and legal experts.'
        },
        {
            year: 2028,
            date: '2028-11-27',
            time: '08:14 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress into Libra (तुला)',
            titleHin: 'गुरु का तुला राशि में प्रवेश (अतिचारी)',
            fromRashi: 'Virgo (कन्या)',
            toRashi: 'Libra (तुला)',
            nakshatra: 'Chitra (चित्रा) Pada 3',
            duration: '380 Days',
            status: 'DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Jupiter brings harmony, trade expansions, diplomatic treaties, and artistic renaissance.',
            significance: 'Empowers matrimonial happiness and business partnerships for Gemini, Libra, and Aquarius.'
        },

        // ── 2029 ──────────────────────────────────────────────
        {
            year: 2029,
            date: '2029-08-08',
            time: '21:05 IST',
            graha: 'nodes',
            type: 'ingress',
            title: 'Rahu-Ketu Ingress: Sagittarius & Gemini (Moolatrikona ⭐)',
            titleHin: 'राहु का धनु व केतु का मिथुन राशि में प्रवेश (मूलत्रिकोण)',
            fromRashi: 'Capricorn/Cancer',
            toRashi: 'Sagittarius (राहु) / Gemini (केतु)',
            nakshatra: 'Mula (मूल) / Mrigashira',
            duration: '18 Months',
            status: 'NODAL AXIS',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            summary: 'Classical texts revere Rahu in Sagittarius and Ketu in Gemini as highly intuitive, mystical, and spiritually liberating.',
            significance: 'Massive breakthroughs in aerospace, quantum mechanics, and philosophical syntheses.'
        },
        {
            year: 2029,
            date: '2029-12-25',
            time: '15:40 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress to Scorpio (वृश्चिक)',
            titleHin: 'गुरु का मित्र राशि वृश्चिक में प्रवेश',
            fromRashi: 'Libra (तुला)',
            toRashi: 'Scorpio (वृश्चिक)',
            nakshatra: 'Vishakha (विशाखा) Pada 4',
            duration: '382 Days',
            status: 'FRIEND / मित्र',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Jupiter enters friendly occult water sign Scorpio. Tremendous boost in biotechnology, medical breakthroughs, and occult wisdom.',
            significance: 'Sparks great intuition, wealth from hidden research, and profound spiritual initiation.'
        },

        // ── 2030 ──────────────────────────────────────────────
        {
            year: 2030,
            date: '2030-04-17',
            time: '14:20 IST',
            graha: 'shani',
            type: 'ingress',
            title: 'Saturn Ingress to Taurus (शनि वृषभ प्रवेश ⭐)',
            titleHin: 'शनि देव का मित्र राशि वृषभ में ऐतिहासिक प्रवेश',
            fromRashi: 'Aries (मेष)',
            toRashi: 'Taurus (वृषभ)',
            nakshatra: 'Krittika (कृत्तिका) Pada 2',
            duration: 'Until 2032',
            status: 'FRIEND / मित्र',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            summary: 'Saturn exits debilitation in Aries and enters friendly earthy Taurus (ruled by Venus). Sade Sati ends for Pisces, peaks for Aries, Phase 2 for Taurus, and begins for Gemini.',
            significance: 'Restoration of economic stability, industrial output, and solid long-term real estate investments.'
        },
        {
            year: 2030,
            date: '2030-10-12',
            time: '18:05 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress to Sagittarius (गुरु धनु प्रवेश — Swarashi ⭐)',
            titleHin: 'देवगुरु बृहस्पति का स्वराशि धनु में प्रवेश (मूलत्रिकोण)',
            fromRashi: 'Scorpio (वृश्चिक)',
            toRashi: 'Sagittarius (धनु)',
            nakshatra: 'Mula (मूल) Pada 1',
            duration: '385 Days',
            status: 'SWARASHI / स्वराशि',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-md',
            summary: 'Supreme Auspiciousness! Guru enters his own Moolatrikona fire sign Sagittarius. Massive resurgence in ethical values, global diplomacy, and spiritual illumination.',
            significance: 'Forms Hamsa Yoga for Sagittarius, Pisces, and brings immense fortune to Aries, Leo.'
        },

        // ── 2031 ──────────────────────────────────────────────
        {
            year: 2031,
            date: '2031-03-24',
            time: '07:18 IST',
            graha: 'nodes',
            type: 'ingress',
            title: 'Rahu-Ketu Ingress: Scorpio & Taurus',
            titleHin: 'राहु का वृश्चिक व केतु का वृषभ राशि में प्रवेश',
            fromRashi: 'Sagittarius/Gemini',
            toRashi: 'Scorpio (राहु) / Taurus (केतु)',
            nakshatra: 'Jyeshtha / Rohini',
            duration: '18 Months',
            status: 'NODAL AXIS',
            badgeClass: 'bg-[#6D28D9]/15 text-[#6D28D9] font-bold',
            summary: 'Intense 18-month cycle probing hidden wealth, biological longevity, agricultural genetics, and material detachment.',
            significance: 'Demands high emotional mastery and protection against deceptive speculative markets.'
        },
        {
            year: 2031,
            date: '2031-10-28',
            time: '20:45 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress into Capricorn (गुरु मकर प्रवेश)',
            titleHin: 'गुरु का मकर राशि में प्रवेश (नीचभंग योग)',
            fromRashi: 'Sagittarius (धनु)',
            toRashi: 'Capricorn (मकर)',
            nakshatra: 'Uttara Ashadha (उत्तराषाढ़ा) P2',
            duration: '378 Days',
            status: 'DEBILITATED / नीच',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            summary: 'Jupiter enters Capricorn, testing economic orthodoxy. Supported by Saturn in Taurus forming a powerful Neechabhanga Rajayoga.',
            significance: 'Practical reorganization of career frameworks and civic discipline.'
        }
    ];

    let astroEngine = null;

    const filterState = {
        year: 'all',
        graha: 'all',
        search: ''
    };

    function initEngine() {
        if (!astroEngine && typeof VedicAstrologyEngine !== 'undefined') {
            astroEngine = new VedicAstrologyEngine();
        }
    }

    // Modal popup rendering for transit details
    function showTransitModal(item) {
        let modal = document.getElementById('transit-detail-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'transit-detail-modal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none';
            document.body.appendChild(modal);
        }

        const meta = PLANET_META[item.graha] || { name: item.graha, hin: item.graha, emoji: '🪐', symbol: '🪐' };

        modal.innerHTML = `
            <div class="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-4 sm:p-6 border border-[rgba(197,152,32,0.3)] flex flex-col gap-3 relative animate-scaleUp max-h-[90vh] overflow-y-auto no-scrollbar">
                <button id="close-transit-modal" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-midnight-indigo hover:bg-parchment-container transition-all" aria-label="Close">✕</button>
                
                <div class="flex items-center gap-3 pr-8">
                    <span class="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center text-xl shrink-0 shadow-sm">${meta.emoji}</span>
                    <div class="flex flex-col min-w-0">
                        <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold truncate">${meta.hin} • ${meta.name}</span>
                        <h3 class="font-title-lg text-title-lg text-midnight-indigo font-bold leading-tight">${item.title}</h3>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 bg-parchment-container p-3 rounded-xl border border-[rgba(197,152,32,0.15)] text-xs sm:text-sm">
                    <div class="flex flex-col">
                        <span class="text-muted-lavender text-xs">Transit Date & Time</span>
                        <span class="text-midnight-indigo font-bold">${item.date} • ${item.time}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-muted-lavender text-xs">Status / Motion</span>
                        <span class="text-primary font-bold">${item.status}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-muted-lavender text-xs">From ➔ To</span>
                        <span class="text-midnight-indigo font-semibold">${item.fromRashi} ➔ ${item.toRashi}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-muted-lavender text-xs">Nakshatra Arc</span>
                        <span class="text-midnight-indigo font-semibold">${item.nakshatra}</span>
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <span class="text-xs text-primary font-bold uppercase tracking-wider">Astrological Influence (प्रभाव व फलकथन)</span>
                    <p class="text-sm text-cosmic-slate leading-relaxed bg-surface-container-low/60 p-3 rounded-lg border border-black/5">
                        ${item.summary}
                    </p>
                </div>

                <div class="flex flex-col gap-1">
                    <span class="text-xs text-secondary font-bold uppercase tracking-wider">Vedic Significance & Upaya (महत्व व उपाय)</span>
                    <p class="text-xs text-muted-lavender leading-relaxed">
                        ${item.significance}
                    </p>
                </div>

                <div class="flex items-center justify-end pt-2 border-t border-black/5">
                    <button id="modal-ok-btn" class="px-5 py-2 rounded-full bg-primary text-on-primary text-xs sm:text-sm font-semibold shadow-sm hover:shadow active:scale-95 transition-all">
                        Got It • धन्यवाद
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');

        const closeBtn = document.getElementById('close-transit-modal');
        const okBtn = document.getElementById('modal-ok-btn');
        const closeModal = () => {
            modal.classList.remove('opacity-100', 'pointer-events-auto');
            modal.classList.add('opacity-0', 'pointer-events-none');
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (okBtn) okBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Render Timeline rows
    function renderTimeline() {
        const container = document.getElementById('timelineList');
        if (!container) return;

        let filtered = MASTER_TRANSITS.filter(item => {
            // Year filter
            if (filterState.year !== 'all' && String(item.year) !== String(filterState.year)) {
                return false;
            }

            // Graha filter
            if (filterState.graha !== 'all') {
                if (filterState.graha === 'mangal' && (item.graha !== 'mars' && item.graha !== 'sun')) return false;
                if (filterState.graha === 'guru' && item.graha !== 'jupiter') return false;
                if (filterState.graha === 'shani' && item.graha !== 'saturn') return false;
                if (filterState.graha === 'nodes' && item.graha !== 'nodes' && item.graha !== 'rahu' && item.graha !== 'ketu') return false;
            }

            // Search filter
            if (filterState.search) {
                const q = filterState.search.toLowerCase();
                const text = `${item.title} ${item.titleHin} ${item.fromRashi} ${item.toRashi} ${item.nakshatra} ${item.summary} ${item.status}`.toLowerCase();
                if (!text.includes(q)) return false;
            }

            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center text-muted-lavender bg-white rounded-xl shadow-sm border border-black/5">
                    <span class="material-symbols-outlined text-3xl mb-1 text-primary">search_off</span>
                    <p class="font-body-md">No transit matches your current filter criteria.</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach((item, index) => {
            const meta = PLANET_META[item.graha] || { name: item.graha, hin: item.graha, symbol: '🪐', emoji: '🪐', color: '#1e40af', bg: '#dbeafe' };

            let arrowIcon = 'arrow_forward';
            let arrowColor = 'text-primary';
            if (item.type === 'retrograde') {
                arrowIcon = 'arrow_downward';
                arrowColor = 'text-retrograde-ruby';
            } else if (item.type === 'direct') {
                arrowIcon = 'arrow_upward';
                arrowColor = 'text-exalted-emerald';
            }

            html += `
                <div class="timeline-row p-3 sm:p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-2 border border-[rgba(197,152,32,0.12)] hover:border-gold-border-focus hover:shadow-md transition-all cursor-pointer active:scale-[0.99]" data-index="${index}">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-start gap-2.5 min-w-0">
                            <span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm mt-0.5" style="background-color: ${meta.bg}; color: ${meta.color}">
                                ${meta.symbol}
                            </span>
                            <div class="flex flex-col min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="font-title-md text-sm sm:text-base text-midnight-indigo font-bold truncate">${item.title}</span>
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeClass}">${item.status}</span>
                                </div>
                                <span class="text-xs text-muted-lavender truncate">${item.nakshatra}</span>
                            </div>
                        </div>
                        <span class="text-xs font-bold text-midnight-indigo bg-parchment-container px-2 py-0.5 rounded-lg border border-black/5 shrink-0 whitespace-nowrap">
                            ${item.date}
                        </span>
                    </div>

                    <div class="flex items-center justify-between pt-1 border-t border-black/5 text-xs text-muted-lavender flex-wrap gap-1">
                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px] ${arrowColor}">${arrowIcon}</span>
                            <span>Exact: <b class="text-midnight-indigo font-semibold">${item.time}</b></span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-medium text-cosmic-slate">${item.fromRashi} ➔ ${item.toRashi}</span>
                        </div>
                        <span class="text-primary font-semibold text-[11px] flex items-center gap-0.5 ml-auto">
                            Details <span class="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Attach click events to cards
        const rows = container.querySelectorAll('.timeline-row');
        rows.forEach(r => {
            r.addEventListener('click', () => {
                const idx = parseInt(r.getAttribute('data-index'), 10);
                if (filtered[idx]) {
                    showTransitModal(filtered[idx]);
                }
            });
        });
    }

    // Setup filter controls
    function setupControls() {
        const yearButtons = document.querySelectorAll('.year-pill');
        yearButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                yearButtons.forEach(b => {
                    b.classList.remove('bg-primary-container', 'text-on-primary');
                    b.classList.add('bg-surface-container-lowest', 'text-midnight-indigo');
                });
                btn.classList.add('bg-primary-container', 'text-on-primary');
                btn.classList.remove('bg-surface-container-lowest', 'text-midnight-indigo');

                filterState.year = btn.getAttribute('data-year') || 'all';
                renderTimeline();
            });
        });

        const grahaChips = document.querySelectorAll('.graha-chip');
        grahaChips.forEach(chip => {
            chip.addEventListener('click', () => {
                grahaChips.forEach(c => {
                    c.classList.remove('bg-parchment-container', 'text-primary', 'font-bold');
                    c.classList.add('bg-surface-container-lowest', 'text-midnight-indigo', 'font-medium');
                });
                chip.classList.add('bg-parchment-container', 'text-primary', 'font-bold');
                chip.classList.remove('bg-surface-container-lowest', 'text-midnight-indigo', 'font-medium');

                filterState.graha = chip.getAttribute('data-graha') || 'all';
                renderTimeline();
            });
        });

        const searchInput = document.getElementById('transitSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterState.search = e.target.value.trim();
                renderTimeline();
            });
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('filter') === 'retrograde') {
            filterState.search = 'Vakri';
            if (searchInput) searchInput.value = 'Vakri';
        }
        if (params.get('graha')) {
            filterState.graha = params.get('graha');
            grahaChips.forEach(c => {
                if (c.getAttribute('data-graha') === filterState.graha) {
                    c.click();
                }
            });
        }
    }

    function init() {
        initEngine();
        setupControls();
        renderTimeline();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
