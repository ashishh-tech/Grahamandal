# Graha Tracker (ग्रह मंडल)

**Graha Tracker** is an authentic, high-precision Vedic Astrology (Jyotisha) web application that tracks real-time planetary positions (Gochar), calculates the rising Lagna (Ascendant), renders dynamic North/South Indian Kundalis, and delivers a 5-Year Planetary Transit Ephemeris Matrix (2024–2029 / 2031).

---

## 🌟 Key Features

1. **Live Lagna & Vedic Kundali (`index.html`)**:
   - Real-time rising Ascendant (Lagna) calculation based on True Chitra Paksha (Lahiri) Ayanamsa.
   - Interactive North Indian Diamond Kundali & South Indian square chart toggle with dynamic SVG rendering.
   - Real-time planetary placement with degrees, minutes, seconds, and motion status.
   - "आज Reset" button and custom date picker to inspect historical or future planetary positions.
   - 9 Navagraha cards with exact degree, Nakshatra, Pada, Dignity (Exalted, Debilitated, Moolatrikona, Swarashi, Mitra, Shatru, Gandanta junction alert), and Retrograde (Vakri) status.
   - Observational Night Mode (red-light telescope theme).
   - Bilingual support (ENG / हिंदी).

2. **5-Year Transit Matrix (`transit-calendar.html`)**:
   - Complete 5-year sidereal transit schedule with exact IST timestamps.
   - Filter by year (2024, 2025, 2026, 2027, 2028, 2029, or Macro 5-year cycle).
   - Filter by Graha focus: All 9 Grahas, Guru, Shani, Rahu-Ketu, Mangal/Surya.
   - Real-time instant search by planet name, Rashi, or Nakshatra.
   - Highlighted pivotal epochs: Guru Gochar, Shani ingress to Pisces (Sade Sati shift), Rahu-Ketu axis shifts.
   - Interactive detail modal with classical Brihat Parashara Hora Shastra interpretations and Vedic guidance.

3. **Core Calculation Engine**:
   - `js/astrology-engine-v8.js`: High-precision Julian Date, Lahiri Ayanamsa, and planetary ephemeris algorithms.
   - `js/graha-tracker.js`: Live telemetry, dynamic SVG Kundali generation, and dignity analysis.
   - `js/transit-calendar.js`: Multi-year transit chronology engine.

---

## 🎨 Design System
- **Theme**: Luxury Vedic Light Theme (Warm Cream / Parchment aesthetic).
- **Primary Color**: `#C59820` (Vedic Gold / Brass)
- **Secondary Color**: `#0D9488` (Teal / Deep Cyan)
- **Tertiary Color**: `#E67E22` (Saffron / Terracotta)
- **Background**: `#FBF9F6` (Parchment White)
- **Typography**: `Noto Serif` & `Cinzel` for headings, `Inter` for data metrics.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser or serve locally:
```bash
npx serve .
```
Or with Python:
```bash
python -m http.server 8000
```
