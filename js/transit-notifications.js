/**
 * transit-notifications.js — Real-Time Planetary Transit Notifications & Ingress Intelligence
 * Grahamandal (ग्रह मंडल)
 *
 * Capabilities:
 * - Native Browser Web Notifications (via Notification API & Service Worker)
 * - Exact-time transit alerts with personalized Short Significance
 * - Deep-link / click to open Detailed Personalized Transit Modal
 * - Computes house activations from Natal Lagna & Moon (BPHS rules)
 * - Shani Sade Sati & Dhaiya ingress detection
 * - Devaguru Jupiter Guru Balam detection
 * - Vedic remedies (Mantras, Daan, Precautions)
 * - In-App Notification Center Drawer with live countdown timers & Test Notification button
 */

(function (window) {
    'use strict';

    const RASHIS_ENG = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const RASHIS_HIN = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];

    const PLANET_META = {
        sun: { name: 'Sun', hin: 'सूर्य', emoji: '☀️', color: '#f59e0b', symbol: '☉', title: 'Surya' },
        moon: { name: 'Moon', hin: 'चन्द्र', emoji: '🌙', color: '#64748b', symbol: '☽', title: 'Chandra' },
        mars: { name: 'Mars', hin: 'मंगल', emoji: '🔴', color: '#ef4444', symbol: '♂', title: 'Mangal' },
        mercury: { name: 'Mercury', hin: 'बुध', emoji: '💚', color: '#10b981', symbol: '☿', title: 'Budha' },
        jupiter: { name: 'Jupiter', hin: 'बृहस्पति (गुरु)', emoji: '🟡', color: '#b45309', symbol: '♃', title: 'Guru' },
        venus: { name: 'Venus', hin: 'शुक्र', emoji: '💗', color: '#ec4899', symbol: '♀', title: 'Shukra' },
        saturn: { name: 'Saturn', hin: 'शनि देव', emoji: '💙', color: '#1e40af', symbol: '♄', title: 'Shani' },
        rahu: { name: 'Rahu', hin: 'राहु', emoji: '🟣', color: '#6d28d9', symbol: '☊', title: 'Rahu' },
        ketu: { name: 'Ketu', hin: 'केतु', emoji: '⬛', color: '#4b5563', symbol: '☋', title: 'Ketu' }
    };

    // Master list of historical and upcoming pivotal transit events (2026–2028)
    const TRANSIT_EVENTS_DB = [
        {
            id: 'jupiter-cancer-exalted-2026',
            graha: 'jupiter',
            date: '2026-06-02',
            time: '04:18 IST',
            timestamp: new Date('2026-06-02T04:18:00+05:30').getTime(),
            fromSignIdx: 2, // Gemini
            toSignIdx: 3,   // Cancer
            nakshatra: 'Punarvasu Pada 4',
            titleEng: 'Jupiter Ingress into Cancer (Exalted Guru ⭐)',
            titleHin: 'देवगुरु बृहस्पति का कर्क राशि में प्रवेश (परमोच्च)',
            type: 'ingress',
            dignity: 'EXALTED / उच्च',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            generalSummaryHin: 'देवगुरु बृहस्पति अपनी परम उच्च राशि कर्क में प्रवेश कर रहे हैं। हंस महापुरुष राजयोग का निर्माण होगा। धर्म, विद्या व संपत्ति में विस्तार।',
            generalSummaryEng: 'Jupiter enters its exaltation sign of Cancer, forming the auspicious Hamsa Mahapurusha Yoga across world charts.'
        },
        {
            id: 'jupiter-leo-ingress-2026',
            graha: 'jupiter',
            date: '2026-10-31',
            time: '19:25 IST',
            timestamp: new Date('2026-10-31T19:25:00+05:30').getTime(),
            fromSignIdx: 3, // Cancer
            toSignIdx: 4,   // Leo
            nakshatra: 'Magha Pada 1',
            titleEng: 'Jupiter Ingress into Leo (Guru Simha Rashi)',
            titleHin: 'देवगुरु बृहस्पति का सिंह राशि में प्रवेश',
            type: 'ingress',
            dignity: 'FRIEND / मित्र',
            badgeClass: 'bg-[#B45309]/15 text-[#B45309] font-bold',
            generalSummaryHin: 'गुरु का सूर्य की सिंह राशि में गोचर। प्रशासनिक अधिकार, उच्च शिक्षा, नेतृत्व व धार्मिक कार्यों में व्यापक सफलता।',
            generalSummaryEng: 'Jupiter enters royal fire sign Leo. Enhances executive power, creative intellect, and auspicious breakthroughs.'
        },
        {
            id: 'sun-scorpio-sankranti-2026',
            graha: 'sun',
            date: '2026-11-16',
            time: '07:12 IST',
            timestamp: new Date('2026-11-16T07:12:00+05:30').getTime(),
            fromSignIdx: 6, // Libra
            toSignIdx: 7,   // Scorpio
            nakshatra: 'Anuradha Pada 1',
            titleEng: 'Sun Ingress into Scorpio (Vrischika Sankranti)',
            titleHin: 'सूर्य का वृश्चिक राशि में प्रवेश (वृश्चिक संक्रांति)',
            type: 'ingress',
            dignity: 'FRIEND / मित्र',
            badgeClass: 'bg-tertiary-container/20 text-tertiary font-bold',
            generalSummaryHin: 'सूर्य देव मंगल की वृश्चिक राशि में गोचर करेंगे। शोध, दृढ़ संकल्प, आंतरिक शक्ति व गुप्त ज्ञान में रुचि बढ़ेगी।',
            generalSummaryEng: 'Sun enters sidereal Scorpio. Deep research, transformation, willpower, and executive courage favored.'
        },
        {
            id: 'mars-leo-retrograde-2026',
            graha: 'mars',
            date: '2026-11-12',
            time: '08:42 IST',
            timestamp: new Date('2026-11-12T08:42:00+05:30').getTime(),
            fromSignIdx: 4, // Leo
            toSignIdx: 4,
            nakshatra: 'Purva Phalguni',
            titleEng: 'Mars Stationary Retrograde in Leo (Vakri Mangal ⚠️)',
            titleHin: 'मंगल का सिंह राशि में वक्री होना (वक्री मंगल)',
            type: 'retrograde',
            dignity: '℞ VAKRI',
            badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold',
            generalSummaryHin: 'मंगल सिंह राशि में वक्री हो रहे हैं। जल्दबाजी में भूमि सौदे या विवादों से बचें। ऊर्जा को रचनात्मक कार्यों में लगाएं।',
            generalSummaryEng: 'Fiery Mars halts in Leo and begins retrograde motion. Avoid aggressive confrontations or impulsive speculation.'
        },
        {
            id: 'saturn-pisces-direct-2026',
            graha: 'saturn',
            date: '2026-12-05',
            time: '21:10 IST',
            timestamp: new Date('2026-12-05T21:10:00+05:30').getTime(),
            fromSignIdx: 11, // Pisces
            toSignIdx: 11,
            nakshatra: 'Uttara Bhadrapada',
            titleEng: 'Saturn Turns Direct in Pisces (Shani Margi)',
            titleHin: 'शनि देव का मीन राशि में मार्गी होना',
            type: 'direct',
            dignity: 'मार्गी DIRECT',
            badgeClass: 'bg-exalted-emerald/15 text-exalted-emerald font-bold',
            generalSummaryHin: 'न्याय के देवता शनि मीन राशि में सीधे चलेंगे। लंबे समय से अटके कार्यों में गति आएगी। साढ़ेसाती जातकों को मानसिक राहत।',
            generalSummaryEng: 'Saturn resumes direct motion in Pisces. Brings psychological relief to Pisces, Aquarius, and Aries Sade Sati natives.'
        },
        {
            id: 'venus-sagittarius-ingress-2026',
            graha: 'venus',
            date: '2026-12-18',
            time: '14:35 IST',
            timestamp: new Date('2026-12-18T14:35:00+05:30').getTime(),
            fromSignIdx: 7, // Scorpio
            toSignIdx: 8,   // Sagittarius
            nakshatra: 'Mula Pada 1',
            titleEng: 'Venus Ingress into Sagittarius (Dhanu Shukra)',
            titleHin: 'शुक्र का धनु राशि में प्रवेश',
            type: 'ingress',
            dignity: 'NEUTRAL / सम',
            badgeClass: 'bg-secondary-container/30 text-secondary font-bold',
            generalSummaryHin: 'शुक्र देव गुरु की धनु राशि में गोचर करेंगे। यात्रा, उच्च दर्शन, कला, संगीत व दांपत्य जीवन में आनंदमय समय।',
            generalSummaryEng: 'Venus enters Jupiter\'s fiery sign Sagittarius. Fosters philosophical appreciation, artistic joy, and romantic travels.'
        },
        {
            id: 'sun-capricorn-makar-sankranti-2027',
            graha: 'sun',
            date: '2027-01-14',
            time: '15:20 IST',
            timestamp: new Date('2027-01-14T15:20:00+05:30').getTime(),
            fromSignIdx: 8, // Sagittarius
            toSignIdx: 9,   // Capricorn
            nakshatra: 'Uttara Ashadha Pada 2',
            titleEng: 'Makar Sankranti — Sun Ingress to Capricorn (मकर संक्रांति)',
            titleHin: 'मकर संक्रांति: सूर्य का मकर राशि में प्रवेश (उत्तरायण प्रारंभ)',
            type: 'ingress',
            dignity: 'ENEMY SIGN / शत्रु राशि',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            generalSummaryHin: 'पवित्र मकर संक्रांति! सूर्य उत्तरायण में प्रवेश कर रहे हैं। अनुशासन, कठोर परिश्रम, करियर उत्थान व दीर्घकालिक नींव रखने का महापर्व।',
            generalSummaryEng: 'Sacred Makar Sankranti! Sun enters Capricorn initiating the Uttarayana solar cycle. Favors persistent enterprise and karma.'
        },
        {
            id: 'jupiter-cancer-exalted-return-2027',
            graha: 'jupiter',
            date: '2027-01-25',
            time: '10:40 IST',
            timestamp: new Date('2027-01-25T10:40:00+05:30').getTime(),
            fromSignIdx: 4, // Leo
            toSignIdx: 3,   // Cancer
            nakshatra: 'Ashlesha Pada 4',
            titleEng: 'Jupiter Retrograde Return to Cancer (Exalted Peak ⭐)',
            titleHin: 'वक्री गुरु की पुनः कर्क राशि में वापसी (परमोच्च काल)',
            type: 'ingress',
            dignity: 'EXALTED RETURN',
            badgeClass: 'bg-primary-container text-on-primary font-bold shadow-sm',
            generalSummaryHin: 'वक्री गुरु पुनः उच्च राशि कर्क में। पारिवारिक मांगलिक कार्य, घर-जमीन के सौदे व पूर्व जन्म के शुभ कर्मों का फल।',
            generalSummaryEng: 'Retrograde Jupiter re-enters exalted Cancer sign, delivering a rare secondary wave of profound fortune and blessings.'
        }
    ];

    class TransitNotificationManager {
        constructor() {
            this.storageKey = 'grahamandal_transit_notifications_v1';
            this.permissionStatusKey = 'grahamandal_notifications_enabled';
            this.unreadCount = 2;
            this.notificationsEnabled = false;
            this.activeModalTransit = null;

            this.init();
        }

        init() {
            this.notificationsEnabled = localStorage.getItem(this.permissionStatusKey) === 'true';
            this.bindDOM();
            this.checkURLParams();
            this.listenToServiceWorker();
        }

        bindDOM() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupDOM());
            } else {
                this.setupDOM();
            }
        }

        setupDOM() {
            const bellBtn = document.getElementById('transit-alert-bell-btn');
            const drawer = document.getElementById('transit-alerts-drawer');
            const closeDrawerBtn = document.getElementById('close-alerts-drawer-btn');
            const testNotifBtn = document.getElementById('btn-send-test-notification');
            const togglePushBtn = document.getElementById('btn-toggle-push-notif');
            const modalBackdrop = document.getElementById('transit-detail-modal-backdrop');
            const closeModalBtn = document.getElementById('close-transit-detail-modal-btn');
            const shareBtn = document.getElementById('share-transit-whatsapp-btn');

            if (bellBtn) {
                bellBtn.addEventListener('click', () => this.openAlertsDrawer());
            }

            if (closeDrawerBtn) {
                closeDrawerBtn.addEventListener('click', () => this.closeAlertsDrawer());
            }

            if (testNotifBtn) {
                testNotifBtn.addEventListener('click', () => this.sendTestNotification());
            }

            if (togglePushBtn) {
                togglePushBtn.addEventListener('click', () => this.toggleNotificationPermission());
            }

            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => this.closeDetailModal());
            }

            if (modalBackdrop) {
                modalBackdrop.addEventListener('click', (e) => {
                    if (e.target === modalBackdrop) this.closeDetailModal();
                });
            }

            if (shareBtn) {
                shareBtn.addEventListener('click', () => this.shareCurrentTransitWhatsApp());
            }

            // Keyboard Escape key to close modal/drawer
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeDetailModal();
                    this.closeAlertsDrawer();
                }
            });

            this.updateBadgeCountUI();
            this.renderAlertsList();
            this.updateNotificationToggleUI();
        }

        checkURLParams() {
            if (!window.location) return;
            try {
                const searchStr = window.location.search || '';
                const hashStr = window.location.hash || '';
                const urlParams = typeof URLSearchParams !== 'undefined' ? new URLSearchParams(searchStr) : null;
                const transitId = (urlParams && urlParams.get('transit')) || hashStr.replace('#transit=', '');
                if (transitId) {
                    const event = TRANSIT_EVENTS_DB.find(e => e.id === transitId);
                    if (event) {
                        setTimeout(() => this.openTransitDetailModal(event), 300);
                    }
                }
            } catch (e) { }
        }

        listenToServiceWorker() {
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'OPEN_TRANSIT_MODAL') {
                        const transitId = event.data.transitId;
                        const ev = TRANSIT_EVENTS_DB.find(e => e.id === transitId) || TRANSIT_EVENTS_DB[0];
                        this.openTransitDetailModal(ev);
                    }
                });
            }
        }

        // ==========================================
        // PERSONALIZED INGRESS INTELLIGENCE ENGINE
        // ==========================================

        /**
         * Calculates custom significance for any transit event relative to user's saved birth profile
         */
        getPersonalizedTransitInsight(transitEvent, userProfile) {
            const grahaMeta = PLANET_META[transitEvent.graha] || PLANET_META.saturn;
            const toSignIdx = transitEvent.toSignIdx !== undefined ? transitEvent.toSignIdx : 11;
            const toRashiEng = RASHIS_ENG[toSignIdx];
            const toRashiHin = RASHIS_HIN[toSignIdx];

            if (!userProfile || !userProfile.birthChart) {
                // Generic insight when no user profile is saved
                return {
                    hasProfile: false,
                    grahaMeta,
                    toRashiEng,
                    toRashiHin,
                    shortTitle: `${grahaMeta.emoji} ${transitEvent.titleHin || transitEvent.titleEng}`,
                    shortSignificanceHin: transitEvent.generalSummaryHin,
                    shortSignificanceEng: transitEvent.generalSummaryEng,
                    careerPhalaHin: 'करियर व व्यावसायिक क्षेत्र में इस गोचर का सकारात्मक या चुनौतीपूर्ण प्रभाव देखने को मिलेगा। अपनी व्यक्तिगत कुंडली से सटीक फल जानें।',
                    wealthPhalaHin: 'धन व संपत्ति से जुड़े महत्वपूर्ण निर्णय सोच-समझकर लें।',
                    healthPhalaHin: 'स्वास्थ्य व दिनचर्या में सात्विक नियमों का पालन करें।',
                    remediesHin: 'संबंधित ग्रह के वैदिक मंत्र का जप व दान-पुण्य करना कल्याणकारी रहेगा।'
                };
            }

            // User has a saved birth profile!
            const natalAscSign = userProfile.ascSign;
            const natalMoonSign = userProfile.moonSign;
            const userName = userProfile.name || 'साधक';

            const houseFromLagna = ((toSignIdx - natalAscSign + 12) % 12) + 1;
            const houseFromMoon = ((toSignIdx - natalMoonSign + 12) % 12) + 1;

            let disposition = 'Neutral / सामान्य';
            let dispositionClass = 'bg-surface-container-high text-muted-lavender';
            let shortSignificanceHin = '';
            let shortSignificanceEng = '';
            let sadeSatiAlert = null;
            let guruBalamAlert = null;

            // Specialized Graha Rules: Saturn (Sade Sati / Dhaiya)
            if (transitEvent.graha === 'saturn') {
                if (houseFromMoon === 12) {
                    sadeSatiAlert = 'साढ़ेसाती: प्रथम चरण (उदित / 1st Phase)';
                    disposition = 'सतर्कता / Caution (Phase 1)';
                    dispositionClass = 'bg-tertiary-container/20 text-tertiary font-bold';
                    shortSignificanceHin = `${userName} जी, शनि आपकी जन्म राशि से 12वें भाव में प्रवेश कर रहे हैं। साढ़ेसाती का प्रथम चरण शुरू। अनियोजित खर्चों पर नियंत्रण रखें, विदेश अथवा दूरस्थ यात्रा के योग हैं।`;
                    shortSignificanceEng = `${userName}, Saturn enters your 12th house from Moon initiating Sade Sati Phase 1. Control unplanned expenses; spiritual and foreign avenues open.`;
                } else if (houseFromMoon === 1) {
                    sadeSatiAlert = 'साढ़ेसाती: द्वितीय चरण (शिखर / Peak Janma Shani)';
                    disposition = 'कठोर परीक्षा / Peak (Phase 2)';
                    dispositionClass = 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold';
                    shortSignificanceHin = `${userName} जी, शनि आपकी जन्म राशि (चंद्र) पर से गोचर करेंगे। यह साढ़ेसाती का शिखर काल है। मानसिक धैर्य रखें, कठोर परिश्रम से स्थायी सफलता मिलेगी।`;
                    shortSignificanceEng = `${userName}, Saturn transits directly over natal Moon (Janma Shani). Peak transformative phase requiring high resilience and discipline.`;
                } else if (houseFromMoon === 2) {
                    sadeSatiAlert = 'साढ़ेसाती: तृतीय चरण (उतरती / 3rd Phase)';
                    disposition = 'उतरती साढ़ेसाती (Phase 3)';
                    dispositionClass = 'bg-primary-container/25 text-primary font-bold';
                    shortSignificanceHin = `${userName} जी, शनि आपके द्वितीय भाव में प्रवेश कर रहे हैं। साढ़ेसाती का उतरता चरण शुरू। वित्तीय स्थिरता आएगी व पुराने संकट समाप्त होंगे।`;
                    shortSignificanceEng = `${userName}, Saturn enters 2nd house from Moon. Setting phase of Sade Sati bringing financial consolidation and relief.`;
                } else if (houseFromMoon === 4) {
                    sadeSatiAlert = 'शनि की चतुर्थ ढैय्या (कंटक शनि)';
                    disposition = 'चतुर्थ ढैय्या / Kantaka';
                    dispositionClass = 'bg-tertiary-container/20 text-tertiary font-bold';
                    shortSignificanceHin = `${userName} जी, चंद्र से चतुर्थ भाव में शनि का प्रवेश। घरेलू शांति व माता के स्वास्थ्य पर ध्यान आवश्यक है।`;
                    shortSignificanceEng = `${userName}, Saturn in 4th from Moon initiates Kantaka Dhaiya. Focus on domestic harmony and real estate prudence.`;
                } else if (houseFromMoon === 8) {
                    sadeSatiAlert = 'शनि की अष्टम ढैय्या (अष्टम शनि)';
                    disposition = 'अष्टम ढैय्या / Ashtama';
                    dispositionClass = 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold';
                    shortSignificanceHin = `${userName} जी, शनि आपकी राशि से अष्टम भाव में गोचर करेंगे। स्वास्थ्य व खानपान में विशेष सतर्कता रखें। योग-प्राणायाम लाभकारी है।`;
                    shortSignificanceEng = `${userName}, Saturn enters 8th from Moon. Practice high health care and avoid risky speculations.`;
                } else if ([3, 6, 11].includes(houseFromMoon)) {
                    disposition = 'अति शुभ गोचर / Highly Benefic';
                    dispositionClass = 'bg-secondary/15 text-secondary font-bold';
                    shortSignificanceHin = `${userName} जी, शनि का यह गोचर आपके लिए अत्यंत शुभ है! शत्रुओं पर विजय, कार्यक्षेत्र में प्रतिष्ठा व स्थिर धन लाभ के योग।`;
                    shortSignificanceEng = `${userName}, Saturn in an Upachaya house (3, 6, 11) is exceptionally benefic! Triumph over rivals and steady asset growth.`;
                } else {
                    disposition = 'सामान्य / Neutral';
                    shortSignificanceHin = `${userName} जी, शनि देव आपके लग्न से ${houseFromLagna}वें व चंद्र से ${houseFromMoon}वें भाव में गतिशील हैं। निष्काम कर्म से लाभ होगा।`;
                    shortSignificanceEng = `${userName}, Saturn activates house ${houseFromLagna} from Lagna. Dedicated duty brings steady progress.`;
                }
            } else if (transitEvent.graha === 'jupiter') {
                if ([2, 5, 7, 9, 11].includes(houseFromMoon)) {
                    guruBalamAlert = `गुरु बल प्राप्त (शुभ ${houseFromMoon}वां भाव)`;
                    disposition = 'परम शुभ (गुरु बल प्राप्त) ⭐';
                    dispositionClass = 'bg-secondary/15 text-secondary font-bold';
                    shortSignificanceHin = `${userName} जी, देवगुरु बृहस्पति आपकी चंद्र राशि से शुभ ${houseFromMoon}वें भाव में प्रवेश कर रहे हैं! मांगलिक कार्य, धन वृद्धि, ज्ञान व भाग्य का भरपूर साथ मिलेगा।`;
                    shortSignificanceEng = `${userName}, Jupiter enters auspicious house ${houseFromMoon} from Moon! Blessed Guru Balam brings wealth, marriage, and supreme fortune.`;
                } else {
                    disposition = 'आत्म-चिंतन व साधना';
                    dispositionClass = 'bg-surface-container-high text-muted-lavender';
                    shortSignificanceHin = `${userName} जी, गुरु आपके लग्न से ${houseFromLagna}वें भाव में हैं। आध्यात्मिक ज्ञान, योजना निर्माण व भविष्य की तैयारी के लिए उत्तम समय।`;
                    shortSignificanceEng = `${userName}, Jupiter in house ${houseFromLagna} from Lagna. Excellent for internal wisdom and long-term planning.`;
                }
            } else if (transitEvent.graha === 'sun') {
                if ([3, 6, 10, 11].includes(houseFromMoon)) {
                    disposition = 'अति शुभ संक्रांति / Benefic';
                    dispositionClass = 'bg-secondary/15 text-secondary font-bold';
                    shortSignificanceHin = `${userName} जी, सूर्य देव आपके उपचय भाव में आ रहे हैं। सरकारी कार्यों में सफलता, आत्मविश्वास व मान-सम्मान में वृद्धि होगी।`;
                    shortSignificanceEng = `${userName}, Sun enters an Upachaya house. Superb for career authority, leadership, and public recognition.`;
                } else {
                    shortSignificanceHin = `${userName} जी, सूर्य आपकी कुंडली के ${houseFromLagna}वें भाव को प्रकाशित कर रहे हैं। अहंकार व क्रोध से बचें, नित्य सूर्य अर्घ्य दें।`;
                    shortSignificanceEng = `${userName}, Sun illuminates house ${houseFromLagna} of your birth chart. Maintain humility in speech.`;
                }
            } else if (transitEvent.graha === 'mars') {
                if ([3, 6, 11].includes(houseFromMoon)) {
                    disposition = 'महाबली गोचर / Victorious';
                    dispositionClass = 'bg-secondary/15 text-secondary font-bold';
                    shortSignificanceHin = `${userName} जी, मंगल का यह गोचर आपको अदम्य साहस, प्रतियोगिता में विजय व संपत्ति लाभ दिलाएगा।`;
                    shortSignificanceEng = `${userName}, Mars in house ${houseFromMoon} delivers high courage, athletic stamina, and victory over adversaries.`;
                } else {
                    disposition = 'सतर्कता / Caution';
                    dispositionClass = 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold';
                    shortSignificanceHin = `${userName} जी, मंगल आपके ${houseFromLagna}वें भाव में गतिशील हैं। वाहन व अग्नि से सावधान रहें, विवादों से दूरी रखें।`;
                    shortSignificanceEng = `${userName}, Mars activates house ${houseFromLagna}. Exercise patience in driving and property discussions.`;
                }
            } else {
                shortSignificanceHin = `${userName} जी, ${grahaMeta.hin} का ${toRashiHin} राशि में प्रवेश आपके जन्म लग्न से ${houseFromLagna}वें भाव व चंद्र से ${houseFromMoon}वें भाव को सक्रिय कर रहा है।`;
                shortSignificanceEng = `${userName}, ${grahaMeta.name} ingress to ${toRashiEng} activates house ${houseFromLagna} from your Lagna.`;
            }

            // Detailed category predictions
            const houseThemes = {
                1: 'व्यक्तित्व, स्वास्थ्य, आत्म-विश्वास व नई शुरुआत',
                2: 'धन-संपत्ति, कुटुंब, वाणी व बचत',
                3: 'साहस, पराक्रम, छोटे भाई-बहन व संचार',
                4: 'गृह-सुख, माता, वाहन, जमीन व मानसिक शांति',
                5: 'संतान, उच्च विद्या, मंत्र सिद्धि व रचनात्मकता',
                6: 'शत्रु विजय, रोग मुक्ति, प्रतियोगिता व ऋण समाधान',
                7: 'दांपत्य जीवन, विवाह, साझेदारी व जनसंपर्क',
                8: 'आयु, गूढ़ विद्या, आकस्मिक परिवर्तन व शोध',
                9: 'भाग्य, धर्म, तीर्थयात्रा, पिता व गुरु कृपा',
                10: 'करियर, आजीविका, पद-प्रतिष्ठा व उच्चाधिकारी',
                11: 'सर्व कार्य सिद्धि, आकस्मिक धन लाभ व मित्र मंडली',
                12: 'व्यय नियंत्रण, विदेश यात्रा, मोक्ष व आध्यात्मिक साधना'
            };

            const careerPhalaHin = `यह गोचर आपके कर्म व आजीविका क्षेत्र में प्रभाव डालेगा। आपके जन्म लग्न से ${houseFromLagna}वां भाव सक्रिय होने से ${houseThemes[houseFromLagna]} से जुड़े विषय प्राथमिकता पर रहेंगे।`;
            const wealthPhalaHin = (houseFromLagna === 2 || houseFromLagna === 11 || houseFromMoon === 2 || houseFromMoon === 11)
                ? 'आर्थिक दृष्टिकोण से यह गोचर अत्यंत फलदायी है। धन संचय व आय के नए द्वार खुलेंगे।'
                : (houseFromLagna === 12 || houseFromMoon === 12)
                ? 'अनियोजित खर्चों व विलासिता पर बजट नियंत्रण रखें। दीर्घकालिक निवेश हितकर रहेगा।'
                : 'वित्तीय स्थिति संतुलित रहेगी। नियमित बजट का पालन करें।';

            const healthPhalaHin = (houseFromLagna === 1 || houseFromLagna === 6 || houseFromLagna === 8)
                ? 'स्वास्थ्य के प्रति सजग रहें। नित्य प्राणायाम, शुद्ध खानपान व पर्याप्त नींद लें।'
                : 'स्वास्थ्य उत्तम रहेगा। सकारात्मक ऊर्जा का संचार होगा।';

            let remediesHin = 'गायत्री मंत्र अथवा नवग्रह स्तोत्र का पाठ करें।';
            if (transitEvent.graha === 'saturn') {
                remediesHin = 'शनिवार को पीपल के नीचे सरसों के तेल का दीपक जलाएं, हनुमान चालीसा का पाठ करें व जरूरतमंदों को काले तिल/उड़द का दान करें।';
            } else if (transitEvent.graha === 'jupiter') {
                remediesHin = 'गुरुवार को भगवान विष्णु की आराधना करें, पीले फल या चने की दाल का दान करें व ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः का जप करें।';
            } else if (transitEvent.graha === 'sun') {
                remediesHin = 'प्रतिदिन तांबे के लोटे से सूर्य को जल (अर्घ्य) अर्पित करें, आदित्य हृदय स्तोत्र का पाठ करें व पिता का चरण स्पर्श कर आशीर्वाद लें।';
            } else if (transitEvent.graha === 'mars') {
                remediesHin = 'मंगलवार को सुंदरकांड का पाठ करें, गुड़ व मसूर की दाल का दान करें व क्रोध पर संयम रखें।';
            }

            return {
                hasProfile: true,
                grahaMeta,
                toRashiEng,
                toRashiHin,
                userName,
                houseFromLagna,
                houseFromMoon,
                disposition,
                dispositionClass,
                sadeSatiAlert,
                guruBalamAlert,
                shortTitle: `${grahaMeta.emoji} ${transitEvent.titleHin || transitEvent.titleEng}`,
                shortSignificanceHin,
                shortSignificanceEng,
                careerPhalaHin,
                wealthPhalaHin,
                healthPhalaHin,
                remediesHin
            };
        }

        // ==========================================
        // WEB NOTIFICATIONS & BROWSER ALERT ENGINE
        // ==========================================

        async requestNotificationPermission() {
            if (!('Notification' in window)) {
                alert('This browser does not support desktop/mobile notifications.');
                return false;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.notificationsEnabled = true;
                    localStorage.setItem(this.permissionStatusKey, 'true');
                    this.updateNotificationToggleUI();
                    return true;
                } else {
                    this.notificationsEnabled = false;
                    localStorage.setItem(this.permissionStatusKey, 'false');
                    this.updateNotificationToggleUI();
                    return false;
                }
            } catch (err) {
                console.warn('Error requesting notification permission:', err);
                return false;
            }
        }

        async toggleNotificationPermission() {
            if (this.notificationsEnabled) {
                this.notificationsEnabled = false;
                localStorage.setItem(this.permissionStatusKey, 'false');
                this.updateNotificationToggleUI();
            } else {
                const granted = await this.requestNotificationPermission();
                if (granted) {
                    this.sendNativePushAlert({
                        title: '🔔 Transit Alerts Activated (गोचर सूचनाएं सक्रिय)',
                        body: 'Grahamandal will now notify you the exact moment any planet ingresses, with personalized insights tailored to your chart.',
                        transitId: 'jupiter-cancer-exalted-2026'
                    });
                }
            }
        }

        updateNotificationToggleUI() {
            const toggleBtn = document.getElementById('btn-toggle-push-notif');
            const toggleIcon = document.getElementById('push-notif-toggle-icon');
            const toggleLabel = document.getElementById('push-notif-toggle-label');
            const statusBadge = document.getElementById('push-notif-status-badge');

            if (!toggleBtn) return;

            const isAllowed = ('Notification' in window) && Notification.permission === 'granted' && this.notificationsEnabled;

            if (isAllowed) {
                toggleBtn.className = "px-3 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/30 flex items-center gap-1.5 transition-all";
                if (toggleIcon) toggleIcon.textContent = 'notifications_active';
                if (toggleLabel) toggleLabel.textContent = 'Alerts: ON (सक्रिय)';
                if (statusBadge) {
                    statusBadge.textContent = 'Live Push Enabled';
                    statusBadge.className = 'text-[10px] text-secondary font-semibold';
                }
            } else {
                toggleBtn.className = "px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high hover:bg-primary-container/20 text-cosmic-slate border border-black/10 flex items-center gap-1.5 transition-all";
                if (toggleIcon) toggleIcon.textContent = 'notifications_off';
                if (toggleLabel) toggleLabel.textContent = 'Enable Alerts (चालू करें)';
                if (statusBadge) {
                    statusBadge.textContent = 'Disabled';
                    statusBadge.className = 'text-[10px] text-muted-lavender font-medium';
                }
            }
        }

        sendNativePushAlert({ title, body, transitId }) {
            const options = {
                body: body,
                icon: 'favicon.png',
                badge: 'favicon.png',
                vibrate: [200, 100, 200],
                data: { transitId: transitId || 'jupiter-cancer-exalted-2026' },
                tag: 'grahamandal-transit-' + (transitId || Date.now())
            };

            // If ServiceWorker registration is ready, show rich notification through SW
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, options);
                }).catch(() => {
                    new Notification(title, options);
                });
            } else if ('Notification' in window && Notification.permission === 'granted') {
                const notif = new Notification(title, options);
                notif.onclick = () => {
                    window.focus();
                    const ev = TRANSIT_EVENTS_DB.find(e => e.id === transitId) || TRANSIT_EVENTS_DB[0];
                    this.openTransitDetailModal(ev);
                };
            }
        }

        async sendTestNotification() {
            // Check permission
            if (!('Notification' in window) || Notification.permission !== 'granted') {
                const granted = await this.requestNotificationPermission();
                if (!granted) {
                    alert('Please allow notification permissions in your browser to receive live transit alerts.');
                    return;
                }
            }

            // Pick upcoming or pivotal transit
            const testEvent = TRANSIT_EVENTS_DB[1]; // Jupiter to Leo
            const profile = (window.personalTransit && window.personalTransit.profile) ? window.personalTransit.profile : null;
            const insight = this.getPersonalizedTransitInsight(testEvent, profile);

            const title = `${insight.grahaMeta.emoji} ${testEvent.titleHin || testEvent.titleEng}`;
            const body = insight.shortSignificanceHin;

            this.sendNativePushAlert({
                title: title,
                body: body,
                transitId: testEvent.id
            });

            // Decrement badge count
            if (this.unreadCount > 0) this.unreadCount--;
            this.updateBadgeCountUI();
        }

        updateBadgeCountUI() {
            const badge = document.getElementById('alert-badge-count');
            if (!badge) return;

            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        // ==========================================
        // IN-APP NOTIFICATION CENTER DRAWER
        // ==========================================

        openAlertsDrawer() {
            const drawer = document.getElementById('transit-alerts-drawer');
            if (drawer) {
                drawer.classList.remove('hidden');
                // Re-render list with live countdowns
                this.renderAlertsList();
                this.updateNotificationToggleUI();
            }
        }

        closeAlertsDrawer() {
            const drawer = document.getElementById('transit-alerts-drawer');
            if (drawer) drawer.classList.add('hidden');
        }

        renderAlertsList() {
            const listEl = document.getElementById('alerts-events-list');
            if (!listEl) return;

            const profile = (window.personalTransit && window.personalTransit.profile) ? window.personalTransit.profile : null;
            const now = Date.now();

            let html = '';

            TRANSIT_EVENTS_DB.forEach(event => {
                const insight = this.getPersonalizedTransitInsight(event, profile);
                const isUpcoming = event.timestamp > now;
                const timeDiffDays = Math.ceil(Math.abs(event.timestamp - now) / (1000 * 60 * 60 * 24));
                const timingBadge = isUpcoming
                    ? `<span class="px-2 py-0.5 rounded-full text-[10px] bg-secondary/15 text-secondary font-bold">In ${timeDiffDays} Days</span>`
                    : `<span class="px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-muted-lavender font-medium">${event.date}</span>`;

                html += `
                    <div class="flex flex-col bg-surface-container-lowest p-3 rounded-xl border border-black/5 shadow-sm space-y-2 hover:border-primary/40 transition-all cursor-pointer group" data-transit-id="${event.id}">
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0 shadow-sm border border-primary/20">
                                    ${insight.grahaMeta.emoji}
                                </span>
                                <div class="flex flex-col min-w-0">
                                    <span class="font-bold text-xs sm:text-sm text-cosmic-slate leading-tight truncate group-hover:text-primary transition-colors">
                                        ${event.titleHin || event.titleEng}
                                    </span>
                                    <span class="text-[10px] text-muted-lavender">
                                        ${event.date} • ${event.time} • ${event.nakshatra}
                                    </span>
                                </div>
                            </div>
                            <div class="shrink-0 flex items-center gap-1">
                                ${timingBadge}
                            </div>
                        </div>

                        <!-- Short Significance Summary Banner -->
                        <div class="p-2 rounded-lg bg-parchment-container/60 border border-black/5 text-[11px] text-on-surface-variant leading-relaxed">
                            <div class="flex items-center gap-1 font-semibold text-cosmic-slate text-[10px] mb-0.5">
                                <span class="material-symbols-outlined text-[13px] text-primary">auto_awesome</span>
                                <span>${insight.hasProfile ? `${insight.userName} के लिए संक्षिप्त फल:` : 'संक्षिप्त गोचर फल:'}</span>
                                ${insight.sadeSatiAlert ? `<span class="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-retrograde-ruby/15 text-retrograde-ruby font-bold">साढ़ेसाती</span>` : ''}
                            </div>
                            <p class="text-[11px] line-clamp-2">${insight.shortSignificanceHin}</p>
                        </div>

                        <!-- Action trigger -->
                        <div class="flex items-center justify-between pt-1 border-t border-black/5 text-[11px]">
                            <span class="text-[10px] text-muted-lavender">
                                ${insight.hasProfile ? `Lagna: H${insight.houseFromLagna} • Moon: H${insight.houseFromMoon}` : 'Personal chart not linked'}
                            </span>
                            <button type="button" class="btn-open-transit-modal text-primary font-bold hover:underline flex items-center gap-0.5 active:scale-95 transition-all" data-transit-id="${event.id}">
                                <span>Detailed Significance</span>
                                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                `;
            });

            listEl.innerHTML = html;

            // Attach click listeners to cards and buttons
            listEl.querySelectorAll('[data-transit-id]').forEach(item => {
                item.addEventListener('click', (e) => {
                    const id = item.getAttribute('data-transit-id');
                    const ev = TRANSIT_EVENTS_DB.find(t => t.id === id);
                    if (ev) {
                        this.closeAlertsDrawer();
                        this.openTransitDetailModal(ev);
                    }
                });
            });
        }

        // ==========================================
        // DETAILED PERSONALIZED INGRESS MODAL
        // ==========================================

        openTransitDetailModal(transitEvent) {
            this.activeModalTransit = transitEvent;
            const modal = document.getElementById('transit-detail-modal');
            const backdrop = document.getElementById('transit-detail-modal-backdrop');
            if (!modal || !backdrop) return;

            const profile = (window.personalTransit && window.personalTransit.profile) ? window.personalTransit.profile : null;
            const insight = this.getPersonalizedTransitInsight(transitEvent, profile);

            // Populate Modal Fields
            const titleEl = document.getElementById('modal-transit-title');
            const subtitleEl = document.getElementById('modal-transit-subtitle');
            const dateEl = document.getElementById('modal-transit-date');
            const emblemEl = document.getElementById('modal-transit-emblem');
            const badgesContainer = document.getElementById('modal-transit-badges-container');
            const careerEl = document.getElementById('modal-transit-career');
            const wealthEl = document.getElementById('modal-transit-wealth');
            const healthEl = document.getElementById('modal-transit-health');
            const remediesEl = document.getElementById('modal-transit-remedies');
            const profileNoticeEl = document.getElementById('modal-profile-status-notice');

            if (titleEl) titleEl.textContent = transitEvent.titleHin || transitEvent.titleEng;
            if (subtitleEl) subtitleEl.textContent = `${insight.grahaMeta.hin} का ${insight.toRashiHin} (${insight.toRashiEng}) में गोचर • ${transitEvent.nakshatra}`;
            if (dateEl) dateEl.textContent = `${transitEvent.date} (${transitEvent.time})`;
            if (emblemEl) emblemEl.textContent = insight.grahaMeta.emoji;

            // Badges
            if (badgesContainer) {
                let badgesHtml = `
                    <span class="px-2.5 py-0.5 rounded-full text-xs ${transitEvent.badgeClass}">
                        ${transitEvent.dignity}
                    </span>
                `;

                if (insight.hasProfile) {
                    badgesHtml += `
                        <span class="px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-bold">
                            लग्न से: ${insight.houseFromLagna}वां भाव
                        </span>
                        <span class="px-2.5 py-0.5 rounded-full text-xs bg-secondary/10 text-secondary font-bold">
                            चंद्र से: ${insight.houseFromMoon}वां भाव
                        </span>
                    `;
                    if (insight.sadeSatiAlert) {
                        badgesHtml += `
                            <span class="px-2.5 py-0.5 rounded-full text-xs bg-retrograde-ruby/15 text-retrograde-ruby font-bold animate-pulse">
                                ${insight.sadeSatiAlert}
                            </span>
                        `;
                    }
                    if (insight.guruBalamAlert) {
                        badgesHtml += `
                            <span class="px-2.5 py-0.5 rounded-full text-xs bg-secondary/15 text-secondary font-bold">
                                ${insight.guruBalamAlert}
                            </span>
                        `;
                    }
                }

                badgesContainer.innerHTML = badgesHtml;
            }

            // Predictions
            if (careerEl) careerEl.textContent = insight.careerPhalaHin;
            if (wealthEl) wealthEl.textContent = insight.wealthPhalaHin;
            if (healthEl) healthEl.textContent = insight.healthPhalaHin;
            if (remediesEl) remediesEl.textContent = insight.remediesHin;

            // Profile status notice banner
            if (profileNoticeEl) {
                if (insight.hasProfile) {
                    profileNoticeEl.innerHTML = `
                        <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold">
                            <span class="flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[16px]">verified</span>
                                <span>यह विश्लेषण ${insight.userName} की जन्म कुंडली (${RASHIS_HIN[profile.ascSign]} लग्न) के आधार पर परिकलित है।</span>
                            </span>
                        </div>
                    `;
                } else {
                    profileNoticeEl.innerHTML = `
                        <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-parchment-container border border-primary/30 text-cosmic-slate">
                            <span class="flex items-center gap-1.5 font-medium">
                                <span class="material-symbols-outlined text-[16px] text-primary">person_add</span>
                                <span>अपनी जन्म कुंडली जोड़ें ताकि यह गोचर सीधे आपके 12 भावों के अनुसार दिखे।</span>
                            </span>
                            <button type="button" id="btn-modal-open-profile" class="px-2.5 py-1 rounded-full bg-primary-container text-on-primary text-xs font-bold active:scale-95 transition-all">
                                ऐड करें
                            </button>
                        </div>
                    `;
                    const addBtn = document.getElementById('btn-modal-open-profile');
                    if (addBtn) {
                        addBtn.addEventListener('click', () => {
                            this.closeDetailModal();
                            if (window.personalTransit) window.personalTransit.openDrawer();
                        });
                    }
                }
            }

            backdrop.classList.remove('hidden');
            modal.classList.remove('hidden');
        }

        closeDetailModal() {
            const modal = document.getElementById('transit-detail-modal');
            const backdrop = document.getElementById('transit-detail-modal-backdrop');
            if (modal) modal.classList.add('hidden');
            if (backdrop) backdrop.classList.add('hidden');
        }

        shareCurrentTransitWhatsApp() {
            if (!this.activeModalTransit) return;
            const profile = (window.personalTransit && window.personalTransit.profile) ? window.personalTransit.profile : null;
            const insight = this.getPersonalizedTransitInsight(this.activeModalTransit, profile);

            const title = this.activeModalTransit.titleHin || this.activeModalTransit.titleEng;
            const date = this.activeModalTransit.date;
            const text = `🪐 *${title}* (${date})\n\n${insight.shortSignificanceHin}\n\n🕉️ *उपाय:* ${insight.remediesHin}\n\n👉 *Live Gochar Kundali देखें:* https://grahamandal.pages.dev`;
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
        }
    }

    // Expose instance globally
    window.transitNotificationManager = new TransitNotificationManager();

})(window);
