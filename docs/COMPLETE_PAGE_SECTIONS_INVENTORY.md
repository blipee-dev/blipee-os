# 🎯 Complete Sustainability Page - Section Inventory

## What This Document Is

A comprehensive list of **EVERY SINGLE ELEMENT** on the `/sustainability` page that will be redesigned with Firecrawl's bold minimal aesthetic for `/sustainability-light`.

---

## 📋 Full Page Structure

### 1. **PAGE LAYOUT**

#### Current Design:
```
┌─────────────────────────────────────────────────────┐
│ [280px Sidebar - Dark]  │  [Content Area - Dark]   │
│ - Logo                  │  - Header                 │
│ - Navigation (11 items) │  - Filters (Site/Period)  │
│ - User Profile          │  - Dashboard Content      │
│ - Settings/Logout       │  - Charts & Metrics       │
└─────────────────────────────────────────────────────┘
```

#### New Design:
```
┌──────────────────────────────────────────────────────┐
│                  [Pure White Background]              │
│                                                       │
│  [Minimal Header - Sticky]  [Site] [Period] [Nav →]  │
│  ═════════════════════════════════════════════════    │
│                                                       │
│        [Max-width 1400px Container]                   │
│        [Massive Padding - 60px all sides]             │
│                                                       │
│        [Dashboard Content - HUGE numbers]             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 🗂️ Navigation Elements

### 1.1 Sidebar (BaseSidebarLayout)

**Current:**
- 280px width (collapsible to 80px)
- Dark background (`bg-[#1a1a1a]`)
- Glass morphism effects
- Logo with gradient header
- 11 navigation items with icons
- User profile section at bottom
- Settings/Logout buttons

**New Design:**
- ❌ Remove sidebar completely
- ✅ Replace with minimal top navigation
- ✅ Horizontal nav bar with text-only links
- ✅ Subtle underline for active page
- ✅ User menu in top-right corner

**Navigation Items to Include:**
1. Overview (current page)
2. Emissions
3. Energy
4. Water
5. Waste
6. Compliance
7. Targets (admin only)
8. Data (admin only)
9. Intelligence (admin only)
10. AI Assistant (admin only)
11. Help & Learning

### 1.2 Help Menu

**Current:**
- Floating popup with dark background
- 5 educational topics with emoji icons
- Gradient header

**New Design:**
- ✅ Minimal dropdown (no popup)
- ✅ White background with subtle border
- ✅ Clean list items (no emoji, just text)
- ✅ Small text (12px)

**Educational Topics:**
1. Carbon Basics
2. Scopes Explained
3. Why It Matters
4. Reduction Strategies
5. SBTi Targets

---

## 🎛️ Filter Controls

### 2.1 Site Selector

**Current:**
- Dark button with border
- Building2 icon + text + ChevronDown
- Dropdown with cards for each site
- Site details (name, city, size)

**New Design:**
- ✅ Minimal text button with subtle border
- ✅ No icon (just text: "All Sites" or site name)
- ✅ Simple dropdown list
- ✅ Clean hover states (no dark backgrounds)
- ✅ font-light for all text

### 2.2 Time Period Selector

**Current:**
- Similar dark button style
- Dropdown with time ranges

**New Design:**
- ✅ Minimal text button
- ✅ Simple list dropdown
- ✅ Clean typography

### 2.3 Reset Button

**Current:**
- Green accent button

**New Design:**
- ✅ Minimal text link (no button background)
- ✅ Small green underline on hover

---

## 📊 Dashboard Content Sections

### 3.1 Performance Score Section (3 Columns)

**Current:**
- White/dark card with padding
- 180px circular score
- Medium font sizes
- Category scores with progress bars
- Site rankings with medal emojis

**New Design (ALREADY BUILT in OverviewDashboardMinimal):**
- ✅ NO card - just on white
- ✅ 240px circular score
- ✅ text-7xl grade (72px) - font-light
- ✅ Category scores with text-5xl numbers (48px) - font-light
- ✅ Site rankings with text-2xl (24px) - font-light
- ✅ No emojis, no progress bars
- ✅ 64px gaps between columns

**Sub-sections:**
1. **Circular Performance Score**
   - Overall score (0-100)
   - Letter grade (A/B/C/D)
   - Improvement velocity badge
   - Peer percentile badge
   - Data completeness %
   - Confidence level
   - Last updated timestamp
   - Recalculate button (super admin)

2. **Category Scores (8 categories)**
   - Scope 1 emissions
   - Scope 2 emissions
   - Scope 3 emissions
   - Energy consumption
   - Water usage
   - Waste management
   - Transportation
   - Compliance status
   - Each with: score/100, trend arrow, tooltip

3. **Site Rankings**
   - Top 5 sites by performance
   - Site name, score, grade
   - Tooltips with details

### 3.2 Executive Summary Cards (4 Cards)

**Current:**
- 4 separate cards in grid
- White/dark backgrounds
- Icons in colored circles
- Medium text sizes
- Progress indicators

**New Design:**
- ✅ NO cards - just sections on white
- ✅ text-7xl numbers (72px) - font-light
- ✅ text-xs labels (12px) - uppercase, tracking-[0.2em]
- ✅ No icons
- ✅ Single green for positive trends
- ✅ 64px gaps between sections

**Cards:**
1. **Total Emissions**
   - Current value (tCO2e)
   - YoY change %
   - Trend arrow
   - Carbon equivalents (flights, cars, trees)
   - Tooltip with explanation

2. **Emissions Intensity**
   - Per employee OR per sqm
   - YoY change %
   - Trend arrow
   - Benchmark comparison
   - Tooltip with calculation

3. **Projected End-of-Year**
   - ML-forecasted annual emissions
   - Confidence level
   - Comparison to target
   - Tooltip with forecast methodology

4. **Data Quality**
   - Score 0-100
   - Completeness %
   - Coverage analysis
   - Tooltip with data sources

### 3.3 Monthly Emissions Trend Chart

**Current:**
- Recharts line chart
- Multiple colors
- Gradient fills
- Heavy grid
- Dark background

**New Design (ALREADY BUILT):**
- ✅ Single green line (#10B981)
- ✅ 2px line width
- ✅ NO gradient fills
- ✅ Horizontal grid only (very light gray #F3F4F6)
- ✅ NO vertical grid
- ✅ NO axis lines
- ✅ NO tick marks
- ✅ Minimal hover dots
- ✅ Clean tooltip (white bg, small text)
- ✅ 384px height (h-96)

**Chart Data:**
- 12 months of emissions
- Hover tooltips with exact values
- YoY comparison if available

### 3.4 Scope Analysis Section

**Current:**
- Cards with icons
- Progress bars
- Multiple colors
- Pie chart with gradients

**New Design (ALREADY BUILT):**
- ✅ NO cards
- ✅ text-6xl percentages (60px) - font-light
- ✅ 3-column grid (Scope 1/2/3)
- ✅ text-sm values below (14px)
- ✅ text-xs labels (12px) - uppercase
- ✅ Single green accent
- ✅ 64px gaps

**Sub-sections:**
1. **Scope 1 (Direct Emissions)**
   - Percentage of total
   - Absolute value (tCO2e)
   - YoY change
   - Top sources
   - Tooltip with methodology

2. **Scope 2 (Electricity)**
   - Percentage of total
   - Location-based value
   - Market-based value
   - Renewable energy %
   - YoY change
   - Tooltip with calculation methods

3. **Scope 3 (Value Chain)**
   - Percentage of total
   - Absolute value (tCO2e)
   - Coverage by category (15 categories)
   - YoY change
   - Top categories
   - Tooltip with categories explained

### 3.5 SBTi Target Progress Section (if targets exist)

**Current:**
- Large card with gradient header
- 5 metric cards in grid
- Waterfall chart with multiple colors
- Educational tooltip

**New Design:**
- ✅ NO card wrapper
- ✅ Section title: text-xs uppercase
- ✅ 5 metrics in horizontal row
- ✅ text-2xl numbers (24px) - font-light
- ✅ Waterfall chart: minimal colors (gray, green, blue, red, orange)
- ✅ Clean tooltip
- ✅ 80px gap above section

**Metric Cards:**
1. **Baseline Emissions**
   - Baseline year
   - Emissions value
   - Label: "Baseline"

2. **Current Emissions**
   - Current year
   - Current value OR ML-forecasted projection
   - Asterisk if forecasted
   - Label: "Current"

3. **Required Emissions**
   - Current year
   - Linear trajectory target
   - Label: "Required (On Track)"

4. **Final Target**
   - Target year
   - Target emissions
   - Reduction %
   - Label: "Target"

5. **Progress**
   - % complete
   - Status (On Track / At Risk / Above Baseline)
   - Color-coded (green/yellow/orange/red)

**Waterfall Chart:**
- Shows trajectory from baseline → current → target
- 6 bars: Baseline, Required Reduction, Required Target, Gap, Current Actual, Final Target
- Interactive tooltips
- 300-420px height (responsive)

### 3.6 Top Emitters Section

**Current:**
- White/dark card
- Pie chart with rainbow colors
- Complex label positioning
- Orange AlertTriangle icon
- Educational tooltip

**New Design (ALREADY BUILT):**
- ✅ NO card
- ✅ text-xs uppercase section title (12px)
- ✅ Pie chart with muted colors (avoid rainbow)
- ✅ Minimal labels
- ✅ Clean tooltip
- ✅ 320-420px height (responsive)

**Pie Chart Segments:**
- Top 8-10 emission sources
- Each with: name, value (tCO2e), percentage
- Smart label positioning to avoid overlap
- Interactive tooltips on hover
- "Other" category for remaining sources

**Emission Sources Examples:**
- Electricity
- Natural Gas
- Business Travel
- Employee Commuting
- Purchased Goods
- Fuel Combustion
- Refrigerants
- Waste

---

## 📚 Educational Features

### 4.1 Hover Tooltips

**Current:**
- Purple/blue gradient background
- White text
- Multiple sections
- Compliance badges
- "Learn More" links
- Arrow indicator

**New Design:**
- ✅ White background with subtle shadow
- ✅ Gray text (text-gray-900)
- ✅ Minimal border (border-gray-100)
- ✅ Small font (text-xs = 12px)
- ✅ No gradient backgrounds
- ✅ No arrow indicator
- ✅ Clean "Learn More" link (green underline)
- ✅ Compliance badges: minimal pills with subtle borders

**Tooltip Types:**
1. **Metric Explanations**
   - What it means
   - How it's calculated
   - Why it matters
   - How to improve it

2. **Carbon Equivalents**
   - Round-trip flights
   - Miles driven
   - Trees needed to offset
   - With icons (minimal)

3. **Compliance Badges**
   - GRI 305-1 to 305-7
   - TCFD recommendations
   - ISO 14064-1
   - CDP disclosure
   - EU Taxonomy

4. **Data Quality Indicators**
   - Completeness %
   - Confidence level
   - Data sources
   - Last updated

### 4.2 Educational Modal

**Current:**
- Full-screen overlay
- Dark gradient background
- Multiple sections with rich content
- Icons and illustrations
- Close button

**New Design:**
- ✅ White background
- ✅ Centered modal (max-width 800px)
- ✅ Clean typography (font-light)
- ✅ Minimal close button (X in top-right)
- ✅ Simple sections with text-only
- ✅ No illustrations or heavy visuals
- ✅ Single green accent for links

**Modal Topics:**
1. Carbon Basics
2. Scopes Explained
3. Why It Matters
4. Reduction Strategies
5. SBTi Targets

---

## 🎨 Design Transformation Summary

### Colors

**Current:**
- Background: Dark (`#000000`, `#1a1a1a`, `#2A2A2A`)
- Accents: Purple, Blue, Green, Orange, Red (rainbow)
- Gradients: Multiple color gradients everywhere

**New:**
- Background: Pure white (`#FFFFFF`)
- Text: Gray scale (`text-gray-900`, `text-gray-600`, `text-gray-400`)
- Accent: Single green (`#10B981`)
- Borders: Ultra-subtle (`border-gray-100`, `border-gray-50`)

### Typography

**Current:**
- Sizes: 14px to 36px
- Weights: font-medium (500), font-semibold (600), font-bold (700)
- Line heights: Normal

**New:**
- Numbers: text-7xl (72px), text-6xl (60px), text-5xl (48px), text-2xl (24px)
- Labels: text-xs (12px) - uppercase, tracking-[0.2em]
- Text: text-sm (14px)
- Weight: font-light (300) EVERYWHERE
- Line heights: Generous for breathing room

### Spacing

**Current:**
- Gaps: 16px, 24px
- Padding: 16px to 24px
- Section spacing: 24px

**New:**
- Gaps: gap-16 (64px), gap-20 (80px)
- Padding: px-16 py-16 (64px all sides)
- Section spacing: space-y-20 (80px)
- Max width: max-w-[1400px] (never full width)

### Components

**Current:**
- Cards: Everywhere with bg, border, shadow, padding
- Borders: All cards have borders
- Shadows: Drop shadows on cards
- Icons: Icon backgrounds, colored circles
- Progress bars: Animated bars for scores
- Gradients: Background gradients

**New:**
- Cards: ❌ REMOVED - just content on white
- Borders: Only for dividers (1px, ultra-subtle)
- Shadows: ❌ REMOVED
- Icons: ❌ REMOVED (or minimal, no backgrounds)
- Progress bars: ❌ REMOVED - just numbers
- Gradients: ❌ REMOVED - flat colors only

---

## 📏 Layout Grid

### Current Layout:
```
┌──────────────────────────────────────────┐
│ [Sidebar 280px] │ [Content Full Width]   │
│                 │                         │
│                 │ ┌─────┐ ┌─────┐        │
│                 │ │Card1│ │Card2│        │
│                 │ └─────┘ └─────┘        │
│                 │                         │
│                 │ ┌──────────────┐       │
│                 │ │  Chart Card  │       │
│                 │ └──────────────┘       │
└──────────────────────────────────────────┘
```

### New Layout:
```
┌────────────────────────────────────────────┐
│  [Minimal Header - Full Width Sticky]      │
│  Title    [Site] [Period]    [Nav Menu →]  │
├────────────────────────────────────────────┤
│                                            │
│     [Max-width 1400px Container]           │
│     [60px padding all sides]               │
│                                            │
│     Performance                            │
│                                            │
│     87       Category Scores    Rankings   │
│                                            │
│     89  92  45  78                         │
│                                            │
│     ─────────────────────────────────      │
│                                            │
│     KEY METRICS                            │
│                                            │
│     1234    6.2    1450    94              │
│                                            │
│     ─────────────────────────────────      │
│                                            │
│     [Chart - single green line]            │
│                                            │
│     ─────────────────────────────────      │
│                                            │
│     EMISSIONS BY SCOPE                     │
│                                            │
│     19 %    37 %    44 %                   │
│                                            │
└────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Page Structure
- [ ] Create custom minimal header (no BaseSidebarLayout)
- [ ] Horizontal navigation bar with text links
- [ ] Sticky header with white background
- [ ] User menu in top-right
- [ ] Pure white page background

### Phase 2: Filter Controls
- [ ] Redesign SiteSelector (minimal button + dropdown)
- [ ] Redesign TimePeriodSelector (minimal button + dropdown)
- [ ] Minimal Reset button (text link)

### Phase 3: Dashboard Content (MOSTLY DONE)
- [x] Performance Score (OverviewDashboardMinimal - done)
- [x] Category Scores (done)
- [x] Site Rankings (done)
- [x] Executive Summary metrics (done)
- [x] Monthly trend chart (done)
- [x] Scope analysis (done)
- [x] Top emitters chart (done)
- [ ] SBTi targets section (partial - needs minimal styling)

### Phase 4: Educational Features
- [ ] Redesign hover tooltips (white background)
- [ ] Minimal compliance badges
- [ ] Clean "Learn More" links
- [ ] Redesign Educational Modal (white, centered)

### Phase 5: Navigation
- [ ] Help menu dropdown (white, minimal)
- [ ] Educational topics list
- [ ] User menu

### Phase 6: Polish
- [ ] Remove all dark mode classes
- [ ] Remove all gradients
- [ ] Remove all backdrop-blur
- [ ] Remove all box-shadows
- [ ] Apply font-light everywhere
- [ ] Ensure 64-80px spacing throughout
- [ ] Test all interactions
- [ ] Verify all tooltips work

---

## 🎯 Success Criteria

**You should think:**
- ✅ "This looks like a completely different product"
- ✅ "Every single element has been redesigned"
- ✅ "This is BOLD and MINIMAL like Firecrawl"
- ✅ "The numbers are HUGE"
- ✅ "There's SO MUCH whitespace"
- ✅ "No cards, no borders, no clutter"
- ✅ "This feels expensive and premium"
- ✅ "I can see ALL my data but it's incredibly clean"

**You should NOT think:**
- ❌ "This is just the same dashboard but green"
- ❌ "The layout looks familiar"
- ❌ "There are still cards and borders"
- ❌ "The spacing feels cramped"

---

## 📊 Total Element Count

**Major Sections:** 6
1. Performance Score
2. Executive Summary
3. Charts & Trends
4. Scope Analysis
5. SBTi Targets
6. Top Emitters

**Navigation Elements:** 3
1. Main navigation (11 items)
2. Help menu (5 topics)
3. User menu

**Filter Controls:** 3
1. Site Selector
2. Time Period Selector
3. Reset button

**Educational Features:** 4
1. Hover tooltips (50+ tooltips across all metrics)
2. Carbon equivalents
3. Compliance badges
4. Educational modal (5 topics)

**Charts:** 3
1. Monthly emissions trend (line chart)
2. Top emitters (pie chart)
3. SBTi waterfall (bar chart)

**Total Interactive Elements:** 100+ individual components

---

**This is the COMPLETE inventory.** Every element on the `/sustainability` page is listed here and will be redesigned with the bold minimal aesthetic.
