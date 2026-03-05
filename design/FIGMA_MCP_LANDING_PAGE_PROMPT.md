# SmartAgri Landing Page - Figma MCP Prompt

Use this prompt with your Figma MCP workflow to generate a production-ready design that matches the implemented landing page in `src/app/page.tsx`.

## Prompt

Create a complete landing page design for **SmartAgri MVP** (desktop + mobile), with a premium agriculture-tech visual style:

- Bold but practical typography
- Clear conversion-first hierarchy
- Green/teal/cyan palette (no purple)
- Glassmorphism panels with subtle gradients
- Distinct hero, capability, process, and final CTA sections
- Strong spacing and component consistency
- Accessible contrast and mobile responsiveness

## Canvas + Breakpoints

- Desktop frame width: `1440`
- Tablet frame width: `1024`
- Mobile frame width: `390`
- Layout grid:
  - Desktop: 12 columns, 72 margin, 24 gutter
  - Tablet: 8 columns, 40 margin, 20 gutter
  - Mobile: 4 columns, 20 margin, 16 gutter

## Design Tokens

- Font families:
  - Primary: Manrope
  - Display/Accent: Space Grotesk
- Type scale:
  - Hero H1: 64/1.05, 800
  - Section title: 40/1.15, 700
  - Card title: 22/1.2, 700
  - Body lg: 18/1.5, 500
  - Body md: 16/1.5, 500
  - Body sm: 14/1.45, 500
  - Label xs: 12/1.3, 700

- Colors:
  - Background base: `#04070f`
  - Surface: `rgba(255,255,255,0.05)`
  - Surface strong: `rgba(255,255,255,0.09)`
  - Border: `rgba(255,255,255,0.12)`
  - Text primary: `#eef5ff`
  - Text secondary: `#c2cfde`
  - Text muted: `#93a4b8`
  - Brand green: `#33d17a`
  - Brand teal: `#35d4c0`
  - Accent cyan: `#67e8f9`

- Effects:
  - Card blur: 14
  - Shadow: `0 16 40 rgba(0,0,0,0.42)`
  - Hover glow: subtle emerald outer glow
  - Decorative blobs: emerald + cyan blurred circles in hero

## Page Sections (must include)

1. Top header nav:
   - Brand mark + title + subtitle
   - Login and Get Started buttons

2. Hero:
   - Badge line
   - Multi-line high-impact headline
   - Supporting paragraph
   - Two CTA buttons
   - Right-side “Control Center Snapshot” card with 4 metrics and recommendation strip

3. Trust strip:
   - 4 horizontal cards with quick trust/value statements

4. Platform capabilities:
   - Section heading + intro
   - 6 feature cards:
     - Live Crop Insights
     - Leaf Disease Scan
     - Smart Irrigation
     - Voice Assistant
     - Produce Marketplace
     - Waste Exchange

5. How it works:
   - Left column: 4 step cards
   - Right column: “Built for Scale” cards for farmers, partners, institutions

6. Final CTA:
   - Gradient panel
   - Heading + short paragraph
   - Create Account and Sign In buttons

## Component Rules

- Use reusable components:
  - `Button/Primary`
  - `Button/Secondary`
  - `Card/Feature`
  - `Card/Metric`
  - `Card/Step`
  - `Section/Header`

- Maintain consistent corner radius:
  - Container: 24
  - Cards: 16
  - Pills: 999

- Spacing scale:
  - 4, 8, 12, 16, 20, 24, 32, 40, 56

## Output

- Desktop, tablet, and mobile variants
- Clean layer naming for handoff
- Auto-layout on all major containers
- Export-ready component library page
- Include short annotation notes for developers on spacing and breakpoints

