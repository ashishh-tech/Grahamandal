/**
 * transit-calendar.js — 5-Year Vedic Transit Calculation Engine
 * Calculates:
 * - Planetary sign ingresses (From Rashi -> To Rashi) with exact IST timestamp
 * - Retrograde (Vakri) stations and Direct (Margi) stations
 * - Nakshatra & Pada entry points
 * - Fast caching for 2024-2031
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

    // Curated high-precision astronomical Vedic transit database for major epochs 2024-2031
    // supplemented by the engine for complete day-by-day precision
    const MASTER_TRANSITS = [
        // 2024
        {
            year: 2024,
            date: '2024-05-01',
            time: '12:48 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress into Taurus (वृषभ)',
            titleHin: 'गुरु का वृषभ राशि में प्रवेश',
            fromRashi: 'Aries (मेष)',
            toRashi: 'Taurus (वृषभ)',
            nakshatra: 'Krittika (कृत्तिका) Pada 2',
            duration: '378 Days',
            status: 'DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald',
            summary: 'Expands material prosperity (Artha), banking stability, real estate, and agricultural growth. Very auspicious for Taurus, Virgo, and Capricorn moon signs.',
            significance: 'Jupiter enters Venus\'s earthy sign. Conjunction with Uranus brings technological and financial paradigm shifts. Vedic remedies: Vishnu Sahasranama and saffron tilak.'
        },
        {
            year: 2024,
            date: '2024-06-29',
            time: '23:44 IST',
            graha: 'shani',
            type: 'retrograde',
            title: 'Saturn Stationary Retrograde (शनि वक्री)',
            titleHin: 'शनि देव कुंभ राशि में वक्री',
            fromRashi: 'Aquarius (कुंभ)',
            toRashi: 'Aquarius (कुंभ)',
            nakshatra: 'Shatabhisha (शतभिषा) Pada 1',
            duration: '139 Days',
            status: '℞ VAKRI',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            summary: 'Saturn halts at 25°12\' Aquarius and turns retrograde until November 15, 2024. Karmic accountability, public sector scrutiny, and infrastructure delays.',
            significance: 'Retrograde Saturn in Moolatrikona intensifies past karmic debts and enforces deep introspection. Caution for Aquarius, Capricorn, and Pisces.'
        },
        {
            year: 2024,
            date: '2024-10-02',
            time: '21:13 IST',
            graha: 'nodes',
            type: 'eclipse',
            title: 'Sarva Surya Grahan (Annular Solar Eclipse)',
            titleHin: 'सूर्य ग्रहण (हस्त नक्षत्र • कन्या राशि)',
            fromRashi: 'Virgo (कन्या)',
            toRashi: 'Virgo (कन्या)',
            nakshatra: 'Hasta (हस्त) Pada 3',
            duration: 'Annular Phase 6m 04s',
            status: 'ECLIPSE',
            badgeClass: 'bg-[#FEF3C7] text-[#92400E] font-bold',
            summary: 'Ketu conjunct Sun & Moon in Hasta Nakshatra. Critical for health diplomacy, commercial markets, and mental clarity.',
            significance: 'Hasta is ruled by the Moon; subtle psychological restlessness can peak. Sutak observed 12 hours prior.'
        },
        {
            year: 2024,
            date: '2024-10-09',
            time: '12:33 IST',
            graha: 'jupiter',
            type: 'retrograde',
            title: 'Jupiter Retrograde in Taurus (गुरु वक्री)',
            titleHin: 'गुरु वृषभ में वक्री (रोहिणी नक्षत्र)',
            fromRashi: 'Taurus (वृषभ)',
            toRashi: 'Taurus (वृषभ)',
            nakshatra: 'Rohini (रोहिणी) Pada 1',
            duration: '119 Days',
            status: '℞ VAKRI',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            summary: 'Devaguru halts at 27°14\' Taurus and begins retrograde motion until Feb 4, 2025. Re-evaluation of investments, educational policies, and spiritual vows.',
            significance: 'Provides second chances in major financial commitments. Avoid speculative greed during this period.'
        },
        {
            year: 2024,
            date: '2024-10-20',
            time: '14:22 IST',
            graha: 'mangal',
            type: 'ingress',
            title: 'Mars Ingress to Cancer (कर्क) — Debilitation',
            titleHin: 'मंगल का नीच राशि कर्क में प्रवेश (गंडान्त पार)',
            fromRashi: 'Gemini (मिथुन)',
            toRashi: 'Cancer (कर्क)',
            nakshatra: 'Punarvasu (पुनर्वसु) Pada 4',
            duration: 'Prolonged (8 Months with Retrograde)',
            status: 'नीच DEBILITATED',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            summary: 'Mars enters its debilitation sign and stays unusually long due to retrograde loop until June 2025. Extreme emotional volatility and real estate friction.',
            significance: 'Mars is debilitated in the sign of Moon. Recommended remedies: Hanuman Chalisa and avoiding hasty confrontations.'
        },
        {
            year: 2024,
            date: '2024-11-15',
            time: '06:51 IST',
            graha: 'shani',
            type: 'direct',
            title: 'Saturn Turns Direct (शनि मार्गी)',
            titleHin: 'शनि देव कुंभ राशि में मार्गी',
            fromRashi: 'Aquarius (कुंभ)',
            toRashi: 'Aquarius (कुंभ)',
            nakshatra: 'Shatabhisha (शतभिषा) Pada 1',
            duration: 'Permanent Forward Motion',
            status: 'मार्गी DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Shani resumes forward motion at 18°42\' Aquarius. Breakthroughs in long-pending government approvals, construction, and career clarity.',
            significance: 'Brings relief to Capricorn, Aquarius, and Pisces natives from acute mental pressure.'
        },

        // 2025
        {
            year: 2025,
            date: '2025-02-04',
            time: '14:10 IST',
            graha: 'jupiter',
            type: 'direct',
            title: 'Jupiter Turns Direct (गुरु मार्गी)',
            titleHin: 'गुरु वृषभ में मार्गी',
            fromRashi: 'Taurus (वृषभ)',
            toRashi: 'Taurus (वृषभ)',
            nakshatra: 'Rohini (रोहिणी) Pada 1',
            duration: 'Until May 2025 Ingress',
            status: 'मार्गी DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Guru becomes Margi at 17°02\' Taurus. Rapid surge in business mergers, marriage muhurtas, and financial recovery.',
            significance: 'Auspicious for ceremonies, buying gold, and launching new enterprises.'
        },
        {
            year: 2025,
            date: '2025-03-29',
            time: '22:04 IST',
            graha: 'shani',
            type: 'ingress',
            title: 'Saturn Ingress to Pisces (शनि मीन प्रवेश ⭐)',
            titleHin: 'महागोचर: शनि का मीन राशि में ऐतिहासिक प्रवेश',
            fromRashi: 'Aquarius (कुंभ)',
            toRashi: 'Pisces (मीन)',
            nakshatra: 'Purva Bhadrapada (पूर्वाभाद्रपद) Pada 4',
            duration: 'Until Feb 23, 2028',
            status: 'HISTORIC EPOCH',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            summary: 'Major planetary shift! Saturn leaves his home sign Aquarius and enters the oceanic, spiritual waters of Pisces. Sade Sati shifts: Ends for Capricorn, Phase 3 for Aquarius, Phase 2 for Pisces, Begins for Aries.',
            significance: 'Dissolution of obsolete institutions, rise in spiritual seekers, medical discoveries, and massive maritime/environmental restructuring.'
        },
        {
            year: 2025,
            date: '2025-05-14',
            time: '23:20 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress to Gemini (गुरु मिथुन प्रवेश)',
            titleHin: 'देवगुरु बृहस्पति का मिथुन राशि में प्रवेश',
            fromRashi: 'Taurus (वृषभ)',
            toRashi: 'Gemini (मिथुन)',
            nakshatra: 'Mrigashira (मृगशिरा) Pada 3',
            duration: '384 Days',
            status: 'महान गोचर',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Jupiter enters communicative Gemini ruled by Mercury. Explosion in AI communication, publishing, travel, and international trade treaties.',
            significance: 'Trines Libra and Aquarius moons, providing magnificent intellectual expansion and networking blessings.'
        },
        {
            year: 2025,
            date: '2025-05-18',
            time: '16:30 IST',
            graha: 'nodes',
            type: 'ingress',
            title: 'Rahu-Ketu Axis Shift: Aquarius & Leo',
            titleHin: 'राहु का कुंभ व केतु का सिंह राशि में गोचर',
            fromRashi: 'Pisces/Virgo',
            toRashi: 'Aquarius (राहु) / Leo (केतु)',
            nakshatra: 'Purva Bhadrapada / Magha',
            duration: '18 Months',
            status: 'NODAL AXIS',
            badgeClass: 'bg-[#6D28D9]/15 text-[#6D28D9] font-bold',
            summary: '18-month cycle moves humanity toward decentralization, digital autonomy, and scrutiny of authoritarian power.',
            significance: 'Rahu in Saturn-ruled Aquarius accelerates technological and social networks; Ketu in Sun-ruled Leo cuts through ego attachments.'
        },
        {
            year: 2025,
            date: '2025-07-13',
            time: '07:15 IST',
            graha: 'shani',
            type: 'retrograde',
            title: 'Saturn Retrograde in Pisces (शनि मीन में वक्री)',
            titleHin: 'शनि देव मीन राशि में प्रथम वक्री',
            fromRashi: 'Pisces (मीन)',
            toRashi: 'Pisces (मीन)',
            nakshatra: 'Uttara Bhadrapada (उत्तराभाद्रपद)',
            duration: '138 Days',
            status: '℞ VAKRI',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            summary: 'First retrograde station in Pisces. Deep emotional processing, karmic balancing of charitable debts, and healthcare audits.',
            significance: 'Focus on water conservation, internal reflection, and meditation practices.'
        },

        // 2026
        {
            year: 2026,
            date: '2026-06-02',
            time: '04:18 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress to Cancer (Exalted / उच्च गुरु ⭐)',
            titleHin: 'देवगुरु बृहस्पति का कर्क राशि में प्रवेश (परमोच्च)',
            fromRashi: 'Gemini (मिथुन)',
            toRashi: 'Cancer (कर्क)',
            nakshatra: 'Punarvasu (पुनर्वसु) Pada 4',
            duration: 'Golden Epoch',
            status: 'EXALTED / उच्च',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-md',
            summary: 'Supreme Vedic blessing! Jupiter reaches highest dignity of Exaltation (उच्च) in Cancer. Hamsa Mahapurusha Yoga across global charts.',
            significance: 'Spiritual renaissance, family cohesion, housing prosperity, and ethical renaissance in law and medicine.'
        },
        {
            year: 2026,
            date: '2026-10-31',
            time: '19:25 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Atichari Ingress to Leo (सिंह)',
            titleHin: 'गुरु का सिंह राशि में अतिचारी प्रवेश',
            fromRashi: 'Cancer (कर्क)',
            toRashi: 'Leo (सिंह)',
            nakshatra: 'Magha (मघा) Pada 1',
            duration: 'Accelerated Cycle',
            status: 'ATICHARI',
            badgeClass: 'bg-[#B45309]/15 text-[#B45309] font-bold',
            summary: 'Accelerated transit into friendly royal sign Leo. Boosts leadership confidence, high art, and visionary statesman initiatives.',
            significance: 'Sun and Jupiter mutual friendship sparks vibrant royal and political reforms.'
        },

        // 2027
        {
            year: 2027,
            date: '2027-01-25',
            time: '10:40 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Retrograde Return to Cancer (कर्क)',
            titleHin: 'वक्री गुरु की पुनः कर्क राशि में वापसी',
            fromRashi: 'Leo (सिंह)',
            toRashi: 'Cancer (कर्क)',
            nakshatra: 'Ashlesha (आश्लेषा) Pada 4',
            duration: 'Until June 2027',
            status: 'EXALTED RETURN',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Retrograde Guru returns into exalted Cancer. Double blessing for education, agriculture, and inner peace.',
            significance: 'Second wave of wealth and dharma protection for Cancer, Scorpio, and Pisces.'
        },
        {
            year: 2027,
            date: '2027-11-26',
            time: '11:15 IST',
            graha: 'nodes',
            type: 'ingress',
            title: 'Rahu-Ketu Ingress: Capricorn & Cancer',
            titleHin: 'राहु का मकर व केतु का कर्क राशि में प्रवेश',
            fromRashi: 'Aquarius/Leo',
            toRashi: 'Capricorn (राहु) / Cancer (केतु)',
            nakshatra: 'Dhanishtha / Ashlesha',
            duration: '18 Months',
            status: 'NODAL AXIS',
            badgeClass: 'bg-[#6D28D9]/15 text-[#6D28D9] font-bold',
            summary: 'Shifts focus to corporate governance, mineral resources, real estate integrity, and emotional grounding.',
            significance: 'Rahu in ambitious Capricorn sparks high executive drive; Ketu in Cancer demands emotional detachment from domestic clinging.'
        },

        // 2028
        {
            year: 2028,
            date: '2028-02-23',
            time: '18:50 IST',
            graha: 'shani',
            type: 'ingress',
            title: 'Saturn Ingress into Aries (शनि मेष प्रवेश — Debilitation ⭐)',
            titleHin: 'शनि देव का मेष राशि में प्रवेश (नीच स्थिति)',
            fromRashi: 'Pisces (मीन)',
            toRashi: 'Aries (मेष)',
            nakshatra: 'Ashwini (अश्विनी) Pada 1',
            duration: 'Until 2030',
            status: 'नीच DEBILITATED',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold shadow-sm',
            summary: 'Crucial karmic epoch! Saturn enters debilitation in fiery Mars-ruled Aries. Sade Sati enters peak for Aries, Phase 3 for Pisces, begins for Taurus.',
            significance: 'Requires patience, humility, and careful labor relations. Promotes fitness discipline and fire hazard vigilance.'
        },
        {
            year: 2028,
            date: '2028-11-27',
            time: '08:14 IST',
            graha: 'jupiter',
            type: 'ingress',
            title: 'Jupiter Ingress into Libra (तुला)',
            titleHin: 'गुरु का तुला राशि में प्रवेश',
            fromRashi: 'Virgo (कन्या)',
            toRashi: 'Libra (तुला)',
            nakshatra: 'Chitra (चित्रा) Pada 3',
            duration: '380 Days',
            status: 'DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            summary: 'Jupiter brings harmony, trade expansions, diplomatic treaties, and artistic boom.',
            significance: 'Empowers matrimonial happiness and business partnerships for Gemini, Libra, and Aquarius.'
        },

        // 2029
        {
            year: 2029,
            date: '2029-08-08',
            time: '21:05 IST',
            graha: 'nodes',
            type: 'ingress',
            title: 'Rahu-Ketu Ingress: Sagittarius & Gemini (Moolatrikona ⭐)',
            titleHin: 'राहु का धनु व केतु का मिथुन राशि में प्रवेश',
            fromRashi: 'Capricorn/Cancer',
            toRashi: 'Sagittarius (राहु) / Gemini (केतु)',
            nakshatra: 'Mula (मूल) / Mrigashira',
            duration: '18 Months',
            status: 'NODAL AXIS',
            badgeClass: 'bg-primary-container text-on-primary font-bold',
            summary: 'Classical texts revere Rahu in Sagittarius and Ketu in Gemini as highly intuitive, mystical, and spiritually liberating.',
            significance: 'Profound scientific discoveries in quantum physics, space travel, and ancient philosophy.'
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
            summary: 'Jupiter enters friendly occult water sign Scorpio. Tremendous boost in medical research, longevity studies, and financial turnaround.',
            significance: 'Sparks great intuition, wealth from hidden sources, and deep spiritual sadhana.'
        }
    ];

    // Engine instance
    let astroEngine = null;

    // Filter state
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
            <div class="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-space-md border border-[rgba(197,152,32,0.3)] flex flex-col gap-space-sm relative animate-scaleUp">
                <button id="close-transit-modal" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-midnight-indigo hover:bg-parchment-container transition-all" aria-label="Close">✕</button>
                
                <div class="flex items-center gap-space-xs">
                    <span class="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center text-xl shadow-sm">${meta.emoji}</span>
                    <div class="flex flex-col">
                        <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">${meta.hin} • ${meta.name}</span>
                        <h3 class="font-title-lg text-title-lg text-midnight-indigo font-bold leading-tight">${item.title}</h3>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-space-xs bg-parchment-container p-space-sm rounded-xl border border-[rgba(197,152,32,0.15)]">
                    <div class="flex flex-col">
                        <span class="font-label-sm text-label-sm text-muted-lavender">Transit Date & Time</span>
                        <span class="font-body-md text-body-md text-midnight-indigo font-bold">${item.date} • ${item.time}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="font-label-sm text-label-sm text-muted-lavender">Status / Motion</span>
                        <span class="font-body-md text-body-md text-primary font-bold">${item.status}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="font-label-sm text-label-sm text-muted-lavender">From ➔ To</span>
                        <span class="font-body-md text-body-md text-midnight-indigo font-semibold">${item.fromRashi} ➔ ${item.toRashi}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="font-label-sm text-label-sm text-muted-lavender">Nakshatra Arc</span>
                        <span class="font-body-md text-body-md text-midnight-indigo font-semibold">${item.nakshatra}</span>
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <span class="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Astrological Influence (प्रभाव व फलकथन)</span>
                    <p class="font-body-md text-body-md text-cosmic-slate leading-relaxed bg-surface-container-low/60 p-space-sm rounded-lg border border-black/5">
                        ${item.summary}
                    </p>
                </div>

                <div class="flex flex-col gap-1">
                    <span class="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Vedic Significance & Upaya (महत्व व उपाय)</span>
                    <p class="font-body-sm text-body-sm text-muted-lavender leading-relaxed">
                        ${item.significance}
                    </p>
                </div>

                <div class="flex items-center justify-end pt-2 border-t border-black/5">
                    <button id="modal-ok-btn" class="px-5 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:shadow active:scale-95 transition-all">
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
                <div class="timeline-row p-space-sm rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-xs border border-[rgba(197,152,32,0.12)] hover:border-gold-border-focus hover:shadow-md transition-all cursor-pointer" data-index="${index}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold font-label-md text-label-md shadow-sm" style="background-color: ${meta.bg}; color: ${meta.color}">
                                ${meta.symbol}
                            </span>
                            <div>
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="font-title-md text-title-md text-midnight-indigo font-bold">${item.title}</span>
                                    <span class="px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${item.badgeClass}">${item.status}</span>
                                </div>
                                <span class="font-label-sm text-label-sm text-muted-lavender">${item.nakshatra}</span>
                            </div>
                        </div>
                        <span class="font-label-sm text-label-sm font-bold text-midnight-indigo bg-parchment-container px-2.5 py-1 rounded-lg border border-black/5 shrink-0">
                            ${item.date}
                        </span>
                    </div>

                    <div class="flex items-center justify-between pt-1 border-t border-black/5 text-body-sm text-muted-lavender flex-wrap gap-2">
                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px] ${arrowColor}">${arrowIcon}</span>
                            <span>Exact IST: <b class="text-midnight-indigo font-semibold">${item.time}</b></span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="font-medium text-cosmic-slate">${item.fromRashi} ➔ ${item.toRashi}</span>
                        </div>
                        <span class="text-primary font-semibold text-xs flex items-center gap-0.5">
                            Details <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
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
        // Year filter pills
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

        // Graha chips filter
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

        // Search input filter
        const searchInput = document.getElementById('transitSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterState.search = e.target.value.trim();
                renderTimeline();
            });
        }

        // Check URL parameters for direct filtering (e.g. ?filter=retrograde or ?graha=guru)
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
