# 🛫 RunwayCalc — Startup Runway Calculator

> **Know exactly when your startup runs out of cash.**

A beautifully crafted, frontend-only web application that calculates your startup's financial runway. Enter your cash on hand and monthly burn rate to get an instant, visual breakdown — complete with charts, scenario analysis, and actionable insights.

**[Live Demo →](https://achyuth31.github.io/RunwayCalc/)** · **[Report Bug →](https://github.com/Achyuth31/RunwayCalc/issues)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 📐 **Instant Calculation** | Real-time runway computation as you type — months, days, and exact dates update with zero delay. |
| 🎨 **Visual Feedback** | Dynamic color-coded states: 🟢 Safe (12+ months), 🟡 Caution (6–12 months), 🔴 Danger (<6 months) — the UI pulses with urgency when you're in danger. |
| 📱 **Mobile-First Design** | Fully responsive layout tested on phones, tablets, and desktops. Use it during a pitch meeting. |
| 📊 **Cash Depletion Chart** | Interactive Chart.js line graph showing your cash balance month-by-month until it hits zero. |
| 🌙 **Dark Mode** | Gorgeous dark theme that persists across sessions via `localStorage`. Respects OS-level `prefers-color-scheme`. |
| 📋 **Scenario Analysis** | Compare best-case (−20% burn), base-case, and worst-case (+20% burn) scenarios side-by-side. |
| 💱 **Multi-Currency** | Support for USD, EUR, GBP, INR, JPY, CAD, AUD with proper locale-aware formatting (Intl.NumberFormat). |
| 📈 **Revenue Offset** | Optional monthly revenue field that calculates *net* burn rate for more realistic projections. |
| 🔗 **Shareable Links** | Generate a URL with pre-filled values to share with co-founders or investors. |
| 📄 **CSV Export** | Download a month-by-month cash projection as a CSV file for spreadsheets. |
| 🏠 **Landing Page** | A separate, polished landing page with animated hero, feature showcase, and call-to-action. |

---


## 🏗️ Architecture & Design Decisions

### Why Vanilla HTML/CSS/JS?

I chose **zero dependencies** (except Chart.js for visualization) to demonstrate:

1. **Technical depth** — No framework abstractions hiding the logic. Every line of CSS and JS is intentional.
2. **Performance** — The entire app loads in under 100KB (excluding Chart.js CDN). No build step, no transpilation, no virtual DOM overhead.
3. **Portability** — Open `index.html` in any browser. No `npm install`, no dev server required.

### Design System

The app uses a **centralized design token system** (`css/variables.css`) with:

- **50+ CSS custom properties** organized into typography, spacing, color, shadow, and transition scales.
- **Semantic color naming**: `--color-success`, `--color-danger`, etc., not raw hex values.
- **Light + Dark themes** via `[data-theme]` attribute — a single source of truth for all theme variations.
- **Fluid typography** using `clamp()` for seamless scaling from mobile to desktop.

### State-Based Visual Feedback

The runway display doesn't just change a number — it changes the **entire atmosphere**:

| State | Threshold | Visual Treatment |
|---|---|---|
| 🟢 Safe | ≥ 12 months | Green gradient background, calm status badge |
| 🟡 Caution | 6–12 months | Amber gradient, warning indicator |
| 🔴 Danger | < 6 months | Red gradient + `@keyframes dangerPulse` animation (pulsing box-shadow) |
| 🚀 Sustainable | Revenue ≥ Burn | Purple/indigo infinite symbol |

The danger state intentionally uses a **CSS pulse animation** to create a visceral sense of urgency — it's not just red, it *breathes* red.

### Currency Formatting

All currency formatting uses `Intl.NumberFormat` with locale-aware thousand separators and currency symbols. The input fields format as-you-type with cursor position preservation, so typing "500000" automatically becomes "5,00,000" for INR or "500,000" for USD.

### Chart Design

The Chart.js chart uses:
- **Gradient fills** that fade to transparent for depth.
- **No point markers** (clean line) with hover-only point display.
- **Theme-aware tooltips** that match the light/dark mode.
- **Compact currency formatting** on the Y-axis (e.g., "₹5L", "$1.2M").

---

## 📁 Project Structure

```
RunwayCalc/
├── index.html          # Landing page
├── app.html            # Calculator application
├── css/
│   ├── variables.css   # Design tokens (colors, spacing, typography)
│   ├── landing.css     # Landing page styles
│   └── app.css         # Calculator app styles
├── js/
│   ├── theme.js        # Dark/light mode toggle + persistence
│   ├── landing.js      # Landing page interactions (scroll, reveal, counter)
│   └── app.js          # Core calculator logic, chart, scenarios, export
└── README.md           # You are here
```

---

## 🚀 Getting Started

### Quick Start (No Installation)

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/RunwayCalc.git
   ```
2. Open `index.html` in your browser.
3. That's it. No `npm install`. No build step.

### With a Local Server (Optional)

For the best experience (proper URL sharing, etc.):

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`.

---

## 📱 Mobile Support

The entire application is built **mobile-first** with:

- `inputmode="numeric"` on all financial inputs (opens numeric keyboard on phones).
- Responsive grid layouts that collapse gracefully on small screens.
- Touch-friendly button sizes (minimum 44×44px tap targets).
- No horizontal scrolling at any breakpoint (tested from 320px to 2560px).

---

## 🧮 The Math

The core formula is simple, but the implementation handles edge cases thoughtfully:

```
Net Burn Rate = Monthly Burn − Monthly Revenue
Runway (months) = Cash on Hand ÷ Net Burn Rate
```

**Edge Cases Handled:**
- **Revenue ≥ Burn** → Runway = ∞ (sustainable)
- **Zero burn** → No division by zero; shows empty state
- **Zero cash** → Shows 0 months with danger state
- **Very large values** → Compact formatting (e.g., "₹2.5Cr", "$1.2M")

---

## 🎨 Color Palette

| Role | Light | Dark |
|---|---|---|
| Primary | `#6366f1` (Indigo) | Same |
| Success | `#10b981` (Emerald) | Same |
| Warning | `#f59e0b` (Amber) | Same |
| Danger | `#ef4444` (Rose) | Same |
| Background | `#f8f9fc` | `#0f1117` |
| Text | `#1a1d2e` | `#eef0f6` |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic structure with ARIA labels |
| CSS3 | Custom properties, glassmorphism, animations, `clamp()` |
| Vanilla JavaScript | Core logic, DOM manipulation, event handling |
| [Chart.js 4.x](https://www.chartjs.org/) | Cash depletion line chart (CDN) |
| [Google Fonts](https://fonts.google.com/) | Inter + Outfit + JetBrains Mono |

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Design Inspiration**: Linear, Vercel, and Stripe dashboards.
- **Chart.js**: For making beautiful, responsive charts effortless.
- **Google Fonts**: Inter by Rasmus Andersson, Outfit by Rodrigo Fuenzalida.

---

<p align="center">
  Built with 💜 for startups everywhere.
</p>
