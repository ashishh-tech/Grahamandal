/**
 * personal-transit.js — Personal Live Transit & OpenStreetMap Location Engine
 * Grahamandal (ग्रह मंडल)
 * 
 * Features:
 * - Free location search & reverse geocoding via OpenStreetMap (Nominatim API)
 * - Browser GPS Auto-detection (navigator.geolocation)
 * - Offline fallback database of 40+ major Indian & global Vedic centers
 * - Birth Chart (Janma Kundali) calculation via VedicAstrologyEngine
 * - Real-Time Personalized Gochar (Transit) vs Natal Lagna & Moon Sign
 * - Real-time Shani Sade Sati (Phase 1, Peak, Phase 3) & Dhaiya detection
 * - Jupiter Guru Balam & planetary transit house activations
 * - Seamless localStorage persistence
 */

(function (window) {
    'use strict';

    // 40+ Major Indian & Global Cities (Instant Offline + Pre-lookup fallback)
    const PRESET_CITIES = [
        { name: 'New Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, tz: 5.5 },
        { name: 'Varanasi (Kashi)', state: 'Uttar Pradesh', country: 'India', lat: 25.3176, lon: 82.9739, tz: 5.5 },
        { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777, tz: 5.5 },
        { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, tz: 5.5 },
        { name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639, tz: 5.5 },
        { name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707, tz: 5.5 },
        { name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lon: 78.4867, tz: 5.5 },
        { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567, tz: 5.5 },
        { name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714, tz: 5.5 },
        { name: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873, tz: 5.5 },
        { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lon: 80.9462, tz: 5.5 },
        { name: 'Patna', state: 'Bihar', country: 'India', lat: 25.5941, lon: 85.1376, tz: 5.5 },
        { name: 'Ujjain (Mahakal)', state: 'Madhya Pradesh', country: 'India', lat: 23.1765, lon: 75.7885, tz: 5.5 },
        { name: 'Ayodhya', state: 'Uttar Pradesh', country: 'India', lat: 26.7922, lon: 82.1998, tz: 5.5 },
        { name: 'Haridwar', state: 'Uttarakhand', country: 'India', lat: 29.9457, lon: 78.1642, tz: 5.5 },
        { name: 'Rishikesh', state: 'Uttarakhand', country: 'India', lat: 30.0869, lon: 78.2676, tz: 5.5 },
        { name: 'Mathura', state: 'Uttar Pradesh', country: 'India', lat: 27.4924, lon: 77.6737, tz: 5.5 },
        { name: 'Gaya', state: 'Bihar', country: 'India', lat: 24.7914, lon: 85.0002, tz: 5.5 },
        { name: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7196, lon: 75.8577, tz: 5.5 },
        { name: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: 23.2599, lon: 77.4126, tz: 5.5 },
        { name: 'Chandigarh', state: 'Punjab/Haryana', country: 'India', lat: 30.7333, lon: 76.7794, tz: 5.5 },
        { name: 'Surat', state: 'Gujarat', country: 'India', lat: 21.1702, lon: 72.8311, tz: 5.5 },
        { name: 'Nagpur', state: 'Maharashtra', country: 'India', lat: 21.1458, lon: 79.0882, tz: 5.5 },
        { name: 'Tirupati', state: 'Andhra Pradesh', country: 'India', lat: 13.6288, lon: 79.4192, tz: 5.5 },
        { name: 'Puri', state: 'Odisha', country: 'India', lat: 19.8135, lon: 85.8312, tz: 5.5 },
        { name: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1445, lon: 91.7362, tz: 5.5 },
        { name: 'Kathmandu', state: 'Bagmati', country: 'Nepal', lat: 27.7172, lon: 85.3240, tz: 5.75 },
        { name: 'London', state: 'England', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, tz: 0 },
        { name: 'New York', state: 'NY', country: 'USA', lat: 40.7128, lon: -74.0060, tz: -5 },
        { name: 'San Francisco', state: 'CA', country: 'USA', lat: 37.7749, lon: -122.4194, tz: -8 },
        { name: 'Dubai', state: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, tz: 4 },
        { name: 'Singapore', state: 'Central', country: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 8 },
        { name: 'Toronto', state: 'ON', country: 'Canada', lat: 43.6532, lon: -79.3832, tz: -5 },
        { name: 'Sydney', state: 'NSW', country: 'Australia', lat: -33.8688, lon: 151.2093, tz: 10 }
    ];

    const RASHIS_ENG = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const RASHIS_HIN = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];

    const HOUSE_NAMES_ENG = [
        '1st House (Lagna / Self)', '2nd House (Dhana / Wealth)', '3rd House (Sahaja / Courage)',
        '4th House (Sukha / Home)', '5th House (Putra / Intellect)', '6th House (Shatru / Health)',
        '7th House (Kalatra / Spouse)', '8th House (Ayur / Longevity)', '9th House (Bhagya / Dharma)',
        '10th House (Karma / Career)', '11th House (Labha / Gains)', '12th House (Vyaya / Moksha)'
    ];

    const HOUSE_NAMES_HIN = [
        'प्रथम भाव (लग्न/तनु)', 'द्वितीय भाव (धन/वाणी)', 'तृतीय भाव (सहज/पराक्रम)',
        'चतुर्थ भाव (सुख/मातृ)', 'पंचम भाव (पुत्र/विद्या)', 'षष्ठ भाव (रिपु/रोग)',
        'सप्तम भाव (कलत्र/दाम्पत्य)', 'अष्टम भाव (आयु/गूढ़)', 'नवम भाव (भाग्य/धर्म)',
        'दशम भाव (कर्म/आजीविका)', 'एकादश भाव (लाभ/आय)', 'द्वादश भाव (व्यय/मोक्ष)'
    ];

    // Classical Brihat Parashara Hora Shastra Gochar effects for each planet in houses 1-12 from Lagna/Moon
    const GOCHAR_INTERPRETATIONS = {
        sun: {
            1: { type: 'mixed', hin: 'स्वास्थ्य सतर्कता, मान-सम्मान में वृद्धि परंतु अहंकार से बचाव', eng: 'Focus on self-vitality, authority; avoid ego clashes' },
            2: { type: 'neutral', hin: 'धन व्यय, वाणी पर संयम रखें, पारिवारिक विचार-विमर्श', eng: 'Financial planning, watch speech, family matters' },
            3: { type: 'benefic', hin: 'शुभ गोचर: पराक्रम में वृद्धि, नए साहसपूर्ण कार्यों में सफलता', eng: 'Benefic: Courage rewarded, victory, successful short travels' },
            4: { type: 'challenging', hin: 'मानसिक अशांति, माता के स्वास्थ्य व घरेलू मामलों पर ध्यान दें', eng: 'Domestic stress, care for mother\'s wellbeing & property' },
            5: { type: 'neutral', hin: 'संतान व अध्ययन पर ध्यान, सट्टेबाजी व जोखिम से बचें', eng: 'Focus on intellect & creative study; avoid speculation' },
            6: { type: 'benefic', hin: 'अति शुभ गोचर: शत्रुओं पर विजय, रोग व ऋण से मुक्ति', eng: 'Highly Benefic: Victory over obstacles, debts, and rivals' },
            7: { type: 'challenging', hin: 'साझेदारी व दांपत्य जीवन में संयम बरतें, विवाद से दूर रहें', eng: 'Relationship tests, public dealings require diplomacy' },
            8: { type: 'challenging', hin: 'स्वास्थ्य व खान-पान का ध्यान रखें, गुप्त साधना व शोध हितकर', eng: 'Care with health/vitality; favorable for spiritual research' },
            9: { type: 'neutral', hin: 'धर्म व तीर्थयात्रा के योग, गुरुजनों व पिता का आशीर्वाद लें', eng: 'Spiritual focus, pilgrimage, guidance from mentors' },
            10: { type: 'benefic', hin: 'अति शुभ गोचर: कार्यक्षेत्र में उन्नति, पद-प्रतिष्ठा व सम्मान', eng: 'Highly Benefic: Career expansion, leadership recognition' },
            11: { type: 'benefic', hin: 'अति शुभ गोचर: सर्व कार्य सिद्धि, धन लाभ व मित्रों का सहयोग', eng: 'Highly Benefic: Fulfillment of goals, financial gains, network' },
            12: { type: 'challenging', hin: 'अनावश्यक व्यय, नेत्र व निद्रा का ध्यान रखें, एकांत साधना हितकर', eng: 'Unplanned expenses, sleep hygiene; good for meditation' }
        },
        moon: {
            1: { type: 'neutral', hin: 'भावुकता, नए विचार, मन की चंचलता, जल तत्व का प्रभाव', eng: 'Emotional sensitivity, mental agility, self-reflection' },
            2: { type: 'benefic', hin: 'धन आगमन, स्वादिष्ट भोजन, परिजनों के साथ सुखद समय', eng: 'Financial flow, family harmony, nourishing meals' },
            3: { type: 'benefic', hin: 'उत्साह व ऊर्जा, संचार व छोटी यात्राओं से लाभ', eng: 'High morale, pleasant communication, sibling bonding' },
            4: { type: 'challenging', hin: 'माता के स्वास्थ्य व मन की शांति पर ध्यान आवश्यक', eng: 'Need for domestic comfort; gentle care for mind' },
            5: { type: 'benefic', hin: 'रचनात्मकता, प्रेम व संतान सुख, विद्या में रुचि', eng: 'Creative inspiration, romantic joy, intellectual sparkle' },
            6: { type: 'benefic', hin: 'प्रतियोगिता में सफलता, दैनिक दिनचर्या व स्वास्थ्य में सुधार', eng: 'Overcoming stress, productivity in daily tasks' },
            7: { type: 'benefic', hin: 'दांपत्य व साझेदारी में मधुरता, जनसम्पर्क से लाभ', eng: 'Pleasant partnerships, public rapport, romance' },
            8: { type: 'challenging', hin: 'चंद्र अष्टम (चंद्रदोष): आज महत्वपूर्ण निर्णयों में धैर्य रखें', eng: 'Ashtama Chandra: Restlessness; avoid impulsive steps' },
            9: { type: 'benefic', hin: 'भाग्य का साथ, धार्मिक विचार, शुभ समाचार प्राप्ति', eng: 'Good fortune, optimistic mindset, spiritual elevation' },
            10: { type: 'benefic', hin: 'कर्मक्षेत्र में प्रशंसा, प्रतिष्ठा वृद्धि, कार्य में मन लगना', eng: 'Professional recognition, productive endeavors' },
            11: { type: 'benefic', hin: 'आकस्मिक लाभ, मित्रों से भेंट, इच्छाओं की पूर्ति', eng: 'Gains, social celebrations, fulfillment of short desires' },
            12: { type: 'challenging', hin: 'अति-व्यय, मानसिक विश्राम की आवश्यकता, ध्यान व साधना', eng: 'Solitude needed, spiritual contemplation, rest' }
        },
        mars: {
            1: { type: 'challenging', hin: 'उच्च ऊर्जा, जल्दबाजी व क्रोध से बचें, वाहन सावधानी से चलाएं', eng: 'High physical drive; avoid impulsiveness and temper' },
            2: { type: 'challenging', hin: 'वाणी में कटुता से बचें, धन के लेन-देन में सतर्कता आवश्यक', eng: 'Guard against harsh speech; financial prudence needed' },
            3: { type: 'benefic', hin: 'अति शुभ गोचर: असीम साहस, विजय, विरोधियों पर प्रभाव', eng: 'Highly Benefic: Courage, initiative, complete victory over rivals' },
            4: { type: 'challenging', hin: 'भूमि, वाहन व गृह मामलों में धैर्य रखें, मन को शांत रखें', eng: 'Domestic friction; patience with vehicles and property' },
            5: { type: 'neutral', hin: 'संतान के प्रति ध्यान, सट्टा व शेयर बाज़ार में सतर्कता', eng: 'Energy in creativity; guard against speculative risks' },
            6: { type: 'benefic', hin: 'अति शुभ गोचर: शत्रुओं का दमन, कानूनी विजय, रोगों का नाश', eng: 'Highly Benefic: Destruction of rivals, triumph over obstacles' },
            7: { type: 'challenging', hin: 'साझेदारी व वैवाहिक जीवन में शांति बनाए रखें', eng: 'Tension in relationships; practice patience and mutual respect' },
            8: { type: 'challenging', hin: 'मांगलिक प्रभाव: स्वास्थ्य व चोट से बचाव रखें, संयम बरतें', eng: 'Physical caution, transformation, avoid risky endeavors' },
            9: { type: 'neutral', hin: 'धर्म व यात्रा, पिता के साथ विचारों का तालमेल रखें', eng: 'Passionate beliefs; maintain respect with teachers/father' },
            10: { type: 'benefic', hin: 'अति शुभ कुलदीपक गोचर: करियर में नेतृत्व, भारी सफलता', eng: 'Highly Benefic (Kuladipaka): Executive authority & ambition' },
            11: { type: 'benefic', hin: 'अति शुभ गोचर: भूमि व पराक्रम से धन लाभ, वरिष्ठों का सहयोग', eng: 'Highly Benefic: Property gains, influential backing, income' },
            12: { type: 'challenging', hin: 'अप्रत्याशित खर्चे, विवाद से दूरी, ऊर्जा को योग व व्यायाम में लगाएं', eng: 'Uncontrolled expenses; channel fire into sports/yoga' }
        },
        mercury: {
            1: { type: 'benefic', hin: 'तीक्ष्ण बुद्धि, हास्य-विनोद, नई भाषा व कौशल सीखने के लिए उत्तम', eng: 'Sharp wit, curiosity, communication skill' },
            2: { type: 'benefic', hin: 'मधुर वाणी, व्यापार व निवेश में बुद्धिमानी से लाभ', eng: 'Sweet speech, commercial acumen, banking gains' },
            3: { type: 'neutral', hin: 'लेखन, मीडिया व दस्तावेज़ीकरण में सक्रियता', eng: 'Writing, networking, short travel, paperwork' },
            4: { type: 'benefic', hin: 'विद्या में उत्तम प्रगति, घर में अध्ययन का वातावरण', eng: 'Academic success, intellectual comfort at home' },
            5: { type: 'benefic', hin: 'मंत्र साधना, शेयर विश्लेषण, संतान की बौद्धिक प्रगति', eng: 'Analytical thinking, mantra siddhi, intellectual hobbies' },
            6: { type: 'benefic', hin: 'तार्किक क्षमता से विरोधियों को निरुत्तर करना, काम का सुचारू प्रबंधन', eng: 'Problem solving, analytical mastery over work' },
            7: { type: 'neutral', hin: 'व्यापारिक समझौतों में स्पष्टता रखें, जीवनसाथी से संवाद', eng: 'Business negotiations, collaborative discussions' },
            8: { type: 'benefic', hin: 'गूढ़ ज्ञान, ज्योतिष, शोध व पैतृक संपत्ति में लाभ', eng: 'Benefic: Occult research, deep analysis, unexpected insight' },
            9: { type: 'neutral', hin: 'उच्च शिक्षा, धार्मिक पुस्तकों का अध्ययन, यात्रा', eng: 'Philosophical reading, higher learning, travel' },
            10: { type: 'benefic', hin: 'अति शुभ गोचर: व्यापार में भारी वृद्धि, नई नौकरी व योजनाएं', eng: 'Highly Benefic: Commerce, strategy, business expansion' },
            11: { type: 'benefic', hin: 'अति शुभ गोचर: बौद्धिक मित्रों से लाभ, आय के नए स्रोत', eng: 'Highly Benefic: Diverse revenue streams, intellectual alliances' },
            12: { type: 'neutral', hin: 'विदेशी संपर्कों से लाभ, आध्यात्मिक अध्ययन, बजट पर ध्यान', eng: 'Foreign trade, research in seclusion, budget control' }
        },
        jupiter: {
            1: { type: 'benefic', hin: 'गुरु का लग्न/चंद्र पर आना: ज्ञान, नए अवसर, वजन व स्वास्थ्य पर ध्यान', eng: 'Expansion, self-respect, wisdom, spiritual beginnings' },
            2: { type: 'benefic', hin: 'परम शुभ (गुरु बल): धन भंडार में वृद्धि, परिवार में मांगलिक कार्य', eng: 'Supreme Guru Balam: Wealth growth, sweet speech, family joy' },
            3: { type: 'neutral', hin: 'धार्मिक यात्राएं, सलाहकारों का सहयोग, छोटे भाई-बहनों का हित', eng: 'Religious expeditions, mentor backing, moral courage' },
            4: { type: 'neutral', hin: 'गृह निर्माण या विस्तार, माता का आशीर्वाद, आध्यात्मिक शांति', eng: 'Home expansion, spiritual contentment, maternal blessings' },
            5: { type: 'benefic', hin: 'परम शुभ (गुरु बल): संतान प्राप्ति/उन्नति, उच्च शिक्षा, अकूत ज्ञान', eng: 'Supreme Guru Balam: Progeny bliss, divine intellect, investments' },
            6: { type: 'neutral', hin: 'सेवा कार्यों से पुण्य, ऋण व विवादों के समाधान में दैवीय सहायता', eng: 'Overcoming disputes with dignity, service-oriented success' },
            7: { type: 'benefic', hin: 'परम शुभ (गुरु बल): विवाह योग, साझेदारी में अपार लाभ, मान-प्रतिष्ठा', eng: 'Supreme Guru Balam: Marriage prospects, auspicious alliances' },
            8: { type: 'neutral', hin: 'आयु वृद्धि, आध्यात्मिक रहस्योद्घाटन, अचानक पैतृक या गुप्त धन', eng: 'Longevity protection, deep mystical insight, inheritance' },
            9: { type: 'benefic', hin: 'परम शुभ त्रिकोण (गुरु बल): भाग्योदय, तीर्थयात्रा, गुरु कृपा', eng: 'Supreme Guru Balam: Peak fortune, divine guru grace, pilgrimage' },
            10: { type: 'benefic', hin: 'पद-प्रतिष्ठा में वृद्धि, सामाजिक मान-सम्मान, उच्च पद प्राप्ति', eng: 'Career elevation, ethical leadership, public stature' },
            11: { type: 'benefic', hin: 'परम शुभ एकादश (गुरु बल): सर्व मनोकामना सिद्धि, धन वर्षा, लाभ', eng: 'Supreme Guru Balam: Fulfillment of all desires, maximum gains' },
            12: { type: 'neutral', hin: 'दान-पुण्य में धन व्यय, मोक्ष मार्ग, विदेश यात्रा व आश्रम वास', eng: 'Dharma expenses, foreign spiritual travels, inner peace' }
        },
        venus: {
            1: { type: 'benefic', hin: 'आकर्षण, सौंदर्य, कला, वस्त्र-आभूषण व व्यक्तित्व में निखार', eng: 'Magnetism, beauty, artistic pursuits, personal charm' },
            2: { type: 'benefic', hin: 'धन लाभ, मधुर भाषण, स्वादिष्ट व्यंजनों व विलासिता का आनंद', eng: 'Financial prosperity, sweet articulation, luxury' },
            3: { type: 'benefic', hin: 'कलात्मक शौक, मित्रता, छोटे सफर व रचनात्मक कार्य', eng: 'Creative hobbies, romantic travel, pleasant relations' },
            4: { type: 'benefic', hin: 'गृह सज्जा, नया वाहन सुख, सुख-सुविधाओं में वृद्धि', eng: 'Vehicle purchase, beautiful home environment, comfort' },
            5: { type: 'benefic', hin: 'प्रेम संबंधों में प्रगाढ़ता, कला व मनोरंजन में सफलता', eng: 'Romantic bliss, fine arts, creative fulfillment' },
            6: { type: 'neutral', hin: 'कार्यस्थल पर सौहार्द, खान-पान व जीवनशैली का ध्यान रखें', eng: 'Workplace diplomacy; balance diet and self-care' },
            7: { type: 'benefic', hin: 'दांपत्य सुख, विवाह चर्चा, प्रेम व व्यापारिक साझेदारी', eng: 'Marital bliss, romantic partnerships, social popularity' },
            8: { type: 'benefic', hin: 'गुप्त धन, ससुराल पक्ष से लाभ, आकर्षण व गूढ़ सुख', eng: 'Spousal wealth, deep intimacy, esoteric knowledge' },
            9: { type: 'benefic', hin: 'मनोरंजक व धार्मिक यात्राएं, भाग्य वृद्धि, विदेशी संस्कृति', eng: 'Joyful travels, artistic patronage, good fortune' },
            10: { type: 'neutral', hin: 'करियर में कला व रचनात्मकता से पहचान, सहयोगियों का साथ', eng: 'Creative workplace success, cooperative peers' },
            11: { type: 'benefic', hin: 'अति शुभ गोचर: मित्र मंडली से लाभ, विलासिता व आर्थिक समृद्धि', eng: 'Highly Benefic: Luxury, social joys, substantial financial gains' },
            12: { type: 'benefic', hin: 'भोग व विलासिता के साधन, शयन सुख, विदेशी यात्रा', eng: 'Sensory comforts, romantic retreat, overseas vacation' }
        },
        saturn: {
            1: { type: 'challenging', hin: 'साढ़ेसाती द्वितीय चरण (शिखर): कड़ा अनुशासन, स्वास्थ्य व धैर्य रखें', eng: 'Sade Sati Peak: Heavy responsibilities, perseverance required' },
            2: { type: 'challenging', hin: 'साढ़ेसाती तृतीय चरण (उतरती): धन का संयम, परिवार की जिम्मेदारी', eng: 'Sade Sati Setting: Asset consolidation, family commitments' },
            3: { type: 'benefic', hin: 'अति शुभ गोचर: शनि का तीसरा गोचर अत्यंत फलदायी, शत्रु भय समाप्त', eng: 'Highly Benefic: Remarkable resilience, obstacles defeated' },
            4: { type: 'challenging', hin: 'शनि की चतुर्थ ढैय्या (कंटक शनि): गृह शांति व माता के स्वास्थ्य का ध्यान', eng: 'Kantaka Shani (4th Dhaiya): Care for home stability & peace' },
            5: { type: 'challenging', hin: 'अध्ययन में एकाग्रता आवश्यक, संतान के प्रति कर्तव्य, पुरानी गलतियों से सीख', eng: 'Mental discipline, deep focus in studies, patient investments' },
            6: { type: 'benefic', hin: 'अति शुभ गोचर: शत्रुओं, रोगों व मुकदमों पर पूर्ण विजय', eng: 'Highly Benefic: Complete victory over debts, rivals & illnesses' },
            7: { type: 'challenging', hin: 'साझेदारी व दांपत्य में परिपक्वता व वफादारी की परीक्षा', eng: 'Karmic partnership tests; requires seriousness and honesty' },
            8: { type: 'challenging', hin: 'शनि की अष्टम ढैय्या (अष्टम शनि): स्वास्थ्य में सतर्कता, योग व प्राणायाम', eng: 'Ashtama Shani (8th Dhaiya): Deep karmic transformation, health care' },
            9: { type: 'neutral', hin: 'धार्मिक अनुशासन, पूर्वजों व पिता के प्रति कर्तव्य, धीमी परंतु स्थायी उन्नति', eng: 'Spiritual asceticism, steady long-term dharma & career rise' },
            10: { type: 'benefic', hin: 'कर्मफल प्रदाता: कठोर परिश्रम का स्थायी फल, प्रशासनिक अधिकार', eng: 'Karmic fruition: Hard labor yielding enduring executive status' },
            11: { type: 'benefic', hin: 'अति शुभ गोचर: स्थायी संपत्ति, वृद्धजनों से लाभ, स्थिर आय', eng: 'Highly Benefic: Enduring wealth, solid achievements, loyal networks' },
            12: { type: 'challenging', hin: 'साढ़ेसाती प्रथम चरण (शुरुआत): व्यय नियंत्रण, विदेश गमन, ध्यान साधना', eng: 'Sade Sati Rising Phase: Foreign avenues, expenses, deep reflection' }
        },
        rahu: {
            1: { type: 'neutral', hin: 'अप्रत्याशित अनुभव, तकनीकी व विदेशी रुचि, भ्रम व अति-उत्साह से बचें', eng: 'Unconventional ambitions, foreign exposure; avoid illusion' },
            2: { type: 'challenging', hin: 'अचानक धन के उतार-चढ़ाव, सात्विक भोजन व सत्य वाणी अपनाएं', eng: 'Sudden financial swings; maintain honest speech and clean diet' },
            3: { type: 'benefic', hin: 'अति शुभ गोचर: राहु तीसरे भाव में महाबली — मीडिया, तकनीक व साहस में विजय', eng: 'Highly Benefic: Daring initiative, massive tech/media success' },
            4: { type: 'challenging', hin: 'घर से दूर रहने के योग, रियल एस्टेट में सावधानी, मन को स्थिर रखें', eng: 'Relocation potential, property deals require due diligence' },
            5: { type: 'challenging', hin: 'सट्टेबाजी व त्वरित धन के लालच से बचें, बुद्धि का सदुपयोग करें', eng: 'Avoid speculative greed; focus on innovative learning' },
            6: { type: 'benefic', hin: 'अति शुभ गोचर: शत्रुओं व प्रतियोगिताओं का पराभव, विदेशी सफलता', eng: 'Highly Benefic: Total defeat of competitors, foreign breakthroughs' },
            7: { type: 'challenging', hin: 'साझेदारों पर अंधविश्वास न करें, नए अनुबंधों की गहन जांच करें', eng: 'Unusual partnerships; verify legal contracts thoroughly' },
            8: { type: 'challenging', hin: 'अचानक परिवर्तन, शोध व गूढ़ विद्या में रुचि, स्वास्थ्य का ध्यान', eng: 'Unexpected twists, interest in occult/esoteric, health vigilance' },
            9: { type: 'neutral', hin: 'विदेशी यात्राएं, पारंपरिक मान्यताओं पर शोध, लीक से हटकर विचार', eng: 'Overseas pilgrimage, out-of-the-box spiritual perspective' },
            10: { type: 'benefic', hin: 'अति शुभ गोचर: राहु दशम में राजनीति, कॉर्पोरेट व प्रसिद्धि का योग', eng: 'Highly Benefic: Sudden career spike, high ambition, fame' },
            11: { type: 'benefic', hin: 'अति शुभ गोचर: विदेशी स्रोतों व इंटरनेट से अप्रत्याशित भारी लाभ', eng: 'Highly Benefic: Sudden windfalls, vast online & global network' },
            12: { type: 'neutral', hin: 'विदेश प्रवास, अस्पताल या आश्रम के माध्यम से आध्यात्मिक मोक्ष मार्ग', eng: 'Foreign relocation, solitary retreats, high dreams' }
        },
        ketu: {
            1: { type: 'neutral', hin: 'आध्यात्मिक झुकाव, सांसारिक बातों से वैराग्य, अंतर्ज्ञान की शक्ति', eng: 'Spiritual detachment, sharp intuition, introspection' },
            2: { type: 'challenging', hin: 'धन संचय में उदासीनता, सादा जीवन, पारिवारिक समझदारी', eng: 'Detachment from material hoarding, simplicity in life' },
            3: { type: 'benefic', hin: 'अति शुभ गोचर: आध्यात्मिक पराक्रम, निर्भयता, कठिन परिस्थितियों से मुक्ति', eng: 'Benefic: Spiritual fearlessness, cutting through past obstacles' },
            4: { type: 'challenging', hin: 'गृह परिवर्तन, आध्यात्मिक शांति की तलाश, माता के प्रति सेवा भाव', eng: 'Detachment from physical home, inner peace over luxury' },
            5: { type: 'neutral', hin: 'मंत्र साधना, पूर्व जन्म के ज्ञान का जागरण, आध्यात्मिक शोध', eng: 'Mantra siddhi, past-life talent activation, inner wisdom' },
            6: { type: 'benefic', hin: 'अति शुभ गोचर: गूढ़ रोगों व गुप्त शत्रुओं का स्वतः विनाश', eng: 'Highly Benefic: Mysterious adversaries dissolved, healing' },
            7: { type: 'challenging', hin: 'सांसारिक आकर्षण में कमी, आध्यात्मिक साथी की चाह', eng: 'Detachment in worldly bonds, seeking higher spiritual connect' },
            8: { type: 'benefic', hin: 'गहन तंत्र-मंत्र, ज्योतिष, कुंडलिनी व आध्यात्मिक सिद्धि', eng: 'Deep occult mastery, kundalini awakening, metaphysical insight' },
            9: { type: 'benefic', hin: 'तीर्थाटन, मोक्ष गुरु की प्राप्ति, आध्यात्मिक उत्थान', eng: 'Benefic: Holy pilgrimages, meeting spiritual masters' },
            10: { type: 'neutral', hin: 'कार्यक्षेत्र में निष्काम कर्म, अर्थपूर्ण व सेवाभावी कार्य की चाह', eng: 'Service-driven work, detachment from corporate politics' },
            11: { type: 'benefic', hin: 'अति शुभ गोचर: गुप्त स्रोतों से लाभ, आध्यात्मिक मित्रों का समूह', eng: 'Benefic: Gains through unseen channels, spiritual kindred' },
            12: { type: 'benefic', hin: 'परम शुभ मोक्ष कारक: केतु द्वादश में परम मोक्ष व ध्यान सिद्धि दाता', eng: 'Supreme Moksha: Transcendental meditation, spiritual liberation' }
        }
    };

    class PersonalTransitManager {
        constructor() {
            this.storageKey = 'grahamandal_user_profile';
            this.obsLocationKey = 'grahamandal_obs_location';
            this.profile = null;
            this.viewMode = 'sky'; // 'sky' | 'natal_lagna' | 'natal_moon' | 'natal_birth'
            this.engine = new VedicAstrologyEngine();
            this.searchDebounceTimer = null;
            this.currentLocation = {
                city: 'New Delhi, India',
                lat: 28.6139,
                lon: 77.2090,
                tz: 5.5
            };

            this.init();
        }

        init() {
            this.loadStoredProfile();
            this.loadStoredLocation();
            this.bindDOM();
        }

        loadStoredProfile() {
            try {
                const raw = localStorage.getItem(this.storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.birthDate && parsed.birthTime) {
                        this.profile = parsed;
                        // Re-calculate or re-verify birth chart
                        this.recalculateBirthChart();
                    }
                }
            } catch (err) {
                console.warn('PersonalTransit: Error loading profile from localStorage', err);
            }
        }

        loadStoredLocation() {
            try {
                const raw = localStorage.getItem(this.obsLocationKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.lat && parsed.lon) {
                        this.currentLocation = parsed;
                    }
                }
            } catch (err) {
                console.warn('PersonalTransit: Error loading location from localStorage', err);
            }
        }

        saveProfile(profileData) {
            this.profile = profileData;
            this.recalculateBirthChart();
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
            } catch (err) {
                console.warn('PersonalTransit: Failed to save to localStorage', err);
            }
            this.renderProfileUI();
            this.dispatchUpdateEvent();
        }

        clearProfile() {
            this.profile = null;
            this.viewMode = 'sky';
            try {
                localStorage.removeItem(this.storageKey);
            } catch (e) { }
            this.renderProfileUI();
            this.dispatchUpdateEvent();
        }

        recalculateBirthChart() {
            if (!this.profile) return;
            const birthDetails = {
                birthDate: this.profile.birthDate,
                birthTime: this.profile.birthTime,
                birthPlace: this.profile.city || 'Unknown',
                latitude: Number(this.profile.lat) || 28.6139,
                longitude: Number(this.profile.lon) || 77.2090,
                timezone: Number(this.profile.tz) || 5.5
            };

            const chart = this.engine.calculateBirthChart(birthDetails);
            this.profile.birthChart = chart;
            this.profile.ascendant = chart.ascendant;
            this.profile.moonLongitude = chart.planets.moon;
            this.profile.moonSign = Math.floor(chart.planets.moon / 30);
            this.profile.ascSign = Math.floor(chart.ascendant / 30);
            this.profile.moonNak = this.engine.getNakshatra(chart.planets.moon);
            this.profile.ascNak = this.engine.getNakshatra(chart.ascendant);
        }

        dispatchUpdateEvent() {
            const event = new CustomEvent('grahamandal:transitUpdate', {
                detail: {
                    profile: this.profile,
                    viewMode: this.viewMode,
                    location: this.currentLocation
                }
            });
            window.dispatchEvent(event);
        }

        // ==========================================
        // OPENSTREETMAP (NOMINATIM) & GPS ENGINE
        // ==========================================

        /**
         * Search cities: checks offline curated list first for 0ms lag,
         * then asynchronously fetches from OpenStreetMap Nominatim.
         */
        async searchCities(query) {
            if (!query || query.trim().length < 2) return [];
            const cleanQuery = query.trim().toLowerCase();

            // 1. Instant local results
            const localMatches = PRESET_CITIES.filter(c =>
                c.name.toLowerCase().includes(cleanQuery) ||
                c.state.toLowerCase().includes(cleanQuery) ||
                c.country.toLowerCase().includes(cleanQuery)
            ).slice(0, 5);

            // 2. Fetch OpenStreetMap Nominatim (Free Geocoding Service)
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { 'Accept-Language': 'en' }
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const osmData = await response.json();
                    const osmResults = osmData.map(item => {
                        const addr = item.address || {};
                        const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || item.name;
                        const stateName = addr.state || addr.region || '';
                        const countryName = addr.country || '';
                        const lat = parseFloat(item.lat);
                        const lon = parseFloat(item.lon);

                        // Timezone estimation: India is UTC+5.5; else approximate from longitude
                        let tz = 5.5;
                        if (countryName.toLowerCase() !== 'india' && !item.display_name.toLowerCase().includes('india')) {
                            tz = Math.round((lon / 15) * 2) / 2;
                        }

                        return {
                            name: cityName,
                            fullName: item.display_name,
                            state: stateName,
                            country: countryName,
                            lat,
                            lon,
                            tz
                        };
                    });

                    // Merge and deduplicate by name
                    const combined = [...localMatches];
                    osmResults.forEach(r => {
                        const exists = combined.some(c =>
                            Math.abs(c.lat - r.lat) < 0.1 && Math.abs(c.lon - r.lon) < 0.1
                        );
                        if (!exists) combined.push(r);
                    });

                    return combined.slice(0, 7);
                }
            } catch (err) {
                // If OSM fails (offline or blocked), fallback strictly to local presets
                console.warn('OpenStreetMap search offline or blocked, returning curated list', err);
            }

            return localMatches;
        }

        /**
         * Reverse geocoding via OpenStreetMap Nominatim
         */
        async reverseGeocode(lat, lon) {
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { 'Accept-Language': 'en' }
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const addr = data.address || {};
                    const city = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || 'Detected Place';
                    const state = addr.state || '';
                    const country = addr.country || '';

                    let tz = 5.5;
                    if (country.toLowerCase() !== 'india' && !data.display_name.toLowerCase().includes('india')) {
                        tz = Math.round((lon / 15) * 2) / 2;
                    }

                    return {
                        name: city,
                        state: state,
                        country: country,
                        fullName: data.display_name,
                        lat: parseFloat(lat),
                        lon: parseFloat(lon),
                        tz: tz
                    };
                }
            } catch (e) {
                console.warn('Reverse geocode failed, using coordinates', e);
            }

            // Fallback: estimate from coordinates
            return {
                name: `GPS Point (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
                state: '',
                country: 'Auto-Detect',
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                tz: -(new Date().getTimezoneOffset() / 60)
            };
        }

        /**
         * Auto-detect location using HTML5 Geolocation API + OSM
         */
        detectCurrentGPS() {
            return new Promise((resolve, reject) => {
                if (!navigator.geolocation) {
                    reject(new Error('Geolocation is not supported by your browser.'));
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const locationData = await this.reverseGeocode(latitude, longitude);
                        resolve(locationData);
                    },
                    (error) => {
                        reject(error);
                    },
                    { timeout: 10000, enableHighAccuracy: true }
                );
            });
        }

        // ==========================================
        // TRANSIT CALCULATION & SADE SATI ANALYSIS
        // ==========================================

        /**
         * Calculate real-time transit status relative to natal chart
         * @param {Object} currentPlanets - sidereal longitudes from engine
         */
        calculatePersonalGochar(currentPlanets) {
            if (!this.profile || !this.profile.birthChart) return null;

            const natalLagnaLong = this.profile.ascendant;
            const natalMoonLong = this.profile.moonLongitude;
            const natalMoonSign = this.profile.moonSign;
            const natalLagnaSign = this.profile.ascSign;

            const saturnLong = currentPlanets.saturn;
            const jupiterLong = currentPlanets.jupiter;
            const rahuLong = currentPlanets.rahu;
            const ketuLong = currentPlanets.ketu;

            const saturnSign = Math.floor(saturnLong / 30);
            const jupiterSign = Math.floor(jupiterLong / 30);

            // Shani position from Moon (1 to 12)
            const saturnHouseFromMoon = ((saturnSign - natalMoonSign + 12) % 12) + 1;
            // Shani position from Lagna (1 to 12)
            const saturnHouseFromLagna = ((saturnSign - natalLagnaSign + 12) % 12) + 1;

            // Jupiter position from Moon
            const jupiterHouseFromMoon = ((jupiterSign - natalMoonSign + 12) % 12) + 1;
            const jupiterHouseFromLagna = ((jupiterSign - natalLagnaSign + 12) % 12) + 1;

            // Sade Sati & Dhaiya Logic
            let sadeSati = {
                isActive: false,
                type: 'none', // 'phase1' | 'peak' | 'phase3' | 'dhaiya_kantaka' | 'dhaiya_ashtama' | 'none'
                titleHin: 'शनि साढ़ेसाती मुक्त',
                titleEng: 'Free from Sade Sati',
                badgeClass: 'bg-secondary/15 text-secondary',
                houseFromMoon: saturnHouseFromMoon,
                descHin: 'वर्तमान में आपकी राशि पर साढ़ेसाती या ढैय्या का प्रभाव नहीं है। शनि आपके पक्ष में हैं।',
                descEng: 'You are currently not under Sade Sati or Dhaiya. Saturn transit is favorable or neutral.',
                remedyHin: 'शनिवार को तिल के तेल का दीपक व हनुमान चालीसा का पाठ श्रेयस्कर है।',
                remedyEng: 'Recite Hanuman Chalisa and maintain disciplined, righteous actions.'
            };

            if (saturnHouseFromMoon === 12) {
                sadeSati = {
                    isActive: true,
                    type: 'phase1',
                    titleHin: 'साढ़ेसाती: प्रथम चरण (उदित / 1st Phase)',
                    titleEng: 'Sade Sati: Phase 1 (Rising Phase)',
                    badgeClass: 'bg-tertiary-container/20 text-tertiary font-bold animate-pulse',
                    houseFromMoon: 12,
                    descHin: 'शनि आपकी जन्म राशि से 12वें भाव में गोचर कर रहे हैं। अनियोजित खर्चों पर नियंत्रण रखें, विदेश अथवा दूरस्थ यात्रा के योग हैं।',
                    descEng: 'Saturn is in 12th from natal Moon. Watch unexpected expenditures; spiritual travel and foreign prospects open up.',
                    remedyHin: 'शनिवार को छाया दान (कांसे की कटोरी में तेल में मुख देखकर दान) व सुंदरकांड पाठ करें।',
                    remedyEng: 'Light sesame oil lamp on Saturdays and practice charity towards service workers.'
                };
            } else if (saturnHouseFromMoon === 1) {
                sadeSati = {
                    isActive: true,
                    type: 'peak',
                    titleHin: 'साढ़ेसाती: द्वितीय चरण (शिखर / Peak Phase — जन्म शनि)',
                    titleEng: 'Sade Sati: Phase 2 (Peak Janma Shani)',
                    badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold animate-pulse',
                    houseFromMoon: 1,
                    descHin: 'शनि आपकी जन्म राशि (चंद्र) के ऊपर से गोचर कर रहे हैं। यह मानसिक धैर्य व अत्यधिक परिश्रम का काल है। जीवन में स्थायी अनुशासन आएगा।',
                    descEng: 'Saturn is directly transiting over your natal Moon. Period of high karmic lessons, resilience, and transformation.',
                    remedyHin: 'महामृत्युंजय मंत्र का नित्य जप व पीपल के वृक्ष के नीचे संध्या समय सरसों के तेल का दीपक जलाएं।',
                    remedyEng: 'Chant Maha Mrityunjaya Mantra daily and maintain integrity and physical endurance.'
                };
            } else if (saturnHouseFromMoon === 2) {
                sadeSati = {
                    isActive: true,
                    type: 'phase3',
                    titleHin: 'साढ़ेसाती: तृतीय चरण (उतरती / Setting Phase)',
                    titleEng: 'Sade Sati: Phase 3 (Setting Phase)',
                    badgeClass: 'bg-primary-container/25 text-primary font-bold',
                    houseFromMoon: 2,
                    descHin: 'शनि आपकी राशि से द्वितीय भाव में गोचर कर रहे हैं। वित्तीय स्थिति धीरे-धीरे स्थिर होगी और साढ़ेसाती के कठिन दौर से मुक्ति का मार्ग प्रशस्त होगा।',
                    descEng: 'Saturn is transiting the 2nd house from natal Moon. Financial stabilization and concluding phase of 7.5-year cycle.',
                    remedyHin: 'शनि चालीसा का पाठ करें व गरीबों को अन्न व वस्त्र दान करें।',
                    remedyEng: 'Donate food and clothes to underprivileged individuals; practice sweet speech.'
                };
            } else if (saturnHouseFromMoon === 4) {
                sadeSati = {
                    isActive: true,
                    type: 'dhaiya_kantaka',
                    titleHin: 'शनि की चतुर्थ ढैय्या (कंटक शनि / 2.5 Yrs)',
                    titleEng: 'Saturn Kantaka Dhaiya (4th House)',
                    badgeClass: 'bg-tertiary-container/20 text-tertiary font-bold',
                    houseFromMoon: 4,
                    descHin: 'शनि चंद्र से चतुर्थ भाव में हैं। गृह शांति, माता के स्वास्थ्य व भूमि-वाहन के सौदों में जल्दबाजी से बचें।',
                    descEng: 'Saturn transiting 4th from Moon. Maintain domestic harmony and emotional tranquility.',
                    remedyHin: 'शनिवार को चींटियों को आटा डालें और शिव आराधना करें।',
                    remedyEng: 'Worship Lord Shiva and maintain patience in real estate and family matters.'
                };
            } else if (saturnHouseFromMoon === 8) {
                sadeSati = {
                    isActive: true,
                    type: 'dhaiya_ashtama',
                    titleHin: 'शनि की अष्टम ढैय्या (अष्टम शनि / 2.5 Yrs)',
                    titleEng: 'Saturn Ashtama Dhaiya (8th House)',
                    badgeClass: 'bg-retrograde-ruby/15 text-retrograde-ruby font-bold animate-pulse',
                    houseFromMoon: 8,
                    descHin: 'शनि चंद्र से 8वें भाव में हैं। स्वास्थ्य में विशेष सतर्कता बरतें, जोखिम भरे निवेश व वाद-विवाद से दूर रहें। योग व प्राणायाम हितकर है।',
                    descEng: 'Saturn transiting 8th from Moon. Practice high vigilance with physical health and avoid speculation.',
                    remedyHin: 'हनुमान बाहुक का पाठ करें व प्रत्येक शनिवार को काले कुत्ते को रोटी खिलाएं।',
                    remedyEng: 'Recite Hanuman Bahuk and feed stray animals on Saturdays.'
                };
            }

            // Guru Balam Logic
            const isGuruBalam = [2, 5, 7, 9, 11].includes(jupiterHouseFromMoon);
            const guruTransit = {
                houseFromMoon: jupiterHouseFromMoon,
                isGuruBalam: isGuruBalam,
                titleHin: isGuruBalam ? `गुरु बल प्राप्त (शुभ ${jupiterHouseFromMoon}वां भाव)` : `गुरु गोचर (${jupiterHouseFromMoon}वां भाव)`,
                titleEng: isGuruBalam ? `Guru Balam Active (House ${jupiterHouseFromMoon})` : `Jupiter Transit (House ${jupiterHouseFromMoon})`,
                badgeClass: isGuruBalam ? 'bg-secondary/15 text-secondary font-bold' : 'bg-surface-container-high text-muted-lavender',
                descHin: isGuruBalam
                    ? 'बृहस्पति आपके चंद्र से शुभ भाव में गोचर कर रहे हैं। मांगलिक कार्य, धन लाभ, ज्ञान व भाग्य का विशेष सहयोग प्राप्त होगा।'
                    : 'बृहस्पति का यह गोचर आत्म-चिंतन, एकांत साधना व भविष्य की नींव रखने के लिए उत्तम है।',
                descEng: isGuruBalam
                    ? 'Jupiter is in an auspicious house from Moon! Blessed period for wealth, wisdom, and favorable outcomes.'
                    : 'Jupiter in an introspection house; wonderful for spiritual depth and long-term planning.'
            };

            // House by house breakdown for all 9 planets
            const planetsList = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
            const planetaryTransits = planetsList.map(p => {
                const pLong = currentPlanets[p];
                const pSign = Math.floor(pLong / 30);
                const houseFromLagna = ((pSign - natalLagnaSign + 12) % 12) + 1;
                const houseFromMoon = ((pSign - natalMoonSign + 12) % 12) + 1;
                const interp = GOCHAR_INTERPRETATIONS[p] ? GOCHAR_INTERPRETATIONS[p][houseFromMoon] : null;

                return {
                    planet: p,
                    longitude: pLong,
                    degreeInSign: pLong % 30,
                    signIndex: pSign,
                    rashiEng: RASHIS_ENG[pSign],
                    rashiHin: RASHIS_HIN[pSign],
                    houseFromLagna,
                    houseFromMoon,
                    houseNameLagnaEng: HOUSE_NAMES_ENG[houseFromLagna - 1],
                    houseNameLagnaHin: HOUSE_NAMES_HIN[houseFromLagna - 1],
                    houseNameMoonEng: HOUSE_NAMES_ENG[houseFromMoon - 1],
                    houseNameMoonHin: HOUSE_NAMES_HIN[houseFromMoon - 1],
                    interpretation: interp
                };
            });

            return {
                sadeSati,
                guruTransit,
                planetaryTransits,
                natalLagnaSign,
                natalMoonSign,
                natalLagnaNameHin: RASHIS_HIN[natalLagnaSign],
                natalLagnaNameEng: RASHIS_ENG[natalLagnaSign],
                natalMoonNameHin: RASHIS_HIN[natalMoonSign],
                natalMoonNameEng: RASHIS_ENG[natalMoonSign]
            };
        }

        // ==========================================
        // UI BINDING & INTERACTION
        // ==========================================

        bindDOM() {
            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initDOMListeners());
            } else {
                this.initDOMListeners();
            }
        }

        initDOMListeners() {
            const toggleBtn = document.getElementById('toggle-profile-form-btn');
            const summaryHeader = document.getElementById('profile-summary-header');
            const drawer = document.getElementById('profile-form-drawer');
            const cancelBtn = document.getElementById('btn-cancel-profile');
            const submitBtn = document.getElementById('btn-submit-profile');
            const clearBtn = document.getElementById('clear-profile-btn');
            const gpsBtn = document.getElementById('btn-gps-locate');
            const searchInput = document.getElementById('input-location-search');
            const dropdown = document.getElementById('osm-suggestions-dropdown');

            // Quick City Chips
            const quickChips = document.querySelectorAll('.city-quick-chip');
            quickChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const city = chip.dataset.city;
                    const lat = parseFloat(chip.dataset.lat);
                    const lon = parseFloat(chip.dataset.lon);
                    this.setSelectedLocationUI({ name: city, lat, lon, tz: (city === 'London' ? 0 : 5.5) });
                });
            });

            // Toggle form drawer
            if (toggleBtn && drawer) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDrawer();
                });
            }
            if (summaryHeader && drawer) {
                summaryHeader.addEventListener('click', () => {
                    this.toggleDrawer();
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.closeDrawer();
                });
            }
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.clearProfile();
                });
            }

            // GPS Locate Button
            if (gpsBtn) {
                gpsBtn.addEventListener('click', async () => {
                    const gpsText = document.getElementById('gps-btn-text');
                    const origText = gpsText ? gpsText.textContent : '';
                    if (gpsText) gpsText.textContent = 'Locating...';

                    try {
                        const loc = await this.detectCurrentGPS();
                        this.setSelectedLocationUI(loc);
                        if (gpsText) gpsText.textContent = 'GPS Found!';
                        setTimeout(() => {
                            if (gpsText) gpsText.textContent = origText;
                        }, 2000);
                    } catch (err) {
                        alert('Could not auto-detect location: ' + (err.message || 'Permission denied or timeout. Please search manually.'));
                        if (gpsText) gpsText.textContent = origText;
                    }
                });
            }

            // Location Search with Debounced OpenStreetMap Nominatim
            if (searchInput && dropdown) {
                searchInput.addEventListener('input', (e) => {
                    const q = e.target.value;
                    clearTimeout(this.searchDebounceTimer);
                    const spinner = document.getElementById('location-spinner');

                    if (!q || q.trim().length < 2) {
                        dropdown.classList.add('hidden');
                        dropdown.innerHTML = '';
                        if (spinner) spinner.classList.add('hidden');
                        return;
                    }

                    if (spinner) spinner.classList.remove('hidden');

                    this.searchDebounceTimer = setTimeout(async () => {
                        const results = await this.searchCities(q);
                        if (spinner) spinner.classList.add('hidden');
                        this.renderOSMSuggestions(results);
                    }, 300);
                });

                // Hide dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                        dropdown.classList.add('hidden');
                    }
                });
            }

            // Submit Profile Button
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    this.handleSubmitProfile();
                });
            }

            // Chart View Mode Tabs
            const viewTabs = document.querySelectorAll('.chart-mode-btn');
            viewTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const mode = tab.dataset.mode;
                    this.setViewMode(mode);
                });
            });

            // Initial UI render
            this.renderProfileUI();
        }

        toggleDrawer() {
            const drawer = document.getElementById('profile-form-drawer');
            if (!drawer) return;
            const isHidden = drawer.classList.contains('hidden');
            if (isHidden) {
                this.openDrawer();
            } else {
                this.closeDrawer();
            }
        }

        openDrawer() {
            const drawer = document.getElementById('profile-form-drawer');
            const btnIcon = document.getElementById('profile-btn-icon');
            const btnLabel = document.getElementById('profile-btn-label');
            if (drawer) drawer.classList.remove('hidden');
            if (btnIcon) btnIcon.textContent = 'expand_less';
            if (btnLabel) btnLabel.textContent = 'Close';

            // Populate form with existing profile if available
            if (this.profile) {
                const nameInput = document.getElementById('input-user-name');
                const dateInput = document.getElementById('input-birth-date');
                const timeInput = document.getElementById('input-birth-time');
                if (nameInput) nameInput.value = this.profile.name || '';
                if (dateInput) dateInput.value = this.profile.birthDate || '';
                if (timeInput) timeInput.value = this.profile.birthTime || '';
                this.setSelectedLocationUI({
                    name: this.profile.city,
                    lat: this.profile.lat,
                    lon: this.profile.lon,
                    tz: this.profile.tz
                });
            }
        }

        closeDrawer() {
            const drawer = document.getElementById('profile-form-drawer');
            const btnIcon = document.getElementById('profile-btn-icon');
            const btnLabel = document.getElementById('profile-btn-label');
            if (drawer) drawer.classList.add('hidden');
            if (btnIcon) btnIcon.textContent = this.profile ? 'edit_note' : 'edit_calendar';
            if (btnLabel) btnLabel.textContent = this.profile ? 'Edit Profile' : 'Enter Details';
        }

        setSelectedLocationUI(loc) {
            this.tempSelectedLocation = loc;
            const feedbackCity = document.getElementById('selected-city-text');
            const feedbackCoords = document.getElementById('selected-coords-text');
            const searchInput = document.getElementById('input-location-search');

            const displayName = loc.name + (loc.state ? `, ${loc.state}` : '') + (loc.country ? `, ${loc.country}` : '');
            if (searchInput) searchInput.value = loc.name;
            if (feedbackCity) feedbackCity.textContent = `Selected: ${displayName}`;
            if (feedbackCoords) {
                const tzStr = loc.tz >= 0 ? `+${loc.tz}` : `${loc.tz}`;
                feedbackCoords.textContent = `Lat: ${loc.lat.toFixed(2)}°, Lon: ${loc.lon.toFixed(2)}° (UTC${tzStr})`;
            }

            // Also update telemetry city badge
            const teleCity = document.getElementById('telemetry-city-name');
            if (teleCity) teleCity.textContent = loc.name;
        }

        renderOSMSuggestions(results) {
            const dropdown = document.getElementById('osm-suggestions-dropdown');
            if (!dropdown) return;

            if (!results || results.length === 0) {
                dropdown.innerHTML = `<div class="p-3 text-xs text-muted-lavender text-center">No location matches found. Try entering coordinates or a nearby town.</div>`;
                dropdown.classList.remove('hidden');
                return;
            }

            let html = '';
            results.forEach((item, idx) => {
                const line1 = item.name;
                const line2 = [item.state, item.country].filter(Boolean).join(', ');
                const tzStr = item.tz >= 0 ? `+${item.tz}` : `${item.tz}`;

                html += `
                    <div class="osm-item px-3 py-2 text-xs hover:bg-parchment-container cursor-pointer border-b border-black/5 last:border-b-0 flex items-center justify-between" data-index="${idx}">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="material-symbols-outlined text-primary text-[16px] shrink-0">pin_drop</span>
                            <div class="flex flex-col min-w-0">
                                <span class="font-bold text-cosmic-slate truncate leading-tight">${line1}</span>
                                <span class="text-[10px] text-muted-lavender truncate">${line2 || item.fullName || ''}</span>
                            </div>
                        </div>
                        <span class="text-[10px] font-semibold text-secondary shrink-0 bg-secondary/10 px-1.5 py-0.5 rounded">UTC${tzStr}</span>
                    </div>
                `;
            });

            dropdown.innerHTML = html;
            dropdown.classList.remove('hidden');

            const itemEls = dropdown.querySelectorAll('.osm-item');
            itemEls.forEach((el, i) => {
                el.addEventListener('click', () => {
                    const selected = results[i];
                    this.setSelectedLocationUI(selected);
                    dropdown.classList.add('hidden');
                });
            });
        }

        handleSubmitProfile() {
            const nameInput = document.getElementById('input-user-name');
            const dateInput = document.getElementById('input-birth-date');
            const timeInput = document.getElementById('input-birth-time');

            const name = nameInput ? nameInput.value.trim() : '';
            const birthDate = dateInput ? dateInput.value : '';
            const birthTime = timeInput ? timeInput.value : '';

            if (!birthDate) {
                alert('Please enter your Date of Birth / जन्म तिथि');
                return;
            }
            if (!birthTime) {
                alert('Please enter your Time of Birth / जन्म समय');
                return;
            }

            const loc = this.tempSelectedLocation || this.currentLocation;

            const profileData = {
                name: name || 'Seeker (साधक)',
                birthDate,
                birthTime,
                city: loc.name || 'New Delhi',
                state: loc.state || '',
                country: loc.country || 'India',
                lat: loc.lat || 28.6139,
                lon: loc.lon || 77.2090,
                tz: loc.tz !== undefined ? loc.tz : 5.5
            };

            this.saveProfile(profileData);
            this.closeDrawer();

            // Default to 'natal_lagna' view mode when new profile is submitted
            this.setViewMode('natal_lagna');
        }

        setViewMode(mode) {
            this.viewMode = mode;

            // Update UI Tab Active Styles
            const tabs = document.querySelectorAll('.chart-mode-btn');
            tabs.forEach(tab => {
                if (tab.dataset.mode === mode) {
                    tab.className = "chart-mode-btn flex-1 min-w-[70px] px-2 py-1 rounded-lg text-xs font-bold bg-primary-container text-on-primary shadow-sm transition-all text-center";
                } else {
                    tab.className = "chart-mode-btn flex-1 min-w-[70px] px-2 py-1 rounded-lg text-xs font-medium text-muted-lavender hover:text-cosmic-slate transition-all text-center";
                }
            });

            this.dispatchUpdateEvent();
        }

        renderProfileUI() {
            const activeTag = document.getElementById('profile-active-tag');
            const nameDisplay = document.getElementById('profile-name-display');
            const subtitleDisplay = document.getElementById('profile-subtitle-display');
            const quickStats = document.getElementById('profile-quick-stats');
            const insightsCard = document.getElementById('personal-transit-insights');
            const viewTabs = document.getElementById('chart-view-mode-tabs');

            if (!this.profile) {
                // Empty state
                if (activeTag) activeTag.classList.add('hidden');
                if (nameDisplay) nameDisplay.textContent = 'My Live Transit (व्यक्तिगत गोचर)';
                if (subtitleDisplay) subtitleDisplay.textContent = 'Enter birth details to track live planetary transits over your Janma Kundali';
                if (quickStats) quickStats.classList.add('hidden');
                if (insightsCard) insightsCard.classList.add('hidden');
                this.closeDrawer();
                return;
            }

            // Active Profile state
            if (activeTag) activeTag.classList.remove('hidden');
            if (nameDisplay) nameDisplay.textContent = `${this.profile.name}'s Live Transit`;
            if (subtitleDisplay) {
                subtitleDisplay.textContent = `Lagna: ${this.profile.natalLagnaNameHin || RASHIS_HIN[this.profile.ascSign]} • Moon: ${this.profile.natalMoonNameHin || RASHIS_HIN[this.profile.moonSign]} (${this.profile.moonNak.name})`;
            }

            if (quickStats) {
                quickStats.classList.remove('hidden');
                const lagnaBadge = document.getElementById('stat-lagna-badge');
                const moonBadge = document.getElementById('stat-moon-badge');
                const placeBadge = document.getElementById('stat-place-badge');

                if (lagnaBadge) lagnaBadge.textContent = `Lagna: ${RASHIS_HIN[this.profile.ascSign]} (${RASHIS_ENG[this.profile.ascSign]})`;
                if (moonBadge) moonBadge.textContent = `Moon: ${RASHIS_HIN[this.profile.moonSign]} • ${this.profile.moonNak.name}`;
                if (placeBadge) {
                    placeBadge.innerHTML = `<span class="material-symbols-outlined text-[13px] text-primary shrink-0">pin_drop</span><span class="truncate">${this.profile.city}</span>`;
                }
            }

            if (insightsCard) {
                insightsCard.classList.remove('hidden');
            }

            this.closeDrawer();
        }

        /**
         * Render the Personalized Transit Insights Card (Sade Sati + Guru + 9 Graha activations)
         */
        renderPersonalTransitInsights(currentPlanets) {
            const container = document.getElementById('personal-transit-insights');
            if (!container || !this.profile) return;

            const data = this.calculatePersonalGochar(currentPlanets);
            if (!data) return;

            const grid = document.getElementById('sade-sati-guru-grid');
            const list = document.getElementById('personal-graha-transit-list');

            if (grid) {
                grid.innerHTML = `
                    <!-- 1. Shani Sade Sati / Dhaiya Card -->
                    <div class="flex flex-col bg-surface-container-lowest p-3 rounded-xl border border-black/5 shadow-sm space-y-2">
                        <div class="flex items-center justify-between gap-1">
                            <span class="font-headline-sm text-xs font-bold text-cosmic-slate flex items-center gap-1">
                                <span>🪐</span> शनि गोचर व साढ़ेसाती
                            </span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] ${data.sadeSati.badgeClass}">
                                ${data.sadeSati.titleHin}
                            </span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant leading-relaxed">
                            ${data.sadeSati.descHin}
                        </p>
                        <div class="text-[10px] text-primary font-medium pt-1 border-t border-black/5 flex items-start gap-1">
                            <span class="material-symbols-outlined text-[13px] shrink-0 text-primary">verified</span>
                            <span><strong>उपाय:</strong> ${data.sadeSati.remedyHin}</span>
                        </div>
                    </div>

                    <!-- 2. Guru Balam Card -->
                    <div class="flex flex-col bg-surface-container-lowest p-3 rounded-xl border border-black/5 shadow-sm space-y-2">
                        <div class="flex items-center justify-between gap-1">
                            <span class="font-headline-sm text-xs font-bold text-cosmic-slate flex items-center gap-1">
                                <span>🟡</span> देवगुरु बृहस्पति गोचर
                            </span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] ${data.guruTransit.badgeClass}">
                                ${data.guruTransit.titleHin}
                            </span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant leading-relaxed">
                            ${data.guruTransit.descHin}
                        </p>
                        <div class="text-[10px] text-secondary font-medium pt-1 border-t border-black/5 flex items-start gap-1">
                            <span class="material-symbols-outlined text-[13px] shrink-0 text-secondary">stars</span>
                            <span>चंद्र से ${data.guruTransit.houseFromMoon}वें भाव में गुरु गोचर शुभ प्रभाव का विस्तार कर रहा है।</span>
                        </div>
                    </div>
                `;
            }

            if (list) {
                let html = `
                    <div class="text-[11px] font-bold text-cosmic-slate pt-1 flex items-center justify-between">
                        <span>9 नवग्रहों का व्यक्तिगत गोचर प्रभाव (Parashara Jyotisha)</span>
                        <span class="text-[10px] text-muted-lavender font-normal">चंद्र व लग्न से भाव स्थिति</span>
                    </div>
                `;

                data.planetaryTransits.forEach(item => {
                    const emojiMap = {
                        sun: '☀️', moon: '🌙', mars: '🔴', mercury: '💚',
                        jupiter: '🟡', venus: '💗', saturn: '💙', rahu: '🟣', ketu: '⬛'
                    };
                    const emoji = emojiMap[item.planet] || '✨';
                    const nameMap = {
                        sun: 'सूर्य', moon: 'चंद्र', mars: 'मंगल', mercury: 'बुध',
                        jupiter: 'गुरु', venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु'
                    };
                    const pName = nameMap[item.planet] || item.planet;
                    const interp = item.interpretation;

                    let typeBadge = '';
                    if (interp && interp.type === 'benefic') {
                        typeBadge = '<span class="px-1.5 py-0.2 rounded text-[10px] bg-secondary/15 text-secondary font-bold">शुभ</span>';
                    } else if (interp && interp.type === 'challenging') {
                        typeBadge = '<span class="px-1.5 py-0.2 rounded text-[10px] bg-retrograde-ruby/15 text-retrograde-ruby font-bold">सतर्कता</span>';
                    } else {
                        typeBadge = '<span class="px-1.5 py-0.2 rounded text-[10px] bg-surface-container-high text-muted-lavender font-medium">सामान्य</span>';
                    }

                    html += `
                        <div class="flex items-start justify-between gap-2 p-2 rounded-lg bg-surface-container-low/70 border border-black/5 text-xs">
                            <div class="flex items-start gap-2 min-w-0">
                                <span class="text-sm shrink-0 mt-0.5">${emoji}</span>
                                <div class="flex flex-col min-w-0">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <span class="font-bold text-cosmic-slate">${pName}</span>
                                        <span class="text-[10px] text-muted-lavender">in ${item.rashiHin} (${item.rashiEng})</span>
                                        <span class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">लग्न से ${item.houseFromLagna}वां</span>
                                        <span class="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.2 rounded font-semibold">चंद्र से ${item.houseFromMoon}वां</span>
                                    </div>
                                    <span class="text-[11px] text-on-surface-variant pt-0.5 leading-tight">${interp ? interp.hin : ''}</span>
                                </div>
                            </div>
                            <div class="shrink-0">
                                ${typeBadge}
                            </div>
                        </div>
                    `;
                });

                list.innerHTML = html;
            }
        }
    }

    // Expose instance globally
    window.personalTransit = new PersonalTransitManager();

})(window);

