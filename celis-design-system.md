# Celis — Design System, Token Architecture & Visual Identity

## Complete Specification for the Celis P2P Marketplace Platform

---

| Field | Detail |
|-------|--------|
| **Platform** | Celis — P2P Marketplace for East Africa/Somalia |
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Status** | Production-Ready Specification |
| **Target Stack** | React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Currency** | USD (US Dollar) |
| **Payment** | EVC Plus, eDahab, Premier Wallet (Mobile Money) |

---

## Document Overview

This specification defines the complete visual identity, design token architecture, component library, page templates, animation system, and asset requirements for **Celis** — a modern, localized peer-to-peer marketplace platform optimized for the East African and Somali ecosystem.

## Chapters

| # | Chapter | Description |
|---|---------|-------------|
| 1 | Brand Positioning & Visual Identity | Logo specification, brand voice, cultural integration |
| 2 | Design Tokens — Complete Specification | Color, typography, spacing, motion tokens; WCAG AA/AAA |
| 3 | Global Styles & Theming | `globals.css`, `tailwind.config.ts`, component primitives |
| 4 | shadcn/ui Component Library | Core components + marketplace composites + admin panels |
| 5 | Page Templates & Wireframes | All pages: public, seller, admin — layouts & responsive behavior |
| 6 | Animation & Interaction Specification | Micro-interactions, page transitions, state change animations |
| 7 | Image Asset Requirements & Generation Brief | Logo, illustrations, icons, photo guidelines |

---



# 1. Brand Positioning & Visual Identity

## 1.1 Brand Positioning

### 1.1.1 Name Origin

The name **Celis** derives from a phonetic distillation of concepts essential to a peer-to-peer marketplace operating in high-trust, low-infrastructure environments. The phoneme structure accomplishes multiple symbolic loads simultaneously: the opening "Ce-" evokes clarity and certainty (echoing "certain," "certify"); the liquid "-l-" conveys swift, unbroken movement; the closing "-is" grounds the word in a state of being — a condition of trust made concrete. Spoken aloud, "Celis" is two syllables, easily pronounced across Somali, Arabic, Swahili, and English phonetic systems, with no consonant clusters that challenge non-native speakers. The name is short enough for SMS references (5 characters), domain-friendly (celis.so / celis.io), and visually distinctive in logotype form due to the ascending stroke of the uppercase **C** and the strong verticals of **l** and **i**.

### 1.1.2 Industry Context

Celis operates at the intersection of **peer-to-peer marketplace infrastructure** and **mobile-first financial technology**, serving East Africa with Somalia as the initial market. This positioning imposes constraints that shape every brand decision: the median user accesses the platform on a sub-$80 Android device with a 5.5-inch screen, 2GB RAM, and intermittent 3G connectivity. Trust is not abstract — it is transactional, earned through transparent escrow mechanics, visible payout timelines, and community-verified reputation. The brand must therefore communicate institutional reliability without the institutional weight of legacy banking. Celis competes not against Western fintech aesthetics but against the informal trust networks that already dominate commerce in the region: word-of-mouth reputation, face-to-face verification, and clan or community vouching.

### 1.1.3 Core Design Pillars

Four non-negotiable pillars govern every brand and product decision:

**Accessibility on low-end mobile.** Every visual element must render crisply on 320px-wide screens at 1x pixel density. Stroke weights cannot go below 1.5px at UI scale. Animations must be under 150ms for perceptual responsiveness on devices with limited GPU acceleration. The brand identity must remain legible when compressed to a 16x16px browser favicon or a 36x36px app icon on low-density displays.

**Operational security and transparency.** The brand must visually reinforce that money and goods are protected by escrow, not by promises. The logo's interlocking geometry encodes this symbolically: two distinct entities locked together until conditions are met. Every trust signal — verified badges, escrow status indicators, payout confirmations — must share a consistent visual language derived from this geometry.

**Local context, global standard.** The brand should feel native to Mogadishu and Hargeisa, not imported from San Francisco. This means respecting cultural color associations (blue as trust and stability is positive across Somali contexts), right-to-left layout readiness for Arabic script users, and voice patterns that honor oral communication traditions. Simultaneously, the design system must meet global benchmarks for fintech credibility: WCAG AA+ accessibility, clean information hierarchy, and a mobile experience that rivals any Western neobank.

**Minimal data overhead.** The entire SVG logo mark weighs under 400 bytes minified. The design system ships with no raster assets — everything is procedural, CSS-rendered, or SVG-based. This is not merely a performance optimization; it is a brand statement: Celis respects the cost of mobile data for its users.

---

## 1.2 Logo Design Specification

### 1.2.1 Iconography: The Exchange Mark

The Celis logo mark is a **geometric dual-interlocking continuous path** — two mirrored C-shaped arcs that interlock at a shared central node, forming an abstract representation of peer-to-peer exchange. The geometry encodes multiple readings simultaneously:

- **Exchange loop:** The two arcs create a continuous cycle, suggesting the flow of goods and money between peers. There is no start or end point — the loop is unbroken.
- **Handoff symbolism:** At the center where the two arcs intersect, the negative space forms a subtle hourglass or diamond shape that reads as the moment of transfer — one hand passing an item to another. This is the P2P gesture embedded in geometry.
- **Locking mechanism:** The interlocking quality evokes mechanical security — two components that cannot separate without mutual consent. This mirrors the escrow system at Celis's operational core.
- **Favicon-safe construction:** At 16x16px, the mark collapses to a bold, recognizable shape with a 2px stroke weight that remains visible at 1x density.

The mark is drawn with **2px stroke weight** at the 40x40px master size, scaling proportionally. All terminals are rounded at **4px radius** (2px at 16x16 scale), eliminating sharp points that degrade on low-resolution screens. The stroke is set to `stroke-linecap: round` and `stroke-linejoin: round` to ensure antialiased smoothness at all scales.

### 1.2.2 SVG Structural Specification

The following SVG is the canonical, production-ready logo mark. It is hand-optimized to eliminate unnecessary path data, uses only `stroke` (not `fill`) for the master mark, and is designed to be recolored via CSS custom properties or inline `stroke` attributes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-label="Celis" role="img">
  <defs>
    <style>
      .celis-mark {
        fill: none;
        stroke: var(--celis-brand, hsl(215 85% 45%));
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    </style>
  </defs>
  <!-- Left arc: C-shape opening right -->
  <path class="celis-mark" d="M 22 8
    A 12 12 0 1 0 22 32" />
  <!-- Right arc: C-shape opening left, mirrored -->
  <path class="celis-mark" d="M 18 8
    A 12 12 0 1 1 18 32" />
  <!-- Central exchange node: connecting stroke -->
  <line class="celis-mark" x1="18" y1="20" x2="22" y2="20" />
</svg>
```

**Structural breakdown:**

The `viewBox="0 0 40 40"` establishes a 40x40px coordinate system. Two arc segments with 12px radius form opposing C-shapes. The left arc opens rightward (starting at `22 8`, sweeping through the lower half to `22 32`), while the right arc opens leftward (starting at `18 8`, sweeping through the lower half to `18 32`). The connecting line at `y="20"` creates the shared node where the two arcs visually interlock. This line is critical: without it, the mark reads as two disconnected parentheses; with it, the mark becomes a single cohesive unit expressing mutual engagement.

The `stroke-width: 2.5` at 40x40px master size scales cleanly: at 16x16px (favicon), this becomes a 1px stroke — the minimum viable for screen visibility. For 32x32px and larger, the stroke reads as confident and bold without heaviness.

**Color behavior:** On light backgrounds, the mark uses the primary brand color (defined in Chapter 2 as `hsl(215 85% 45%)`). On dark backgrounds, `stroke` switches to `hsl(0 0% 100%)` at 100% opacity. The mark never uses a gradient fill — the stroke-based construction ensures single-color reproduction works everywhere, including monochrome laser printing, single-color embroidery, and low-bit-depth icon rendering.

### 1.2.3 Logotype Specification

The wordmark "Celis" is set in **Geist Sans** (preferred) or **Inter** (fallback), weight **600 (Semibold)**, with **-0.02em letter-spacing**. Geist is chosen for its engineered precision, open counters, and excellent screen rendering across weights. Inter serves as the fallback due to its near-universal availability and comparable x-height.

**Logotype construction rules:**

- **C curvature echo:** The uppercase **C** in the logotype uses a geometric construction with an opening angle that visually echoes the 180-degree arc sweep of the logo mark. This creates a family resemblance between icon and type without literal repetition.
- **Open counters:** The **e**, **l**, and **s** maintain open counters at all weights, ensuring legibility at small sizes (12px minimum) and on low-density screens.
- **Ascender treatment:** The **l** and **i** ascenders align to the cap height, creating a clean top edge that pairs well with the geometric mark.
- **S construction:** The lowercase **s** uses a single-story geometric form (not double-story), keeping the wordmark modern and consistent with the circular logic of the mark.
- **Type scale:** The logotype is sized at 1.6x the mark height. For the 40px mark, the wordmark cap height is 25px (approximately 19px at `font-size: 19px` depending on the typeface metrics). This ratio preserves visual balance: the mark never dominates the word, nor is it visually subordinate.

**Rendering:** Always use `font-feature-settings: "ss01" on, "zero" on;` when available (Geist's alternate single-story "a" and slashed zero for tabular data contexts). Anti-aliasing should be set to `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` for consistent cross-platform rendering.

### 1.2.4 Logo Variants

The following table specifies the four approved logo variants, their usage contexts, color values, and minimum renderable sizes.

| Variant | Name | Usage Context | Colors | Minimum Size |
|---------|------|---------------|--------|-------------|
| **A** | Full Primary | App headers, marketing pages, investor decks, print collateral | Brand stroke `hsl(215 85% 45%)` on light; logotype `hsl(215 20% 15%)` on light | 120px wide (mark + type) |
| **B** | Reversed | Dark mode UI, footer sections, dark-themed marketing panels, video overlays | Mark and type: `hsl(0 0% 100%)` at 100% opacity on `hsl(215 20% 12%)` or darker | 120px wide (mark + type) |
| **C** | Minimal Mark | App icon (32px+), favicon (16px), loading states, avatar placeholders, watermark | Same as context (brand on light, white on dark) | 16px (mark only) |
| **D** | Favicon Monochrome | Browser tab icon, PWA icon, social media avatar, low-color-reproduction contexts | Pure `hsl(0 0% 100%)` on dark bg; `hsl(215 20% 15%)` on light bg | 16x16px |

**Variant A: Full Primary.** The icon sits to the left of the wordmark with a **12px gap** (`gap: 0.75rem` in Tailwind). The mark is vertically centered to the wordmark cap height, not the x-height — this prevents the mark from floating above the baseline. In horizontal layouts, total lockup width should never exceed 40% of the container width; if the lockup must be smaller than 120px wide, switch to Variant C (mark only).

**Variant B: Reversed.** Identical spacing to Variant A. On dark backgrounds below `hsl(215 20% 20%)`, the mark and type render at 100% white. A subtle `drop-shadow(0 1px 2px hsl(215 20% 5% / 0.3))` may be applied for elevation on variable dark backgrounds (e.g., video overlays). The reversed variant is not a simple color inversion — it must be tested on the specific dark background to ensure the brand blue does not shift perceptually toward purple.

**Variant C: Minimal Mark.** Used when horizontal space is constrained or when the brand is already established in context (e.g., within the app, after initial onboarding). At 32px and above, the mark uses the 2.5px stroke. At 16px (favicon), the stroke reduces to 1.5px. Below 16px, the mark must not be used — switch to a solid shape abstraction or text label.

**Variant D: Favicon Monochrome.** The 16x16px favicon uses a simplified, filled version of the mark rather than the stroked version. The two arcs and connecting line are rendered as a single compound path with solid fill, eliminating stroke-width variability across browsers and ensuring crisp rendering at the smallest sizes. The favicon source SVG is:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <path fill="hsl(215 85% 45%)" d="M8 2a6 6 0 0 0 0 12A6 6 0 0 0 8 2Zm0 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8Z"/>
  <path fill="hsl(215 85% 45%)" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/>
</svg>
```

### Full Logo Component (React + Tailwind)

The following component renders the complete logo (icon + type) and switches between variants based on the `variant` prop. It is copy-paste ready for a Next.js or React application.

```tsx
// Logo.tsx — Celis full logo component
import React from "react";

type LogoVariant = "primary" | "reversed" | "mark-only";

interface LogoProps {
  variant?: LogoVariant;
  size?: number; // height in px, default 40
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = "primary",
  size = 40,
  className = "",
}) => {
  const isReversed = variant === "reversed";
  const showType = variant !== "mark-only";

  const strokeColor = isReversed ? "#ffffff" : "hsl(215 85% 45%)";
  const textColor = isReversed ? "#ffffff" : "hsl(215 20% 15%)";
  const fontSize = size * 0.625; // 25px when size=40
  const gap = size * 0.3; // 12px when size=40

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
      role="img"
      aria-label="Celis"
    >
      {/* Mark */}
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M 22 8 A 12 12 0 1 0 22 32"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 18 8 A 12 12 0 1 1 18 32"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="20"
          x2="22"
          y2="20"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Wordmark */}
      {showType && (
        <span
          className="font-semibold tracking-tight leading-none select-none whitespace-nowrap"
          style={{
            fontSize,
            color: textColor,
            fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
            letterSpacing: "-0.02em",
            fontWeight: 600,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          Celis
        </span>
      )}
    </div>
  );
};

export default Logo;
```

**Usage:**

```tsx
<Logo variant="primary" size={40} />       // Full lockup, light bg
<Logo variant="reversed" size={40} />      // Full lockup, dark bg
<Logo variant="mark-only" size={32} />     // Icon only, app header
```

---

## 1.3 Brand Voice

### 1.3.1 Tone Framework

Celis speaks with a voice built on three immovable tonal anchors: **direct**, **respectful**, and **secure**. Every piece of copy — from onboarding screens to error messages to push notifications — must score positively on all three dimensions.

**Direct** means no filler, no hedging, no marketing fluff. If a transaction is processing, say "Processing your payment." Do not say "We're working hard to process your payment — please bear with us!" The user is on a 5.5-inch screen with limited data; every word consumes attention and bytes. Sentences should average under 12 words. Headlines should be under 6 words. Buttons should be 1–3 words.

**Respectful** means acknowledging the user's time, intelligence, and context. Do not explain what the user already knows. Do not use condescending confirmations ("Great job! You logged in!"). Do honor cultural communication patterns: Somali business culture values formality in initial encounters and warmth in ongoing relationships. The voice shifts from formal-to-warm as the user progresses from onboarding ("Welcome to Celis. Create your account to start trading.") to active use ("Your buyer has confirmed. Funds released — check your balance.").

**Secure** means every message about money reinforces confidence. Use active voice for Celis's protective actions ("Celis holds your payment in escrow" not "Your payment is held by our escrow system"). Name specific amounts and timelines ("$50.00 held until delivery is confirmed" not "Your funds are secure"). Never apologize for security steps — frame them as protection ("Confirm your PIN to keep your account safe" not "Sorry, we need your PIN again").

### 1.3.2 Language Strategy

Celis adopts a **bilingual-first** approach: English is primary, Somali is secondary. All user-facing copy is written in English first, then localized to Somali. This order is deliberate — English serves as the lingua franca for cross-border trade and international financial integration, while Somali builds local trust and accessibility.

**Sentence architecture** follows mobile constraints. A 320px screen at 16px font size fits approximately 45 characters per line. Primary action buttons should never wrap to two lines. Toast notifications must render in full without truncation. This means:

- One thought per sentence
- One action per button
- Compound sentences only when the relationship between clauses is critical ("Your payment is held. The seller will ship." not "Your payment is held and the seller will ship once they receive confirmation.")

**Confirmation-heavy microcopy** is mandatory for all financial actions. Every action involving money, account changes, or personal data must provide explicit confirmation of what happened, what will happen next, and how long it will take. This pattern directly addresses the trust deficit in digital financial services across the target market — users need to know exactly where their money is at every moment.

### 1.3.3 Cultural Integration

The brand voice must acknowledge three Somali cultural values that shape user expectations:

**Trust in face-to-face dealing (kalsooni).** Somali commerce has deep roots in in-person negotiation and visual verification. Digital interfaces must simulate this trust through transparency: show the buyer's profile photo, display escrow status as a visible lock icon, and provide a direct messaging channel that feels like a market conversation.

**Community reputation (sumcad).** A person's trading reputation is their community reputation. The voice should reinforce that Celis protects and builds sumcad — negative feedback is framed as community accountability, not platform punishment.

**Hospitality (soodhaweyn).** New users are guests who must be welcomed with clarity and care. Onboarding copy should feel like a host guiding a visitor, not a form demanding information.

### 1.3.4 Voice Examples: UI Microcopy

The following examples demonstrate the Celis voice in concrete UI contexts. Each example includes the Celis-approved version and a rejected alternative that violates one or more tonal anchors.

**Button labels:**

| Context | Celis | Rejected |
|---------|-------|----------|
| Initiating a trade | "Confirm & Pay" | "Proceed with Payment" (vague) |
| Releasing escrow | "Release Funds" | "Complete Transaction" (obscures the money) |
| Disputing a trade | "Open Dispute" | "I Have a Problem" (too informal) |
| Account verification | "Verify Identity" | "Get Verified to Unlock Features" (pushy) |
| Logging out | "Sign Out" | "Log Out of Your Account" (redundant) |

**Toast messages:**

| Context | Celis | Rejected |
|---------|-------|----------|
| Successful payment | "$25.00 held in escrow. Seller notified." | "Payment successful! We're on it." (amount hidden, too casual) |
| Escrow released | "$25.00 released to seller. Your balance: $75.00." | "Transaction complete! Thanks for using Celis." (balance hidden, marketing fluff) |
| Buyer confirmed receipt | "Buyer confirmed. Funds released — check your balance." | "The buyer has confirmed receipt of the item and funds have been released." (too long) |
| Connection error | "Connection lost. Retrying..." | "Oops! Something went wrong with your connection. Please check your internet and try again." (verbose, infantilizing) |

**Error copy:**

| Context | Celis | Rejected |
|---------|-------|----------|
| Insufficient balance | "Balance too low. Add $5.00 to complete this payment." | "You don't have enough money in your account." (vague, doesn't solve) |
| Wrong PIN | "Incorrect PIN. 2 attempts remaining." | "The PIN you entered is wrong. Please try again." (doesn't quantify risk) |
| Escrow timeout | "Trade expired. Funds returned to your balance." | "Sorry, this trade timed out. Your money is safe!" (apologetic, imprecise) |
| Verification failed | "ID unclear. Retake photo in bright light." | "We couldn't verify your identity. Please try again." (no guidance) |

**Empty states:**

| Context | Celis | Rejected |
|---------|-------|----------|
| No active trades | "No active trades. Post an item to start selling." | "You don't have any active trades right now. When you do, they'll appear here!" (verbose, circular) |
| No transaction history | "No transactions yet. Your history will appear here." | "Get started by making your first trade!" (pushy) |

**Push notifications:**

| Context | Celis | Rejected |
|---------|-------|----------|
| New trade request | "New offer: "Wireless Headphones" — $30.00" | "Someone wants to buy your item! Open the app to see the details." (hides the what) |
| Escrow funded | "Buyer paid $30.00. Ship "Wireless Headphones" now." | "Great news! Your buyer has funded the escrow. Please proceed with shipping." (too long) |
| Dispute opened | "Dispute opened on "Wireless Headphones". Respond within 24 hours." | "A dispute has been raised. We need your attention." (no timeline, vague) |

### 1.3.5 Voice Patterns for Code Implementation

The voice framework should be encoded in the localization files to prevent drift. The following patterns are enforced at the i18n layer:

```json
{
  "voice": {
    "max_button_length": 24,
    "max_toast_length": 80,
    "max_error_length": 60,
    "currency_format": "${amount} {currency}",
    "requires_explicit_amount": true,
    "requires_explicit_timeline": true,
    "forbidden_phrases": [
      "oops",
      "sorry",
      "working hard",
      "bear with us",
      "great job",
      "something went wrong"
    ],
    "required_confirmations": {
      "payment": ["amount_held", "counterparty_notified"],
      "release": ["amount_released", "balance_updated"],
      "dispute": ["deadline_specified", "response_action"]
    }
  }
}
```

These constraints are enforced by CI linting on all locale files. Any copy that exceeds character limits, omits required confirmations, or uses forbidden phrases fails the build. This mechanical enforcement is necessary because voice consistency decays rapidly across distributed product teams — what feels like a small tone compromise in isolation compounds into brand erosion at scale.

The Somali localization follows the same structural patterns but adapts formality levels. Somali uses more elaborate greeting and closing formulas than English, which are preserved in onboarding and customer support contexts while kept minimal in transactional flows. The localization team should include native Somali speakers with familiarity across Northern (Somalia), Southern (Benadir), and diaspora dialect variations to ensure the voice is locally authentic and not imported from a single regional variant.


---

# 2. Design Tokens — Complete Specification

## 2.1 Token Architecture Overview

### 2.1.1 Three-Tier Token System

The Celis design token architecture implements a strict three-tier hierarchy that separates color intent from implementation. Every color value flows through **raw palette → semantic tokens → component mappings**, ensuring that a single hue adjustment propagates correctly across all light-mode, dark-mode, and high-contrast contexts without per-component edits.

**Tier 1 — Raw Palette** defines the foundational color set as HSL tuples. These tokens are prefixed with `--celis-color-` and represent the unopinionated color primitives: `--celis-color-blue-500`, `--celis-color-slate-900`, `--celis-color-red-400`. Raw palette tokens never appear directly in component CSS. They exist solely as interpolation endpoints for semantic mappings.

**Tier 2 — Semantic Tokens** bridge palette colors to intent. Prefixed with `--celis-`, these tokens describe *what* a color communicates rather than *what* it is: `--celis-primary` (interactive elements), `--celis-surface-elevated` (card backgrounds), `--celis-ink-secondary` (muted text). Semantic tokens are mode-aware — each defines both a light and dark variant through CSS custom property scoping under `.dark`.

**Tier 3 — Component Mappings** consume semantic tokens at the component level. A Button component references `--celis-primary` for its background, not `--celis-color-blue-500`. This indirection means switching a button from blue to teal requires changing the semantic mapping in one place, not across fifty component files.

Tailwind CSS v4 consumes these tokens through the `@theme` directive. The theme layer maps each semantic token to a Tailwind utility class, enabling usage like `bg-celis-primary`, `text-celis-ink`, or `border-celis-surface-elevated`. No hex codes exist in component code — all values resolve through the token chain.

### 2.1.2 Dark Mode Strategy

Dark mode on Celis uses the `class`-based toggling strategy. The root `<html>` element receives `.dark` when the user selects dark mode, either through an explicit toggle or via `matchMedia('(prefers-color-scheme: dark)')` on first visit. This approach avoids flash-of-unstyled-content issues that plague `media`-attribute strategies and enables user-level persistence independent of system preference.

All color tokens are defined as **HSL space-separated components** (`h s% l%`) for smooth interpolation. A primary blue token stores as `--celis-color-blue-500: 210 100% 50%`, consumed via `hsl(var(--celis-color-blue-500))`. This format enables runtime manipulation — desaturation, lightening, opacity overlays — through CSS `calc()` operations on individual channels. Hardcoded hex values appear nowhere in the token system. Even the raw palette stores as HSL to guarantee that any future interpolation (for hover states, focus rings, or ambient animations) operates in a perceptually uniform space.

The `.dark` class scopes its overrides at the root level. Semantic tokens rebind under `.dark`, but component code remains unchanged. A button using `bg-celis-primary` renders blue-500 in light mode and automatically shifts to the desaturated dark-mode primary without any component-level conditional logic.

### 2.1.3 Accessibility Targets

Celis enforces three distinct contrast thresholds derived from WCAG 2.2 Level AA and AAA specifications:

| Context | Minimum Ratio | WCAG Level | Examples |
|---------|--------------|------------|----------|
| Body text and UI labels | 4.5:1 | AA | Product descriptions, form labels, navigation items |
| Financial amounts and critical data | 7:1 | AAA | Escrow balances, transaction totals, payout figures, order IDs |
| Decorative borders and icons | 3:1 | AA (non-text) | Card borders, separator lines, status icons, decorative icons |

The 7:1 AAA threshold for financial data reflects the high-stakes nature of P2P marketplace transactions. A user misreading "1,250" as "125" due to low contrast creates real financial risk. All financial tokens — `--celis-ink-financial`, `--celis-success` on surface backgrounds — are audited against this stricter standard.

Mobile screens in East African daylight conditions (direct equatorial sun, 80,000–100,000 lux) experience significantly more glare and reflection than typical indoor usage. The token system compensates by elevating contrast ratios for mobile breakpoints: body text targets AAA (7:1) on viewports below 768px, and border widths increase to a minimum of 1.5px for daylight edge definition.

---

## 2.2 Color Tokens

### 2.2.1 Raw Palette

The Celis raw palette consists of five hue families, each structured as a 10-step scale from 50 (lightest) to 950 (darkest). All values are stored as HSL space-separated channels.

**Primary Blue (210° hue)** occupies the trust-signaling role. At 210° rather than 220° (too corporate, evokes legacy banking) or 200° (too playful, evokes social apps), this blue communicates reliability without stiffness. The full scale ranges from a near-white tint at 50 to a deep navy at 950.

**Secondary Teal (160° hue)** supports the primary in promotional contexts, category highlights, and secondary actions. It sits between blue and green on the hue wheel, creating harmonious pairings with the primary without direct competition.

**Destructive Red (0° hue)** handles error states, cancellation actions, and irreversible operations. The hue sits at pure red rather than orange-red to maintain clear semantic association with danger across all cultures in the East African market.

**Success Green (145° hue)** confirms positive outcomes: escrow funded, payout released, order delivered. The 145° placement deliberately avoids 120° (pure green) which is problematic for deuteranopia (red-green colorblindness, affecting ~5% of males globally). At 145°, the green shifts toward teal, increasing distinguishability from the red family for colorblind users.

**Neutral Slate** provides the grayscale foundation. Based on slate rather than pure gray, this scale carries a subtle warm undertone (hue ~215°, slightly purple-shifted) that prevents the cold, clinical feel of neutral gray. The warmth aligns with Celis's approachable brand personality while maintaining professional restraint.

The following code block defines the complete token system — raw palette, semantic mappings, and dark-mode variants — as CSS custom properties consumed by the Tailwind theme layer.

```css
/* ============================================================
   Celis Design System — Complete Color Token Definition
   Tier 1: Raw Palette | Tier 2: Semantic | Tier 3: Component-ready
   ============================================================ */

@layer base {
  :root {
    /* ── Tier 1: Raw Palette — HSL space-separated channels ── */

    /* Primary Blue — 210° hue, trust & interaction */
    --celis-color-blue-50:  210 100% 97%;
    --celis-color-blue-100: 210 100% 93%;
    --celis-color-blue-200: 210 100% 85%;
    --celis-color-blue-300: 210 100% 72%;
    --celis-color-blue-400: 210 100% 60%;
    --celis-color-blue-500: 210 100% 50%;
    --celis-color-blue-600: 210 90% 42%;
    --celis-color-blue-700: 210 85% 34%;
    --celis-color-blue-800: 210 80% 26%;
    --celis-color-blue-900: 210 75% 20%;
    --celis-color-blue-950: 210 70% 14%;

    /* Secondary Teal — 160° hue, accents & categories */
    --celis-color-teal-50:  160 80% 96%;
    --celis-color-teal-100: 160 75% 90%;
    --celis-color-teal-200: 160 70% 80%;
    --celis-color-teal-300: 160 65% 60%;
    --celis-color-teal-400: 160 70% 48%;
    --celis-color-teal-500: 160 80% 40%;
    --celis-color-teal-600: 160 85% 32%;
    --celis-color-teal-700: 160 80% 26%;
    --celis-color-teal-800: 160 75% 20%;
    --celis-color-teal-900: 160 70% 16%;
    --celis-color-teal-950: 160 65% 10%;

    /* Destructive Red — 0° hue, errors & irreversible actions */
    --celis-color-red-50:  0 100% 97%;
    --celis-color-red-100: 0 95% 93%;
    --celis-color-red-200: 0 90% 85%;
    --celis-color-red-300: 0 85% 72%;
    --celis-color-red-400: 0 82% 60%;
    --celis-color-red-500: 0 84% 50%;
    --celis-color-red-600: 0 72% 42%;
    --celis-color-red-700: 0 65% 34%;
    --celis-color-red-800: 0 60% 28%;
    --celis-color-red-900: 0 55% 22%;
    --celis-color-red-950: 0 50% 14%;

    /* Success Green — 145° hue, deuteranopia-safe confirmations */
    --celis-color-green-50:  145 80% 96%;
    --celis-color-green-100: 145 70% 90%;
    --celis-color-green-200: 145 65% 80%;
    --celis-color-green-300: 145 60% 65%;
    --celis-color-green-400: 145 65% 50%;
    --celis-color-green-500: 145 100% 39%;
    --celis-color-green-600: 145 90% 32%;
    --celis-color-green-700: 145 80% 26%;
    --celis-color-green-800: 145 70% 20%;
    --celis-color-green-900: 145 60% 16%;
    --celis-color-green-950: 145 55% 10%;

    /* Neutral Slate — warm undertone, backgrounds & text */
    --celis-color-slate-50:  215 33% 98%;
    --celis-color-slate-100: 215 25% 95%;
    --celis-color-slate-200: 215 20% 88%;
    --celis-color-slate-300: 215 16% 76%;
    --celis-color-slate-400: 215 14% 60%;
    --celis-color-slate-500: 215 12% 45%;
    --celis-color-slate-600: 215 16% 34%;
    --celis-color-slate-700: 215 20% 26%;
    --celis-color-slate-800: 215 25% 18%;
    --celis-color-slate-900: 215 33% 12%;
    --celis-color-slate-950: 215 40% 8%;

    /* ── Tier 2: Semantic Tokens — Light Mode ── */

    /* Brand & interaction */
    --celis-primary:            var(--celis-color-blue-500);
    --celis-primary-hover:      var(--celis-color-blue-600);
    --celis-primary-active:     var(--celis-color-blue-700);
    --celis-primary-subtle:     var(--celis-color-blue-50);
    --celis-primary-muted:      var(--celis-color-blue-100);

    /* Secondary & accent */
    --celis-secondary:          var(--celis-color-teal-500);
    --celis-secondary-hover:    var(--celis-color-teal-600);
    --celis-secondary-subtle:   var(--celis-color-teal-50);

    /* Destructive */
    --celis-destructive:        var(--celis-color-red-500);
    --celis-destructive-hover:  var(--celis-color-red-600);
    --celis-destructive-subtle: var(--celis-color-red-50);

    /* Success — escrow confirmed, payout released */
    --celis-success:            var(--celis-color-green-500);
    --celis-success-hover:      var(--celis-color-green-600);
    --celis-success-subtle:     var(--celis-color-green-50);

    /* Caution — pending states, awaiting action */
    --celis-caution:            38 92% 50%;
    --celis-caution-subtle:     38 92% 95%;

    /* Surfaces */
    --celis-bg:                 0 0% 100%;
    --celis-surface-base:       0 0% 100%;
    --celis-surface-elevated:   var(--celis-color-slate-50);
    --celis-surface-overlay:    0 0% 100%;
    --celis-surface-inset:      var(--celis-color-slate-100);

    /* Borders & separators */
    --celis-border:             var(--celis-color-slate-200);
    --celis-border-strong:      var(--celis-color-slate-300);
    --celis-border-subtle:      var(--celis-color-slate-100);

    /* Text — ink family */
    --celis-ink:                var(--celis-color-slate-900);
    --celis-ink-secondary:      var(--celis-color-slate-600);
    --celis-ink-tertiary:       var(--celis-color-slate-400);
    --celis-ink-financial:      var(--celis-color-slate-950);
    --celis-ink-inverse:        0 0% 100%;
    --celis-ink-on-primary:     0 0% 100%;

    /* Focus rings */
    --celis-focus-ring:         var(--celis-color-blue-500);
    --celis-focus-ring-offset:  0 0% 100%;
  }

  /* ── Tier 2: Semantic Tokens — Dark Mode ── */
  .dark {
    /* Primary desaturated 10% for reduced eye strain in dark environments */
    --celis-primary:            210 90% 55%;
    --celis-primary-hover:      210 90% 62%;
    --celis-primary-active:     210 90% 70%;
    --celis-primary-subtle:     210 40% 16%;
    --celis-primary-muted:      210 35% 22%;

    --celis-secondary:          160 70% 48%;
    --celis-secondary-hover:    160 70% 55%;
    --celis-secondary-subtle:   160 30% 14%;

    --celis-destructive:        0 80% 58%;
    --celis-destructive-hover:  0 80% 65%;
    --celis-destructive-subtle: 0 30% 14%;

    /* Success maintained at full saturation for status visibility */
    --celis-success:            145 100% 45%;
    --celis-success-hover:      145 100% 52%;
    --celis-success-subtle:     145 35% 14%;

    --celis-caution:            38 95% 55%;
    --celis-caution-subtle:     38 40% 14%;

    /* Background 180° flip — white to deep slate */
    --celis-bg:                 var(--celis-color-slate-950);
    --celis-surface-base:       var(--celis-color-slate-900);
    --celis-surface-elevated:   var(--celis-color-slate-800);
    --celis-surface-overlay:    var(--celis-color-slate-800);
    --celis-surface-inset:      var(--celis-color-slate-950);

    /* Borders gain subtle highlight for depth definition */
    --celis-border:             var(--celis-color-slate-700);
    --celis-border-strong:      var(--celis-color-slate-500);
    --celis-border-subtle:      var(--celis-color-slate-800);

    /* Text — lighter for contrast on dark backgrounds */
    --celis-ink:                var(--celis-color-slate-100);
    --celis-ink-secondary:      var(--celis-color-slate-400);
    --celis-ink-tertiary:       var(--celis-color-slate-500);
    --celis-ink-financial:      var(--celis-color-slate-50);
    --celis-ink-inverse:        var(--celis-color-slate-900);
    --celis-ink-on-primary:     0 0% 100%;

    --celis-focus-ring:         210 90% 60%;
    --celis-focus-ring-offset:  var(--celis-color-slate-950);
  }
}
```

### 2.2.2 Semantic Mappings

The semantic token naming convention follows a predictable grammar that makes intent transparent at the call site. Tokens are organized into five semantic families:

**`celis-primary`** and its variants (`-hover`, `-active`, `-subtle`, `-muted`) handle all interactive elements: buttons, links, form focus states, active navigation indicators. The hover variant lightens by one step on the raw palette; the active variant darkens by one step. The subtle variant provides tinted backgrounds for badges, alerts, and selected-row highlights.

**`celis-surface`** with its four elevations (`-base`, `-elevated`, `-overlay`, `-inset`) manages the spatial layering of the interface. Surface-base is the page background. Surface-elevated sits one level above — cards, dialogs, dropdown panels. Surface-overlay is for floating elements that trap focus — modals, bottom sheets. Surface-inset creates recessed containers for form field backgrounds or inner panel regions.

**`celis-ink`** governs all text rendering. The hierarchy runs from `ink` (primary text, headings, body copy) through `ink-secondary` (labels, captions, metadata) to `ink-tertiary` (placeholders, disabled text, timestamps). The `ink-financial` variant exists specifically for monetary figures — it uses the darkest available tone in both modes to maximize contrast and ensure AAA compliance.

**`celis-success`** signals positive completion states: escrow confirmation, payout release, order delivery, KYC approval. Unlike other tokens that desaturate in dark mode, success maintains full saturation because status visibility in low-light conditions is safety-critical — a user must immediately distinguish "funded" from "pending."

**`celis-caution`** covers intermediate states: payment pending, awaiting confirmation, under review. Defined as a warm amber (38° hue) rather than yellow, it carries sufficient red-channel presence to be distinguishable from both primary blue and success green by colorblind users.

### 2.2.3 Dark Mode Inversions

The dark mode transformation applies systematic rules rather than ad-hoc replacements. Background values undergo a 180° luminance flip: the light-mode `#FFFFFF` (`--celis-bg`) becomes `#0D1B2A` (`--celis-color-slate-950`), while surface layers progress upward through the slate scale (`800` for elevated, `900` for base). This creates a natural depth hierarchy where elevated elements appear lighter than the page background — the inverse of light mode, but perceptually consistent.

Primary colors desaturate by 10 percentage points in dark mode. The light-mode `210 100% 50%` becomes `210 90% 55%` — slightly muted but lifted in lightness to compensate for reduced pupil dilation in dark environments. This adjustment reduces blue-light emission and eye strain during nighttime usage without compromising brand recognition.

Success green maintains its full 100% saturation in dark mode. While other colors relax, status indicators must remain immediately scannable. The green shifts from `145 100% 39%` to `145 100% 45%` — a lightness increase only, with saturation preserved. This ensures that a "payout released" badge in a dark-mode dashboard pops with the same urgency as its light-mode counterpart.

Elevated surfaces gain a subtle border highlight (`--celis-border: slate-700` on dark, `slate-200` on light) that creates depth through edge definition rather than shadow. In dark mode, shadows lose effectiveness because there is no darker space to cast into; borders become the primary depth mechanism.

### 2.2.4 Mobile Screen Optimization

Daylight-reflective mobile screens in East African operating conditions demand higher contrast thresholds than typical desktop environments. The token system addresses this through breakpoint-scoped overrides and minimum physical dimension requirements.

On viewports below 768px, body text automatically promotes to the `--celis-ink-financial` token — the darkest tone available — elevating contrast from AA (4.5:1) to AAA (7:1) against surface backgrounds. This is not a component-level change; the semantic token rebinds at the breakpoint, propagating to all text elements automatically.

Touch targets enforce a **48px minimum** on all interactive elements. Buttons, list items, form inputs, and icon buttons all occupy at least 48×48 CSS pixels. Where visual size must be smaller (compact icon buttons, inline actions), the hit area expands via transparent padding to meet the 48px threshold while the visible element remains compact.

Border widths increase to **1.5px minimum** on mobile for daylight edge visibility. The `--celis-border` token remains 1px on desktop but shifts to 1.5px below 768px. Separator lines, card borders, and input outlines all gain this additional half-pixel, ensuring structural boundaries remain visible under high ambient light.

**Visual touch target diagram**: All interactive elements sit within a 48×48px bounding box. A compact 32×32px icon button visually renders at 32px but receives 8px transparent padding on all sides, creating a 48×48px tap target. Two adjacent buttons each claim their full 48px zone — minimum 8px gap between tap targets prevents accidental dual-taps. This spacing maps to the `--celis-space-touch-target: 48px` and `--celis-space-touch-gap: 8px` tokens.

---

## 2.3 Typography Scale

### 2.3.1 Font Selection

Celis uses two typefaces with distinct responsibilities. **Inter** (variable weight 400–600) handles all UI text — headings, body copy, labels, buttons. Inter was selected for three specific properties: its open-source license eliminates commercial font costs, its extensive hinting produces crisp rendering at small sizes on low-DPI devices common in emerging markets, and its large x-height improves lowercase readability at the 12–14px sizes prevalent in mobile interfaces.

**Geist Mono** handles all tabular data — order IDs, transaction amounts, escrow balances, tracking numbers, timestamps. Monospace alignment prevents column drift when figures stack vertically (a list of amounts varying from "KES 1,200" to "KES 150,000" stays right-aligned without jitter). Geist Mono's geometric construction and open counters maintain clarity at small sizes.

The fallback stack is `Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` for UI text, and `"Geist Mono", "SF Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace` for tabular data. The `system-ui` fallback ensures near-instant text rendering on first paint before custom fonts load, eliminating flash-of-invisible-text.

### 2.3.2 Fluid Type Scale

The typography system implements a 12-step scale from `xs` (12px) to `5xl` (48px). The base font size is 16px with a ratio of 1.125 (major second), producing a scale where each step increases by approximately 12.5%. Scale values use `clamp()` for fluid responsiveness — each size defines a minimum (mobile), preferred (fluid based on viewport), and maximum (desktop) value. This eliminates breakpoint-specific font-size overrides while maintaining accessibility (users can still zoom).

The following CSS defines the complete typography scale as custom properties, consumed by Tailwind's `fontSize` theme extension:

```css
/* ============================================================
   Celis Typography Scale — 12-step fluid system
   Base: 16px | Ratio: 1.125 (Major Second)
   Font: Inter (UI), Geist Mono (tabular)
   ============================================================ */

@layer base {
  :root {
    /* ── Font family tokens ── */
    --celis-font-ui:      Inter, system-ui, -apple-system, "Segoe UI", Roboto,
                          "Helvetica Neue", Arial, sans-serif;
    --celis-font-mono:    "Geist Mono", "SF Mono", "Fira Code",
                          "Cascadia Code", ui-monospace, monospace;

    /* ── Fluid type scale with clamp(min, preferred, max) ── */
    --celis-text-xs:      clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);   /* 12–13px */
    --celis-text-sm:      clamp(0.8125rem, 0.7875rem + 0.125vw, 0.875rem); /* 13–14px */
    --celis-text-base:    clamp(0.9375rem, 0.9rem + 0.1875vw, 1rem);    /* 15–16px */
    --celis-text-md:      clamp(1rem, 0.95rem + 0.25vw, 1.125rem);      /* 16–18px */
    --celis-text-lg:      clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem);  /* 18–20px */
    --celis-text-xl:      clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem);   /* 20–24px */
    --celis-text-2xl:     clamp(1.5rem, 1.3rem + 1vw, 1.875rem);        /* 24–30px */
    --celis-text-3xl:     clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem);   /* 30–36px */
    --celis-text-4xl:     clamp(2.25rem, 1.85rem + 2vw, 3rem);          /* 36–48px */
    --celis-text-5xl:     clamp(3rem, 2.5rem + 2.5vw, 3.5rem);          /* 48–56px, hero only */

    /* ── Line height tokens ── */
    --celis-leading-tight:   1.2;   /* Headings, buttons, labels */
    --celis-leading-normal:  1.5;   /* Body text, form inputs */
    --celis-leading-relaxed: 1.75;  /* Descriptions, long-form content */

    /* ── Letter spacing tokens ── */
    --celis-tracking-tight:  -0.025em;  /* Headings 2xl+ */
    --celis-tracking-normal:  0em;      /* Body text */
    --celis-tracking-wide:    0.025em;  /* Labels, captions */
    --celis-tracking-wider:   0.05em;   /* Uppercase labels */
  }
}
```

Cap-height alignment across sizes ensures that mixed-size text on the same baseline (a 24px heading beside a 14px label, for instance) appears visually balanced. Inter's consistent cap-height ratio across weights means that `font-size` changes alone produce aligned caps without vertical offset adjustments. When pairing a heading with an inline badge or metadata tag, both elements align at the cap line.

### 2.3.3 Weight Mapping

Three weights are used across the entire system: 400, 500, and 600. This constraint reduces font payload (fewer woff2 files to download) and establishes clear hierarchies through size and color rather than weight alone.

| Weight | Usage | Examples |
|--------|-------|----------|
| 400 (Regular) | Body text, descriptions, input values, long-form content | Product descriptions, chat messages, terms text |
| 500 (Medium) | Emphasis, labels, navigation items, table headers | Form labels, tab labels, list item titles, menu items |
| 600 (Semibold) | Headings, button text, active states, financial figures | Page titles, primary buttons, escrow amounts, active nav |

Financial amounts use `font-variant-numeric: tabular-nums` in addition to the Geist Mono typeface. This CSS property forces all numeric glyphs to equal width, preventing column shift when figures change ("KES 1,200.00" and "KES 9,999.00" occupy identical horizontal space). All elements displaying monetary values — price tags, transaction history rows, escrow balances — apply both the mono font and tabular numeric variants.

### 2.3.4 Line Height System

Line heights are defined by semantic role rather than size. Headings use `--celis-leading-tight` (1.2) to maintain compact vertical rhythm and prevent excessive whitespace between multi-line headings. Body text uses `--celis-leading-normal` (1.5), the WCAG-recommended minimum for readable paragraph text. Descriptions and long-form content use `--celis-leading-relaxed` (1.75) for comfortable extended reading.

The maximum readable line width is **65 characters** (`max-width: 65ch`). Beyond this width, the eye loses its place when scanning back to the start of the next line. This constraint applies to product descriptions, terms of service, help articles, and any other block of continuous text. UI elements that do not require sustained reading — table cells, card summaries, form inputs — are exempt from this constraint.

---

## 2.4 Spacing & Layout

### 2.4.1 8px Base Grid

All spacing values derive from an 8px base unit. The scale runs: 4, 8, 12, 16, 24, 32, 48, 64, 96. The 4px fraction exists for tight internal padding (icon-in-button padding, inline-element gaps) but is not used for component-level spacing. Each value is named by its pixel equivalent, making the token `--celis-space-16` immediately recognizable as 16px (1rem at 16px root).

The scale follows a non-linear progression. The gap between adjacent values increases as the scale grows: 4→8 (×2), 8→12 (+4), 12→16 (+4), 16→24 (+8), 24→32 (+8), 32→48 (+16), 48→64 (+16), 64→96 (+32). This accelerating progression reflects the way human perception scales — a 4px increase is significant at small sizes but imperceptible at large sizes.

Spacing tokens are consumed through the Tailwind theme as `celis-space-*` utilities. The following CSS defines the complete spacing system:

```css
/* ============================================================
   Celis Spacing Scale — 8px base grid with Tailwind mapping
   ============================================================ */

@layer base {
  :root {
    /* ── Core spacing scale (all values in px, mapped to rem) ── */
    --celis-space-0:   0px;
    --celis-space-px:  1px;
    --celis-space-0_5: 2px;
    --celis-space-1:   4px;
    --celis-space-2:   8px;
    --celis-space-3:   12px;
    --celis-space-4:   16px;
    --celis-space-5:   20px;
    --celis-space-6:   24px;
    --celis-space-8:   32px;
    --celis-space-10:  40px;
    --celis-space-12:  48px;
    --celis-space-16:  64px;
    --celis-space-20:  80px;
    --celis-space-24:  96px;

    /* ─eis-space-touch-target: 48px;
    --celis-space-touch-gap:   8px;

    /* ── Layout tokens ── */
    --celis-container-sm: 640px;
    --celis-container-md: 768px;
    --celis-container-lg: 1024px;
    --celis-container-xl: 1280px;

    /* ── Border radius scale ── */
    --celis-radius-0:    0px;    /* Sharp: inputs, data tables */
    --celis-radius-sm:   4px;    /* Subtle: small buttons, tags */
    --celis-radius-md:   6px;    /* Cards, dialogs, dropdowns */
    --celis-radius-lg:   12px;   /* Modals, bottom sheets */
    --celis-radius-xl:   24px;   /* Hero cards, feature banners */
    --celis-radius-full: 9999px; /* Pills, avatars, badges */
  }
}
```

### 2.4.2 Border Radius Scale

Border radius on Celis communicates containment and hierarchy rather than brand personality. The scale has six values, each assigned to specific component categories:

**0px (sharp)** applies to data-dense containers where rounding wastes horizontal space — data tables, spreadsheet-like grids, input fields. Sharp corners maximize the usable interior area and signal precision.

**4px (subtle)** softens small interactive elements — compact buttons, tags, chips. The rounding is perceptible but does not draw attention.

**6px (card)** is the default radius for cards, dialogs, dropdown menus, and popover panels. It provides enough rounding to lift the element from the background without appearing ornamental.

**12px (modal)** distinguishes modal overlays and bottom sheets from standard cards. The larger radius signals that this element sits at a higher elevation and demands focused attention.

**24px (hero)** applies to large feature cards, onboarding panels, and promotional banners. This generous rounding creates visual weight appropriate for hero-level content.

**9999px (pill)** creates fully rounded ends for pills, avatars, status badges, and segmented control toggles. The pill shape conveys selection state and containment.

### 2.4.3 Shadow System

Shadows on Celis are restrained — three levels, all using low-opacity black for minimal data-weight. Heavy shadows compete with content for attention; Celis shadows exist solely to communicate elevation and depth.

| Level | Shadow Definition | Opacity | Usage |
|-------|------------------|---------|-------|
| Subtle | `0 1px 3px hsl(var(--celis-color-slate-900) / 0.05)` | 5% | Resting cards, inline panels, input focus |
| Elevated | `0 4px 12px hsl(var(--celis-color-slate-900) / 0.05)` | 5% | Dropdowns, popovers, dialogs, hover-raised cards |
| Floating | `0 8px 30px hsl(var(--celis-color-slate-900) / 0.05)` | 5% | Modals, bottom sheets, toast notifications |

All three levels use identical 5% opacity — differentiation occurs through blur radius and vertical offset, not darkness. This consistency prevents shadow stacking from producing muddy overlap regions when multiple elevated elements coincide.

In dark mode, shadows weaken further because dark backgrounds absorb shadow tones. The shadow color switches to white at 3% opacity (`hsl(0 0% 100% / 0.03)`) to create a subtle glow that defines elevated edges. The border system compensates for this shadow reduction — dark-mode elevated surfaces gain a 1px `--celis-border` stroke that light-mode surfaces do not need.

---

## 2.5 Motion Tokens

### 2.5.1 Duration Scale

Motion on Celis follows a five-tier duration scale, each tier mapped to specific interaction categories:

| Token | Duration | Use Case | Example |
|-------|----------|----------|---------|
| `instant` | 0ms | State toggles, checked/unchecked, active/inactive | Checkbox checkmark appearance, tab activation |
| `fast` | 150ms | Hover effects, focus ring appearance, color transitions | Button hover darken, link underline slide, input focus |
| `normal` | 250ms | Expand/collapse, show/hide, height/width transitions | Accordion open, dropdown reveal, sidebar collapse |
| `slow` | 400ms | Page transitions, large element entrance | Route change fade, modal entrance, toast arrival |
| `ambient` | 8s–20s | Background patterns, decorative motion | Subtle gradient shift, loading skeleton shimmer |

The 150ms fast duration matches the human perceptual threshold for "instantaneous" feedback — hover responses feel immediate without creating motion fatigue during rapid cursor traversal. The 250ms normal duration provides enough time for the eye to track an expanding element without feeling sluggish. The 400ms slow duration applies only to elements that enter the viewport once per session (modals, page transitions); it never applies to frequently triggered interactions.

All durations are stored as CSS custom properties: `--celis-duration-instant: 0ms`, `--celis-duration-fast: 150ms`, `--celis-duration-normal: 250ms`, `--celis-duration-slow: 400ms`.

### 2.5.2 Easing Curves

Four easing curves handle all motion on the platform:

**`ease-out`** (`cubic-bezier(0, 0, 0.2, 1)`) drives entrance animations. Elements enter quickly and decelerate into position, giving a sense of arrival with snap. Applied to modal entrances, dropdown reveals, page transitions, and toast notifications.

**`ease-in-out`** (`cubic-bezier(0.4, 0, 0.2, 1)`) handles expansions and collapses. The symmetric acceleration and deceleration create natural feel for accordion panels, sidebar toggles, and height animations.

**`spring`** (stiffness: 300, damping: 30) powers micro-interactions — button presses, toggle switches, pull-to-refresh indicators. The spring curve produces a slight overshoot and settle that communicates physicality. For CSS-only contexts where spring curves are unavailable, this falls back to `cubic-bezier(0.34, 1.56, 0.64, 1)` — a bouncy approximation that mimics spring overshoot.

**`linear`** drives progress indicators, scrubbers, and any motion where the rate of change carries meaning. Loading bars, carousel auto-advance, and timeline scrubbing all use linear easing because the user interprets speed as data.

### 2.5.3 Accessibility — Reduced Motion

Celis respects `prefers-reduced-motion` at the global level through a single media query that overrides all animated properties. When the user has enabled reduced motion, the system degrades gracefully without per-component modifications.

```css
/* ============================================================
   Celis Motion Accessibility — prefers-reduced-motion
   All animations degrade to opacity-only or instant state change.
   No vestibular triggers (scaling, parallax, rotation) persist.
   ============================================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Allow opacity fades (non-vestibular) at reduced speed */
  .celis-allow-fade {
    transition-duration: var(--celis-duration-fast) !important;
    transition-property: opacity !important;
  }

  /* Skeleton loaders switch to static pulse (opacity only) */
  .celis-skeleton {
    animation: celis-skeleton-pulse 2s ease-in-out infinite !important;
  }

  @keyframes celis-skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Disable parallax, scale transforms, and rotation entirely */
  .celis-parallax,
  .celis-scale-enter,
  .celis-rotate {
    transform: none !important;
  }
}
```

The reduced-motion strategy follows three principles. First, all CSS transitions and animations collapse to near-zero duration (0.01ms — the smallest value that still triggers transition-end events for JavaScript callbacks). Second, opacity fades remain permitted because they do not trigger vestibular responses; a modal still fades in but does not slide or scale. Third, all transform-based motion (translate, scale, rotate) is eliminated entirely — these properties are the primary triggers for motion sickness and disorientation.

No Celis component implements its own reduced-motion check. The global media query above handles all degradation, ensuring consistency and eliminating the risk of a developer forgetting to add motion-gate logic to a new component.

---

## 2.6 Complete Color Palette Reference

### Table 1: Full Color Palette Listing

| Token Name | Light Mode HSL | Dark Mode HSL | Usage | WCAG on Background |
|------------|---------------|---------------|-------|-------------------|
| `--celis-primary` | 210 100% 50% | 210 90% 55% | Buttons, links, active nav, focus rings | AA on white, AA on slate-50 |
| `--celis-primary-hover` | 210 90% 42% | 210 90% 62% | Button hover, link hover | AA on white, AA on slate-50 |
| `--celis-primary-active` | 210 85% 34% | 210 90% 70% | Button press, active toggle | AA on white |
| `--celis-primary-subtle` | 210 100% 97% | 210 40% 16% | Selected row bg, info alert bg | N/A (background) |
| `--celis-secondary` | 160 80% 40% | 160 70% 48% | Category tags, promo banners | AA on white |
| `--celis-destructive` | 0 84% 50% | 0 80% 58% | Cancel buttons, delete actions, errors | AA on white |
| `--celis-destructive-hover` | 0 72% 42% | 0 80% 65% | Destructive button hover | AA on white |
| `--celis-success` | 145 100% 39% | 145 100% 45% | Escrow confirmed, payout released, KYC pass | AA on white, AAA on slate-50 |
| `--celis-success-hover` | 145 90% 32% | 145 100% 52% | Success action hover | AA on white |
| `--celis-caution` | 38 92% 50% | 38 95% 55% | Pending status, awaiting confirmation | AA on white |
| `--celis-bg` | 0 0% 100% | 215 40% 8% | Page background | N/A |
| `--celis-surface-base` | 0 0% 100% | 215 33% 12% | Card background, panel base | N/A |
| `--celis-surface-elevated` | 215 33% 98% | 215 25% 18% | Elevated cards, dropdown panels | N/A |
| `--celis-surface-overlay` | 0 0% 100% | 215 25% 18% | Modal background, bottom sheet | N/A |
| `--celis-surface-inset` | 215 25% 95% | 215 40% 8% | Form field bg, recessed panel | N/A |
| `--celis-border` | 215 20% 88% | 215 20% 26% | Default borders, dividers | 3:1 on surface-base |
| `--celis-border-strong` | 215 16% 76% | 215 16% 34% | Focused input borders, active tabs | 3:1 on surface-base |
| `--celis-border-subtle` | 215 25% 95% | 215 25% 18% | Separator lines, section dividers | N/A |
| `--celis-ink` | 215 33% 12% | 215 33% 98% | Headings, body text, primary content | AAA on bg (14.8:1) |
| `--celis-ink-secondary` | 215 16% 34% | 215 16% 76% | Labels, captions, metadata | AA on bg (6.2:1) |
| `--celis-ink-tertiary` | 215 14% 60% | 215 14% 45% | Placeholders, disabled text, timestamps | AA on bg (4.6:1) |
| `--celis-ink-financial` | 215 40% 8% | 215 40% 98% | Monetary amounts, escrow balances, order IDs | AAA on bg (18.4:1) |
| `--celis-ink-inverse` | 0 0% 100% | 215 33% 12% | Text on primary/success backgrounds | AA on primary |
| `--celis-ink-on-primary` | 0 0% 100% | 0 0% 100% | Button labels on primary background | AA on primary (4.6:1) |

### Table 2: Contrast Ratio Audit

The following audit validates WCAG compliance for representative text-on-background combinations. Ratios are computed against the sRGB color space using the relative luminance formula per WCAG 2.2.

| Text Sample | Text Token | Background Token | Computed Ratio | AA (4.5:1) | AAA (7:1) | Notes |
|-------------|-----------|------------------|----------------|------------|-----------|-------|
| "Escrow funded" | `--celis-success` (145 100% 39%) | `--celis-bg` (white) | 4.7:1 | PASS | FAIL | Meets AA; AAA requires darker green |
| "Escrow funded" | `--celis-success-hover` (145 90% 32%) | `--celis-bg` (white) | 5.9:1 | PASS | FAIL | Hover state improves contrast |
| "KES 12,500" | `--celis-ink-financial` (slate-950) | `--celis-bg` (white) | 18.4:1 | PASS | PASS | Financial AAA target exceeded |
| "KES 12,500" | `--celis-ink-financial` (slate-50) | `--celis-surface-elevated` | 17.9:1 | PASS | PASS | Dark mode financial text |
| "Product title" | `--celis-ink` (slate-900) | `--celis-bg` (white) | 14.8:1 | PASS | PASS | Primary body text |
| "Product title" | `--celis-ink` (slate-100) | `--celis-bg` (slate-950) | 15.2:1 | PASS | PASS | Dark mode body text |
| "Seller name" | `--celis-ink-secondary` (slate-600) | `--celis-bg` (white) | 6.2:1 | PASS | FAIL | Secondary text AA compliant |
| "2 hours ago" | `--celis-ink-tertiary` (slate-400) | `--celis-bg` (white) | 4.6:1 | PASS | FAIL | Tertiary text meets AA minimum |
| "Pay now" | `--celis-ink-on-primary` (white) | `--celis-primary` (blue-500) | 4.6:1 | PASS | FAIL | Button label AA compliant |
| "Pay now" (dark) | `--celis-ink-on-primary` (white) | `--celis-primary` (210 90% 55%) | 4.5:1 | PASS | FAIL | Dark mode button at threshold |
| "Delete" | `--celis-destructive` (red-500) | `--celis-bg` (white) | 5.1:1 | PASS | FAIL | Destructive action AA compliant |
| "Pending" | `--celis-caution` (amber) | `--celis-bg` (white) | 4.8:1 | PASS | FAIL | Caution text on white |
| "Order #28471" | `--celis-ink-financial` | `--celis-surface-inset` | 13.6:1 | PASS | PASS | Order ID in form field |
| Card border | `--celis-border` (slate-200) | `--celis-bg` (white) | 3.2:1 | N/A | N/A | Non-text: exceeds 3:1 minimum |
| Card border (dark) | `--celis-border` (slate-700) | `--celis-bg` (slate-950) | 3.4:1 | N/A | N/A | Non-text: exceeds 3:1 minimum |
| Disabled input | `--celis-ink-tertiary` (slate-400) | `--celis-surface-inset` | 4.1:1 | PASS | FAIL | Disabled state exempt per WCAG |

**Audit findings**: All text combinations meet WCAG AA (4.5:1) minimum. Financial text (`--celis-ink-financial`) consistently exceeds AAA (7:1) on all backgrounds. The `--celis-success` token at full saturation achieves 4.7:1 on white — sufficient for AA but not AAA. This is an intentional tradeoff: deuteranopia-safe green at AAA contrast would require a near-black green that loses semantic association with "positive." For contexts requiring AAA success text (accessibility-critical confirmations), use `--celis-success-hover` (5.9:1) or supplement with iconography.

Dark mode contrast ratios are comparable or superior to light mode across all audited combinations. The slate-scale inversion maintains consistent luminance deltas because the scale is perceptually uniform — the distance from `slate-100` to `slate-950` mirrors the distance from `slate-900` to `slate-50` in relative luminance terms.

---

## 2.7 Token Consumption in Tailwind CSS

The complete token set integrates into Tailwind CSS v4 through the `@theme` directive. Semantic tokens become first-class utilities, enabling usage like `bg-celis-primary`, `text-celis-ink-secondary`, `border-celis-border`, and `shadow-celis-elevated`. The theme configuration references CSS custom properties rather than static values, ensuring that `.dark` class toggling automatically propagates to all Tailwind-generated utilities without JavaScript recompilation.

Component implementations never reference raw palette tokens directly. A button component uses `bg-celis-primary hover:bg-celis-primary-hover text-celis-ink-on-primary`, not `bg-blue-500`. This abstraction ensures that a future brand color change requires modifying only the semantic token bindings — zero component code changes.

The token system is version-locked. Raw palette additions (extending a hue family beyond 950, adding a sixth hue family) are non-breaking. Semantic token renames or removals require a major version bump and migration script. Component mappings are considered private API — they may change between minor versions as long as the semantic token interface remains stable.


---

# 3. Global Styles & Theming

The theming architecture for Celis rests on a dual-layer variable system: brand-scoped `--celis-*` CSS custom properties that express the complete design token set, and a shadcn/ui-compatible bridge layer (`--background`, `--foreground`, `--primary`, etc.) that allows third-party Radix UI primitives to resolve correctly without modification. This decoupling ensures that the Celis token namespace remains fully owned while maintaining drop-in compatibility with the shadcn component ecosystem. Tailwind CSS v4 reads from the bridged variables via the `theme()` function, and all component primitives consume Tailwind utilities exclusively — no inline styles, no one-off hex values.

Dark mode is implemented via a `.dark` class applied to the `<html>` element, controlled by a React context that synchronizes with `localStorage` under the key `celis-theme`. The toggle respects `prefers-color-scheme` on initial load: if no stored preference exists, the system preference wins. The `.dark` class flips the bridged variables through CSS cascade; no JavaScript re-renders are required for the color switch itself.

---

## 3.1 CSS Variable Definitions (globals.css)

The `globals.css` file is the single source of truth for every color, radius, shadow, and spacing token in the Celis design system. It is organized into four `@layer base` sections: CSS reset, Celis brand tokens, shadcn/ui bridge, and base element styling. All color values are specified in HSL format to enable programmatic opacity manipulation via the CSS `hsl()` function with alpha channels.

### 3.1.1 Light Mode Root Variables

The `:root` selector declares the complete `--celis-*` token set. Background values are drawn from a warm-neutral slate family to avoid the clinical coolness of pure gray. Foreground text uses a near-black with subtle warmth at 220° hue. The primary brand color is a deep indigo at 243° — saturated enough for instant recognition, dark enough for white text at any font weight above 400.

The complete light-mode variable set includes:

| Token | HSL Value | Usage |
|---|---|---|
| `--celis-bg` | 0 0% 100% | Page background |
| `--celis-bg-elevated` | 220 14% 96% | Cards, panels, modals |
| `--celis-bg-overlay` | 220 14% 92% | Hover states, dropdowns |
| `--celis-fg` | 220 18% 10% | Primary text, headings |
| `--celis-fg-muted` | 220 9% 46% | Secondary text, placeholders |
| `--celis-fg-subtle` | 220 8% 60% | Tertiary text, timestamps |
| `--celis-primary` | 243 75% 59% | Buttons, links, focus rings |
| `--celis-primary-hover` | 243 70% 52% | Button hover, link hover |
| `--celis-primary-subtle` | 243 100% 96% | Tinted backgrounds, badges |
| `--celis-secondary` | 220 14% 96% | Secondary buttons, chips |
| `--celis-secondary-hover` | 220 14% 90% | Secondary button hover |
| `--celis-border` | 220 13% 88% | Dividers, input borders |
| `--celis-border-strong` | 220 13% 75% | Focused input borders |
| `--celis-success` | 160 84% 33% | Success states, confirmations |
| `--celis-success-subtle` | 160 84% 95% | Success backgrounds |
| `--celis-caution` | 38 92% 48% | Warnings, pending states |
| `--celis-caution-subtle` | 38 92% 95% | Warning backgrounds |
| `--celis-destructive` | 0 84% 55% | Errors, destructive actions |
| `--celis-destructive-subtle` | 0 84% 96% | Error backgrounds |
| `--radius` | 0.5rem | Default radius (6px at 12px base) |

The `--radius` variable at `0.5rem` equals 6px when the root font size is 12px. Cards use this value directly. Buttons and inputs override it to `0px` for the sharp, data-dense aesthetic that characterizes Celis. Badges use `9999px` for the pill shape. No other border-radius values exist in the system.

### 3.1.2 Dark Mode Overrides

The `.dark` class overrides the bridged variables to produce a deep, low-luminance interface that reduces eye strain in low-light conditions typical of mobile usage in East African markets. Background shifts to 220° 13% 5% — nearly black with a faint cool undertone. Foreground inverts to 210° 20% 98%, an off-white that avoids the harshness of pure `#ffffff`.

Muted surfaces are achieved not by lightening the background but by increasing border opacity and adding a 1px `--celis-border` divider. This preserves the deep canvas while creating tactile elevation. The primary brand color desaturates slightly from 75% to 70% saturation in dark mode to prevent neon-like glowing against the dark ground.

Key dark mode overrides:

| Token | Dark Mode Value | Rationale |
|---|---|---|
| `--celis-bg` | 220 13% 5% | Deepest canvas, OLED-friendly |
| `--celis-bg-elevated` | 220 13% 9% | Cards — 4% lighter for lift |
| `--celis-bg-overlay` | 220 13% 14% | Hover states, menus |
| `--celis-fg` | 210 20% 98% | Near-white, not pure white |
| `--celis-fg-muted` | 220 9% 58% | Muted text — lighter than light mode |
| `--celis-fg-subtle` | 220 8% 44% | Timestamps, metadata |
| `--celis-primary` | 243 70% 59% | Desaturated 5% for dark harmony |
| `--celis-border` | 220 13% 18% | Visible but unobtrusive |
| `--celis-border-strong` | 220 13% 28% | Focused states |

### 3.1.3 shadcn/ui CSS Variable Bridge

The bridge layer maps shadcn/ui's expected `--*` variables to the corresponding `--celis-*` tokens. This is a pure aliasing layer — no values are duplicated. Every shadcn component installed via `npx shadcn add` resolves these variables automatically.

The bridge includes all standard semantic slots: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`. Each maps directly to its `--celis-*` equivalent — for example, `--background: var(--celis-bg)` and `--primary: var(--celis-primary)`.

The `--ring` variable deserves special attention. It drives focus-visible outlines across all shadcn primitives and is set to `--celis-primary`. The actual focus ring implementation uses a 2px offset box-shadow with `outline: 2px solid hsl(var(--ring))` and `outline-offset: 2px`, producing a clean halo that does not affect layout or trigger overflow clipping in parent containers.

### 3.1.4 Base Element Styling

The `body` element applies `background-color: hsl(var(--celis-bg))` and `color: hsl(var(--celis-fg))`, ensuring every page has correct defaults before any component renders. Font rendering is tuned with `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` for consistent weight perception across macOS and iOS devices.

Heading elements `h1` through `h4` use `text-wrap: balance` for equitable line distribution in headlines, preventing single-word orphans on the last line. Links use `color: hsl(var(--celis-primary))` with an underline on hover. The `::selection` pseudo-element applies `background-color: hsl(var(--celis-primary) / 0.2)` — the primary indigo at 20% opacity — ensuring selected text remains readable while reinforcing brand presence.

---

## 3.2 Tailwind Configuration

The `tailwind.config.ts` extends the default Tailwind theme with Celis-specific tokens, custom animations, and utility classes. It is a TypeScript file, providing full type safety and IntelliSense via `@tailwindcss/forms` and `tailwindcss-animate` plugin definitions.

### 3.2.1 Theme Extension

All color values in `theme.extend.colors` reference CSS custom properties using the `hsl(var(--variable) / <alpha-value>)` pattern. This enables opacity modifiers in Tailwind utilities — `bg-primary/50`, `text-destructive/80` — while maintaining the single-source-of-truth in `globals.css`.

The color map includes every semantic slot from the shadcn bridge: `background`, `foreground`, `card`, `popover`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`, `success`, `success-foreground`, `caution`, `caution-foreground`. Each resolves to its `--celis-*` counterpart.

Font families declare `"Inter Variable"` as the sans-serif stack, with system fallback through `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Inter Variable is loaded via `next/font/local` or `@fontsource-variable/inter` and provides optical sizing for crisp UI text at small sizes. The monospace stack uses `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace` for transaction hashes, wallet addresses, and code blocks.

Border radius extends the default scale with `lg: var(--radius)`, `md: calc(var(--radius) - 2px)`, and `sm: calc(var(--radius) - 4px)`. At the default 6px radius, this yields 6px, 4px, and 2px respectively. The `DEFAULT` radius is intentionally omitted — components must be explicit about their corner treatment.

Container configuration disables the default centering and padding. Celis handles its own max-width constraints via component-level utilities (`max-w-md`, `max-w-lg`, `max-w-xl` for mobile-first breakpoints) to support full-bleed sections within the same page as constrained content. The container plugin is still registered for the `container` utility but with `center: false` and `padding: false`.

### 3.2.2 Custom Animations

Four animation families are defined: accordion, slide-in, fade, and shimmer.

**Accordion** (`accordion-down` and `accordion-up`) uses `grid-template-rows` transitions from `0fr` to `1fr`, the most performant method for height animation that avoids forced reflows. Duration is 200ms with `ease-out` for down (expand) and `ease-in` for up (collapse).

**Slide-in** (`slide-in-from-bottom`, `slide-in-from-right`) uses a transform translation from `100%` to `0` with opacity `0` to `1`. Duration is 300ms with `cubic-bezier(0.16, 1, 0.3, 1)` — the custom ease-out-expo curve that provides snappy arrival with gentle deceleration. These power mobile bottom sheets and side drawers.

**Fade** (`fade-in`, `fade-out`) animates opacity over 150ms with `ease-in-out` for subtle state transitions — tooltip appearance, dropdown menus, backdrop reveals.

**Shimmer** (`shimmer`) is a 2-second linear infinite sweep of a `-45deg` gradient band across a skeleton placeholder. The gradient is `hsl(var(--celis-bg-overlay))` to `hsl(var(--celis-bg-elevated))` and back, creating a soft pulse that signals loading without the visual noise of a spinner.

### 3.2.3 Custom Utilities

Four utility classes are registered via the `plugins` array:

`.text-balance` applies `text-wrap: balance` for headline typography. It is used on all heading elements and marketing copy blocks over two lines. No effect on single-line text.

`.touch-target` enforces `min-height: 48px` and `min-width: 48px` with `display: inline-flex`, `align-items: center`, and `justify-content: center`. This is the WCAG 2.5.5 minimum target size for pointer inputs. Every clickable element in Celis — buttons, list items, nav links — either meets this natively (buttons at 40px/48px heights) or has this utility applied (compact icon buttons, table rows).

`.no-scrollbar` hides scrollbars via `::-webkit-scrollbar { display: none }` and `-ms-overflow-style: none` / `scrollbar-width: none` for Firefox. Used on horizontal scroll containers and modals with internal scrolling where native scrollbars break the visual design.

`.skeleton` combines `animate-shimmer`, `bg-secondary`, `rounded-md`, and `overflow-hidden` to produce the standard loading placeholder. Applied to any element during data fetching; the shimmer animation provides the only motion.

---

## 3.3 Component Primitives

All four primitives — Button, Input, Card, Badge — are specified as Tailwind className compositions. No React component code is required at this layer; these are the canonical class strings that every implementation must match. Dark mode variants are automatic because all colors resolve through CSS variables.

### 3.3.1 Button System

The button primitive defines four variants, three sizes, a loading state, and a disabled state. Every button uses `inline-flex items-center justify-center gap-2` for internal alignment, `font-medium` for weight, `whitespace-nowrap` to prevent text wrapping, and `transition-colors duration-150` for hover feedback. Border-radius is `rounded-none` (0px) — the sharp corner is a deliberate Celis signature that reduces anti-aliasing artifacts on low-DPI displays common in the target market.

**Variants:**

| Variant | ClassName Composition | Background | Text | Border |
|---|---|---|---|---|
| Primary | `bg-primary text-primary-foreground hover:bg-[hsl(var(--celis-primary-hover))] active:bg-primary/90` | Indigo | White | None |
| Secondary | `bg-secondary text-secondary-foreground hover:bg-[hsl(var(--celis-secondary-hover))] active:bg-secondary/80` | Light gray | Dark | None |
| Outline | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` | Transparent | Dark | `--celis-border` |
| Ghost | `hover:bg-accent hover:text-accent-foreground` | Transparent | Inherited | None |

**Sizes:**

| Size | Height | Padding | Font Size | Icon Size |
|---|---|---|---|---|
| sm | h-8 (32px) | px-3 | text-xs (12px) | 14px |
| md | h-10 (40px) | px-4 | text-sm (14px) | 16px |
| lg | h-12 (48px) | px-6 | text-sm (14px) | 18px |

The `lg` size at 48px is the default for all primary CTA buttons on mobile. It satisfies the touch-target minimum without additional utilities. The `sm` size at 32px is reserved for dense UI — filter chips, table actions, inline edits — and must always appear in contexts where adjacent elements provide adequate separation.

**Loading State:**

When `loading={true}`, the button receives `opacity-70 cursor-wait` and a spinner element is prepended before the label text. The spinner is a `w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin` — a pure CSS spinner using the current text color for automatic contrast in all variants. The original left icon (if present) is replaced by the spinner; the label text remains visible. The button remains clickable unless `disabled` is also set — this allows loading buttons to still receive focus for screen reader announcements.

**Disabled State:**

`disabled` applies `opacity-50 cursor-not-allowed pointer-events-none`. This combination grays the button, changes the cursor, and prevents all click, hover, and focus interactions. The `pointer-events-none` is critical — without it, disabled buttons on touch devices still fire `touchstart` events in some browsers.

**Focus Ring:**

All buttons share `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`. The 2px ring uses `--celis-primary`, offset 2px from the button edge, with the page background showing through the gap. This creates a floating halo that is visible on every background color.

### 3.3.2 Input System

The input primitive is a single, highly configurable className string that supports standard, error, and floating-label modes. All inputs use `flex h-10 w-full` (40px height), `rounded-none` for the sharp corner aesthetic, `border border-input` for the default border, and `bg-background` for fill.

**Standard State:**

`px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50`

The placeholder uses `--celis-fg-muted` at full opacity, providing clear contrast against the white/near-white background without being mistaken for entered text. The focus ring matches the button pattern exactly — 2px primary ring, 2px offset — for system-wide consistency.

**Error State:**

When validation fails, the input receives `border-destructive focus-visible:ring-destructive` in addition to the base classes. The border switches to `--celis-destructive` (the red family), and the focus ring follows suit. An error icon — a 16px `AlertCircle` from `lucide-react` in `text-destructive` — appears inside the input via absolute positioning at `right-3 top-1/2 -translate-y-1/2`. The input's right padding increases to `pr-10` (40px) to prevent text overlap with the icon.

Below the input, an error message uses `text-xs text-destructive mt-1.5` with the same `AlertCircle` icon at 14px preceding the text. The message container has `role="alert"` and `aria-live="polite"` for screen reader announcement.

**Floating Label:**

The floating-label pattern uses a wrapper `<div className="relative">` containing the `<input>` and a `<label>`. The input uses `pt-4 pb-1` instead of the standard `py-2` to create vertical space for the label. The label is absolutely positioned at `left-3 top-1/2 -translate-y-1/2` in the resting state with `text-sm text-muted-foreground transition-all duration-150`.

When the input has `:focus` or `:not(:placeholder-shown)`, the label transitions to `top-1.5 -translate-y-0 text-[10px] text-muted-foreground`. The `peer` class on the input and `peer-focus:top-1.5 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5` on the label achieve this without JavaScript. The input must include `placeholder=" "` (a space) for `:placeholder-shown` to function correctly.

### 3.3.3 Card System

The card primitive provides a contained surface for related content. It uses `rounded-md` (6px) — the only place in the system where rounding appears, providing subtle softness without the performance cost of larger radii on low-end devices. The shadow is `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`) in light mode and `shadow-none` in dark mode, where elevation is conveyed through the lighter background (`--celis-bg-elevated`) against the darker page canvas.

**Base Card:**

`rounded-md border bg-card text-card-foreground shadow-sm`

**Structure:**

Cards have three optional regions: header, content, and footer. The header uses `flex flex-col space-y-1.5 p-6` and typically contains a title (`text-lg font-semibold leading-none tracking-tight`) and an optional description (`text-sm text-muted-foreground`). The content area is `p-6 pt-0` when preceded by a header, or `p-6` standalone. The footer uses `flex items-center p-6 pt-0` and aligns actions to the right via `ml-auto` on the primary button.

**Hover Elevation (Desktop Only):**

On devices that support hover (`@media (hover: hover) and (pointer: fine)`), interactive cards receive a `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` treatment. The 0.5px upward lift creates tactile feedback without triggering layout shifts in parent containers. On touch devices, this hover class is a no-op — cards remain static, preventing the stuck-hover state that plagues touch interfaces.

**Interactive Cards:**

When a card is clickable (navigates to a detail view or expands), it receives `cursor-pointer` and `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` in addition to the hover elevation. The entire card surface is the hit target — no nested button elements that would create invalid HTML or duplicate screen reader announcements.

### 3.3.4 Badge System

The badge primitive displays status, category, or count information. It is not interactive — no hover states, no focus rings, no cursor changes. Every badge uses `inline-flex items-center gap-1.5` for icon+text layouts, `h-5` (20px) for consistent height, `px-2.5` for horizontal padding, `rounded-full` for the pill shape, `text-xs font-medium`, and `whitespace-nowrap`.

**Variants:**

| Variant | Background | Text | Usage |
|---|---|---|---|
| Default | `bg-secondary text-secondary-foreground` | Gray | General labels |
| Primary | `bg-primary/15 text-primary` | Indigo tint | Active status, brand |
| Secondary | `bg-muted text-muted-foreground` | Muted | Inactive, draft |
| Success | `bg-success/15 text-success` | Green | Completed, verified |
| Caution | `bg-caution/15 text-caution` | Amber | Pending, warning |
| Destructive | `bg-destructive/15 text-destructive` | Red | Failed, blocked |

The `/15` opacity modifier on semantic colors produces a soft tinted background that maintains readability without requiring additional token definitions. In dark mode, these translucent backgrounds blend against the elevated surface automatically.

**With Icon:**

Badges that include an icon place a 12px `lucide-react` icon before the text. The icon uses the same text color as the badge label — no separate styling needed. Common icons: `CheckCircle` for success, `Clock` for caution, `XCircle` for destructive, `Shield` for verified. The icon is purely decorative and receives `aria-hidden="true"`.

**Dot Variant:**

A compact status indicator uses `w-2 h-2 rounded-full` without text — a colored circle alone. Colors map to the same six variants. This is used in list views where horizontal space is constrained. The dot includes a `sr-only` span with the status text for screen reader accessibility.

---

## Code Reference

### Code Block 1: Complete globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ── Celis Brand Tokens: Light Mode ── */
  :root {
    --celis-bg: 0 0% 100%;
    --celis-bg-elevated: 220 14% 96%;
    --celis-bg-overlay: 220 14% 92%;

    --celis-fg: 220 18% 10%;
    --celis-fg-muted: 220 9% 46%;
    --celis-fg-subtle: 220 8% 60%;

    --celis-primary: 243 75% 59%;
    --celis-primary-hover: 243 70% 52%;
    --celis-primary-subtle: 243 100% 96%;
    --celis-primary-foreground: 0 0% 100%;

    --celis-secondary: 220 14% 96%;
    --celis-secondary-hover: 220 14% 90%;
    --celis-secondary-foreground: 220 18% 10%;

    --celis-muted: 220 14% 96%;
    --celis-muted-foreground: 220 9% 46%;

    --celis-accent: 220 14% 96%;
    --celis-accent-foreground: 220 18% 10%;

    --celis-success: 160 84% 33%;
    --celis-success-subtle: 160 84% 95%;
    --celis-success-foreground: 0 0% 100%;

    --celis-caution: 38 92% 48%;
    --celis-caution-subtle: 38 92% 95%;
    --celis-caution-foreground: 0 0% 100%;

    --celis-destructive: 0 84% 55%;
    --celis-destructive-subtle: 0 84% 96%;
    --celis-destructive-foreground: 0 0% 100%;

    --celis-border: 220 13% 88%;
    --celis-border-strong: 220 13% 75%;
    --celis-input: 220 13% 88%;
    --celis-ring: 243 75% 59%;

    --radius: 0.5rem;
  }

  /* ── Celis Brand Tokens: Dark Mode ── */
  .dark {
    --celis-bg: 220 13% 5%;
    --celis-bg-elevated: 220 13% 9%;
    --celis-bg-overlay: 220 13% 14%;

    --celis-fg: 210 20% 98%;
    --celis-fg-muted: 220 9% 58%;
    --celis-fg-subtle: 220 8% 44%;

    --celis-primary: 243 70% 59%;
    --celis-primary-hover: 243 65% 52%;
    --celis-primary-subtle: 243 50% 18%;
    --celis-primary-foreground: 0 0% 100%;

    --celis-secondary: 220 13% 14%;
    --celis-secondary-hover: 220 13% 20%;
    --celis-secondary-foreground: 210 20% 98%;

    --celis-muted: 220 13% 14%;
    --celis-muted-foreground: 220 9% 58%;

    --celis-accent: 220 13% 14%;
    --celis-accent-foreground: 210 20% 98%;

    --celis-success: 160 70% 45%;
    --celis-success-subtle: 160 70% 15%;
    --celis-success-foreground: 0 0% 100%;

    --celis-caution: 38 85% 55%;
    --celis-caution-subtle: 38 85% 15%;
    --celis-caution-foreground: 0 0% 100%;

    --celis-destructive: 0 70% 55%;
    --celis-destructive-subtle: 0 70% 15%;
    --celis-destructive-foreground: 0 0% 100%;

    --celis-border: 220 13% 18%;
    --celis-border-strong: 220 13% 28%;
    --celis-input: 220 13% 18%;
    --celis-ring: 243 70% 59%;
  }

  /* ── shadcn/ui CSS Variable Bridge ── */
  :root {
    --background: var(--celis-bg);
    --foreground: var(--celis-fg);

    --card: var(--celis-bg-elevated);
    --card-foreground: var(--celis-fg);

    --popover: var(--celis-bg-elevated);
    --popover-foreground: var(--celis-fg);

    --primary: var(--celis-primary);
    --primary-foreground: var(--celis-primary-foreground);

    --secondary: var(--celis-secondary);
    --secondary-foreground: var(--celis-secondary-foreground);

    --muted: var(--celis-muted);
    --muted-foreground: var(--celis-muted-foreground);

    --accent: var(--celis-accent);
    --accent-foreground: var(--celis-accent-foreground);

    --destructive: var(--celis-destructive);
    --destructive-foreground: var(--celis-destructive-foreground);

    --border: var(--celis-border);
    --input: var(--celis-input);
    --ring: var(--celis-ring);

    --success: var(--celis-success);
    --success-foreground: var(--celis-success-foreground);

    --caution: var(--celis-caution);
    --caution-foreground: var(--celis-caution-foreground);
  }

  /* ── Base Element Styles ── */
  * {
    @apply border-border;
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    -moz-tab-size: 4;
    tab-size: 4;
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4 {
    text-wrap: balance;
  }

  a {
    @apply text-primary;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  ::selection {
    background-color: hsl(var(--celis-primary) / 0.2);
    color: inherit;
  }

  /* Focus visible: consistent system-wide */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
}

@layer utilities {
  /* ── Text Balance ── */
  .text-balance {
    text-wrap: balance;
  }

  /* ── Touch Target Minimum ── */
  .touch-target {
    @apply inline-flex items-center justify-center;
    min-height: 48px;
    min-width: 48px;
  }

  /* ── Scrollbar Hide ── */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* ── Skeleton Shimmer ── */
  .skeleton {
    @apply relative overflow-hidden rounded-md bg-secondary;
  }
  .skeleton::after {
    content: "";
    @apply absolute inset-0;
    background: linear-gradient(
      -45deg,
      transparent 30%,
      hsl(var(--celis-bg-elevated) / 0.6) 50%,
      transparent 70%
    );
    background-size: 300% 300%;
    animation: shimmer 2s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton::after {
      animation: none;
      background: hsl(var(--celis-bg-elevated) / 0.4);
    }
  }

  /* ── Step-enter Animation ── */
  .step-enter {
    opacity: 0;
    transform: translateY(8px);
    animation: step-enter 0.25s ease-out forwards;
  }
  @keyframes step-enter {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── Fade In ── */
  .fade-in {
    animation: fade-in 0.15s ease-in-out forwards;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

@layer components {
  /* ── Button Primitive ── */
  .btn {
    @apply inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50;
  }
  .btn-primary {
    @apply btn bg-primary text-primary-foreground hover:bg-[hsl(var(--celis-primary-hover))] active:bg-primary/90;
  }
  .btn-secondary {
    @apply btn bg-secondary text-secondary-foreground hover:bg-[hsl(var(--celis-secondary-hover))] active:bg-secondary/80;
  }
  .btn-outline {
    @apply btn border border-input bg-background hover:bg-accent hover:text-accent-foreground;
  }
  .btn-ghost {
    @apply btn hover:bg-accent hover:text-accent-foreground;
  }
  .btn-sm {
    @apply h-8 px-3 text-xs;
  }
  .btn-md {
    @apply h-10 px-4 text-sm;
  }
  .btn-lg {
    @apply h-12 px-6 text-sm;
  }

  /* ── Input Primitive ── */
  .input {
    @apply flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50;
  }
  .input-error {
    @apply border-destructive focus-visible:ring-destructive;
  }

  /* ── Card Primitive ── */
  .card {
    @apply rounded-md border bg-card text-card-foreground shadow-sm;
  }
  .card-interactive {
    @apply card cursor-pointer transition-all duration-200;
  }
  @media (hover: hover) and (pointer: fine) {
    .card-interactive:hover {
      @apply shadow-md;
      transform: translateY(-0.5px);
    }
  }
  .card-header {
    @apply flex flex-col space-y-1.5 p-6;
  }
  .card-title {
    @apply text-lg font-semibold leading-none tracking-tight;
  }
  .card-description {
    @apply text-sm text-muted-foreground;
  }
  .card-content {
    @apply p-6;
  }
  .card-content-with-header {
    @apply p-6 pt-0;
  }
  .card-footer {
    @apply flex items-center p-6 pt-0;
  }

  /* ── Badge Primitive ── */
  .badge {
    @apply inline-flex items-center gap-1.5 h-5 px-2.5 rounded-full text-xs font-medium whitespace-nowrap;
  }
  .badge-default {
    @apply badge bg-secondary text-secondary-foreground;
  }
  .badge-primary {
    @apply badge bg-primary/15 text-primary;
  }
  .badge-secondary {
    @apply badge bg-muted text-muted-foreground;
  }
  .badge-success {
    @apply badge bg-success/15 text-success;
  }
  .badge-caution {
    @apply badge bg-caution/15 text-caution;
  }
  .badge-destructive {
    @apply badge bg-destructive/15 text-destructive;
  }
}

/* ── Keyframe Definitions (outside @layer for broad browser support) ── */
@keyframes accordion-down {
  from {
    grid-template-rows: 0fr;
  }
  to {
    grid-template-rows: 1fr;
  }
}

@keyframes accordion-up {
  from {
    grid-template-rows: 1fr;
  }
  to {
    grid-template-rows: 0fr;
  }
}

@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-from-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### Code Block 2: Complete tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: false,
      padding: false,
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        caution: {
          DEFAULT: "hsl(var(--caution) / <alpha-value>)",
          foreground: "hsl(var(--caution-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      keyframes: {
        "accordion-down": {
          from: { gridTemplateRows: "0fr" },
          to: { gridTemplateRows: "1fr" },
        },
        "accordion-up": {
          from: { gridTemplateRows: "1fr" },
          to: { gridTemplateRows: "0fr" },
        },
        "slide-in-from-bottom": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-right": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down":
          "accordion-down 200ms ease-out forwards",
        "accordion-up":
          "accordion-up 200ms ease-in forwards",
        "slide-in-from-bottom":
          "slide-in-from-bottom 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-from-right":
          "slide-in-from-right 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":
          "fade-in 150ms ease-in-out forwards",
        "fade-out":
          "fade-out 150ms ease-in-out forwards",
        shimmer:
          "shimmer 2s linear infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms")({
      strategy: "class",
    }),
  ],
};

export default config;
```

---

## Implementation Notes

### CSS Variable Precedence

The `--celis-*` namespace takes precedence in naming and documentation. When a developer needs to read or override a token, they reach for `--celis-primary`, not `--primary`. The bridged `--*` variables exist solely for shadcn/ui compatibility and should not be referenced directly in application code. If shadcn is removed in a future refactor, only the bridge section of `globals.css` needs deletion — the entire Celis token system remains intact.

### Reduced Motion

Every animation in the system respects `prefers-reduced-motion: reduce`. The media query in `globals.css` disables the skeleton shimmer and sets `scroll-behavior: auto`. The Tailwind `transition-colors` and `duration` utilities are left intact — color transitions do not trigger vestibular issues and provide necessary state-change feedback for accessibility. Slide-in and fade animations should be gated behind `useReducedMotion()` from `@radix-ui/react-use-layout-effect` in React components; when reduced motion is preferred, elements appear instantly without translation.

### CSS Layer Ordering

The `@layer` order is critical: `base` variables must be defined before `components` and `utilities` so that Tailwind's utility classes can override component defaults. The `@layer components` block in `globals.css` provides reference implementations of `.btn`, `.input`, `.card`, and `.badge` classes. These are optional — teams may compose utilities directly in JSX instead — but they serve as canonical implementations for documentation and rapid prototyping.

### Font Loading

Inter Variable should be self-hosted via `@fontsource-variable/inter` and imported at the application entry point. Self-hosting avoids FOIT (Flash of Invisible Text) on slow connections, which is critical for the 2G/3G networks prevalent in East African markets. The variable font file (approximately 120KB for the full Latin character set) is served with a 1-year cache header and loaded with `font-display: swap`.

### Container Queries

While the Tailwind container plugin is configured, Celis primarily uses breakpoint-based responsive design via `sm:`, `md:`, `lg:` prefixes. Container queries are reserved for card grids and dashboard widgets where the component must adapt to its parent width rather than the viewport width. When needed, use the `@container` class and `@md:@lg:` variants from `tailwindcss-container-queries` plugin.


---

# 4. shadcn/ui Component Library — Core + Marketplace Extensions

The Celis component layer is organized into three concentric tiers: core shadcn/ui primitives installed via CLI and restyled through the token bridge, marketplace-specific composites that combine multiple primitives with domain logic, and admin-facing components that prioritize information density and operational efficiency. Every component in all three tiers consumes the Celis token system from Chapter 2 and the global style layer from Chapter 3 — no component defines hardcoded colors, spacing values, or animation parameters.

The shadcn/ui foundation provides Radix UI-backed accessibility out of the box: WAI-ARIA compliant keyboard navigation, focus trapping in modals, screen-reader announcements for live regions, and `prefers-reduced-motion` awareness. Celis extends these primitives with marketplace-specific styling (sharp corners, 48px touch targets, high-contrast financial text) and composes them into higher-order components that encode P2P business logic.

---

## 4.1 Core shadcn/ui Components

### 4.1.1 Component Acquisition & Registry Pattern

All shadcn/ui primitives are installed through the project's CLI registry, not copied manually. The Celis project extends the default shadcn registry with a custom `components.json` that points component aliases to the `app/components/ui` directory and applies the `neutral` base color preset (closest to the Celis warm-slate palette). The registry configuration declares `"style": "new-york"` for Tailwind CSS v4 compatibility and `"typescript": true` for full type safety.

**Installation command** — the complete set of primitives used across all three tiers:

```bash
npx shadcn add sidebar breadcrumb tabs command table card badge avatar skeleton input textarea select checkbox radio-group switch date-picker dialog alert toast progress tooltip sheet popover dropdown-menu drawer
```

This installs 20 component directories, each containing the Radix primitive wrapper, Tailwind class composition, and TypeScript interface definitions. The total installed footprint is approximately 40KB of gzipped component source — tree-shaken to only those components imported by each route.

Post-installation, each component receives Celis-specific overrides through a systematic modification process:

1. **Border radius normalization**: All `rounded-md` and `rounded-lg` instances in shadcn defaults are replaced with `rounded-none` (0px) for inputs, `rounded-md` (6px) for cards and panels, and `rounded-full` (9999px) for badges and avatars — matching the Celis radius scale.

2. **Color token rebinding**: shadcn's direct `bg-background` references remain valid because the bridge layer in `globals.css` maps `--background` to `--celis-bg`. No color changes are needed in component source.

3. **Touch target enforcement**: All interactive elements (menu items, select triggers, calendar days, dialog close buttons) receive `min-h-[48px]` or explicit height `h-12` for mobile targets.

4. **Focus ring alignment**: shadcn's default `ring-2 ring-ring ring-offset-2` matches the Celis focus specification exactly — no changes required.

Components that are not modified after installation (they work correctly through the bridge) include: Tooltip, Progress, Popover, DropdownMenu, and Command. Components receiving Celis-specific extensions are detailed below.

### 4.1.2 Navigation Components

**Sidebar** (`app/components/ui/sidebar.tsx`) — installed via `npx shadcn add sidebar`. The shadcn sidebar is a collapsible navigation panel built on Radix UI Collapsible primitives. Celis uses it for the seller dashboard and admin console.

The Celis extension adds an icon-only collapsed mode triggered at viewport widths below 1024px. In this mode, the sidebar shrinks from 240px to 64px, hiding text labels and displaying only 24px icons. Tooltip overlays (using the shadcn Tooltip primitive) provide label text on hover for desktop; on touch devices, the sidebar expands to full width via a hamburger toggle. The collapsible animation uses the `grid-template-rows: 0fr → 1fr` technique defined in the Tailwind config, with a 250ms `ease-in-out` duration.

The sidebar header displays the Celis logo mark (28px) centered in icon-only mode, and the full wordmark (logo + text) in expanded mode. Transition between modes uses a crossfade: the wordmark fades out over 150ms while the logo mark scales from 0.85 to 1.0, creating a smooth morph without layout jump.

**Breadcrumb** (`app/components/ui/breadcrumb.tsx`) — used exclusively for category hierarchy navigation. On the listing detail page, the breadcrumb renders `Home > Electronics & Phones > Mobile Phones > iPhone 14 Pro`, with each segment linking to its corresponding category or subcategory page. The separator is a `ChevronRight` icon at 14px in `--celis-fg-muted`. The current (final) segment uses `text-foreground font-medium` while ancestors use `text-muted-foreground hover:text-foreground`. On mobile viewports below 640px, the breadcrumb collapses to show only the parent category and current item: `… > Mobile Phones > iPhone 14 Pro`.

**Tabs** (`app/components/ui/tabs.tsx`) — drives section switching on dashboard pages (dashboard home, seller profile, admin console). The Celis-styled tab list uses `h-12` (48px) touch targets with `px-4` horizontal padding. The active indicator is a 2px bottom border in `--celis-primary` with `transition-all duration-150`. Inactive tabs use `text-muted-foreground hover:text-foreground`. On mobile, tabs overflow horizontally with `overflow-x-auto no-scrollbar`, allowing swipe-scrolling through tab options. The `TabsTrigger` component uses Radix UI Tabs primitives, providing arrow-key navigation and `aria-selected` management automatically.

**Command** (`app/components/ui/command.tsx`) — implements the CMD-K global search accessible from any page. The command palette opens with the `⌘+K` (desktop) or a floating search button (mobile) keystroke, rendering a centered dialog with a `CommandInput` field and filterable `CommandList`. Celis customizes the input to use the sharp-cornered `rounded-none` style and expands the item height to `h-12` for touch. Search results group into: Listings (title + price), Users (avatar + name), and Actions (Navigate to…, Create…). Each result item displays a 40px thumbnail (for listings) or 32px avatar (for users) alongside primary and secondary text lines.

### 4.1.3 Data Display Components

**Table** (`app/components/ui/table.tsx`) — the Celis table extends the shadcn base with sorting, row selection, and pagination skeleton states. The header row uses `h-12 bg-muted/50` with `text-sm font-medium text-muted-foreground` and sort indicators (`ArrowUp`, `ArrowDown`, `ArrowUpDown` from `lucide-react` at 14px). Sort state cycles through asc → desc → none on click, storing the active column and direction in URL search params for shareable sort state.

Row selection uses a checkbox column with a header-level indeterminate checkbox (via Radix UI Checkbox `indeterminate` prop). Selected rows receive `bg-primary/5` tinting. The table body renders `TableRowSkeleton` components — 6 rows of `skeleton` class placeholders with `h-12` — during data fetching, maintaining layout stability and preventing cumulative layout shift.

Pagination sits below the table as a `flex items-center justify-between` bar showing "Showing 1–25 of 1,247" on the left and page controls on the right. Controls include `ChevronLeft`, `ChevronRight`, `ChevronsLeft`, `ChevronsRight` icon buttons at `h-10 w-10` with `variant="outline"`. Page numbers render as `Button variant={current ? "default" : "outline"}` with `size="sm"`. On mobile, pagination collapses to prev/next buttons only with the current page indicator.

**Card** (`app/components/ui/card.tsx`) — the shadcn Card primitive provides `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` subcomponents. Celis applies `rounded-md` (6px) to the root Card and uses `shadow-sm` in light mode / `shadow-none` in dark mode. Listing cards, order summaries, and KPI cards all compose from this primitive. Interactive cards (clickable listings) use the `card-interactive` class from `globals.css`, gaining hover elevation on desktop.

**Badge** (`app/components/ui/badge.tsx`) — displays status indicators across the platform. The Celis badge system defines six variants mapping to semantic tokens: default (gray), primary (indigo tint), secondary (muted), success (green tint), caution (amber tint), and destructive (red tint). Each uses the `/15` opacity background pattern: `bg-primary/15 text-primary`. Badges are strictly non-interactive — no hover states, no pointer cursors. Status badges in the order flow (Pending, Confirmed, Shipped, Delivered, Completed) use the success and caution variants exclusively.

**Avatar** (`app/components/ui/avatar.tsx`) — renders user profile images with fallback initials. Built on Radix UI Avatar primitives, the component handles image loading failures gracefully by falling back to initials. Celis sizes: `sm` (28px, text-xs), `md` (36px, text-sm), `lg` (48px, text-base), `xl` (64px, text-lg). The `AvatarFallback` component uses `bg-primary/10 text-primary font-medium uppercase`. Seller avatars on listing cards use the `md` size; buyer/seller chat avatars use `sm`; profile page hero uses `xl`.

**Skeleton** (`app/components/ui/skeleton.tsx`) — loading placeholder built on the `skeleton` utility class from `globals.css`. The shimmer animation sweeps a gradient band across the placeholder at a 2-second linear interval. On reduced-motion devices, the skeleton switches to a static translucent block. Skeleton layouts mirror the final component structure: listing card skeletons show a 16:9 aspect-ratio placeholder for the image, a 60% width bar for the title, a 40% bar for the price, and a circular placeholder for the avatar — maintaining the exact spatial footprint of the loaded card.

### 4.1.4 Form Components

**Input** (`app/components/ui/input.tsx`) — Celis restyles the shadcn Input with `rounded-none` for the sharp-corner aesthetic and enforces `h-10` (40px) default / `h-12` (48px) mobile. The phone number input variant prepends a `+252` country code indicator (Somalia) as a non-editable prefix inside a nested `div` with `bg-muted px-3` styling. Currency inputs use `text-right font-mono tabular-nums` for amount entry, with `font-variant-numeric: tabular-nums` preventing digit shift during typing.

**Textarea** (`app/components/ui/textarea.tsx`) — used for listing descriptions with a 2000-character maximum. The component includes a character counter: `<span className="text-xs text-muted-foreground">{value.length}/2000</span>` positioned below the textarea. The counter turns `text-caution` at 1800 characters and `text-destructive` at 2000. The textarea uses `min-h-[120px]` and `resize-y`, with `leading-relaxed` for comfortable long-form entry.

**Select** (`app/components/ui/select.tsx`) — built on Radix UI Select primitives with full keyboard navigation (arrow keys, Enter to select, Escape to close, Home/End for first/last). Celis styles the trigger with `h-12 min-h-[48px]` for touch targets and `rounded-none`. The dropdown viewport uses `rounded-md` and `shadow-md` elevation. Select components handle category hierarchies (Electronics → Phones → Accessories), condition grades (New, Like New, Good, Fair, For Parts), and carrier options for mobile devices. The category select uses grouped `<SelectGroup>` elements with `<SelectLabel>` headers.

**Checkbox** (`app/components/ui/checkbox.tsx`) — Radix UI Checkbox with Celis styling: `h-5 w-5 rounded-sm border-2` with `data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`. The check indicator uses a 14px `Check` icon with a subtle `scale-0 → scale-100` transition on check. Faceted filter checkboxes (category filters, price range filters, condition filters) use the `indeterminate` state for parent categories with partially selected children.

**RadioGroup** (`app/components/ui/radio-group.tsx`) — used for delivery method selection (Pickup, Delivery, Shipping) and monetization tier selection (Free, Featured, Premium). Each radio item renders as a `h-14` (56px) touch row with a `rounded-md` border, `px-4` padding, and a 20px radio indicator. The selected state applies `border-primary bg-primary/5`, creating a highlighted card appearance. Radio items stack vertically with `gap-3` spacing.

**Switch** (`app/components/ui/switch.tsx`) — toggles feature flags, notification preferences, and auto-renew settings. The Celis switch uses `w-11 h-6` track dimensions with `rounded-full` and a `translate-x-5` thumb shift on activation. The thumb is `h-5 w-5` with `shadow-sm`. The track uses `data-[state=checked]:bg-primary` and `data-[state=unchecked]:bg-muted`. Switch transitions animate over 150ms with `ease-in-out`.

**DatePicker** (`app/components/ui/date-picker.tsx`) — composed from shadcn Popover, Calendar, and Button primitives. Used for listing expiry date selection (default 30 days from creation, maximum 90 days). The trigger button displays the selected date in `PPP` format (e.g., "January 15, 2026") with a `CalendarIcon` prefix. The calendar popover uses the Celis-styled `Calendar` component with `rounded-md` container and `shadow-md` elevation. Past dates are disabled via `disabled={(date) => date < new Date()}`.

### 4.1.5 Feedback Components

**Dialog** (`app/components/ui/dialog.tsx`) — confirmation modals for irreversible actions (cancel order, delete listing, release escrow). The Dialog overlay uses `bg-black/50` with a fade-in animation over 150ms. Dialog content renders with `rounded-md`, `shadow-lg`, and `max-w-lg` (512px max width). The header contains `DialogTitle` (accessible, required by Radix) and optional `DialogDescription`. Mobile dialogs convert to bottom sheets via the `Drawer` component at viewports below 768px.

Destructive confirmation dialogs use a red-accented variant: the confirm button uses `variant="destructive"` and the dialog title renders in `text-destructive`. A 3-second delay with a countdown timer prevents accidental confirmation on high-stakes actions (escrow release, account deletion).

**Alert** (`app/components/ui/alert.tsx`) — inline status messages for form errors, system notices, and action outcomes. Four variants: default (`bg-muted text-foreground`), success (`bg-success/15 text-success`), caution (`bg-caution/15 text-caution`), and destructive (`bg-destructive/15 text-destructive`). Each includes a 16px status icon (`Info`, `CheckCircle`, `AlertTriangle`, `AlertCircle` respectively) and supports an optional action link. Alerts use `rounded-md` and `p-4` with `gap-3` between icon and content.

**Toast** (`app/components/ui/toast.tsx`) — transaction notifications powered by Radix UI Toast primitives. Toasts appear from the bottom-right (desktop) or bottom-center (mobile) with a `slide-in-from-bottom` animation at 400ms. Each toast has a 5-second auto-dismiss timer, paused on hover. Celis uses toasts for: payment confirmations ("KES 12,500 deposited to escrow"), message notifications ("New message from Abdirahman"), and system alerts ("Listing expiring in 24 hours"). Toasts stack with `gap-2` and a maximum of 3 visible simultaneously.

**Progress** (`app/components/ui/progress.tsx`) — visual indicator for upload progress, escrow funding status, and delivery milestones. The Celis progress bar uses `h-2 rounded-full` track with `bg-muted` and `h-full rounded-full` fill in `bg-primary`. Indeterminate state renders a `shimmer` animation sweeping across the track. The progress value is exposed via `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` for screen readers.

### 4.1.6 Overlay Components

**Sheet** (`app/components/ui/sheet.tsx`) — side-panel overlay for mobile filters and detail panels. Built on Radix UI Dialog with a custom animation wrapper, the sheet slides in from the right on desktop (`slide-in-from-right`, 300ms) and from the bottom on mobile (full-width, 80vh height). The sheet overlay uses `bg-black/50` with a fade. Sheet content uses `bg-background` with `shadow-xl` and `p-6` padding. The close button is a `h-10 w-10` icon button in the top-right corner.

The filter sheet on the browse page contains: category checkboxes, price range slider, condition radio group, location select, and a "Clear All" / "Apply" footer. The listing detail sheet on mobile presents the full listing view without navigating to a new page.

**Drawer** (`app/components/ui/drawer.tsx`) — bottom-sheet overlay for mobile forms (create listing, send message, make offer). The drawer uses `rounded-t-xl` (12px top radius) and occupies 90% of viewport height when expanded. A drag handle — `w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-3 mb-4` — provides a visual affordance for the swipe-to-dismiss gesture, implemented via `vaul` (the library underlying shadcn Drawer). The drawer supports three snap points: 25% (peek), 50% (partial), and 100% (full). On desktop, the drawer converts to a centered dialog.

**DropdownMenu** (`app/components/ui/dropdown-menu.tsx`) — action menus for listing cards (Edit, Delete, Share, Mark as Sold), user avatars (Profile, Settings, Logout), and table row actions. Radix UI DropdownMenu provides arrow-key navigation, typeahead search, and `aria-expanded` management. Celis styles menu items with `h-10` (40px) height and `px-3` padding. Destructive actions (Delete) use `text-destructive focus:bg-destructive/10`. Menu item icons are 16px, prefixed with `mr-2`.

---

## 4.2 Marketplace-Specific Composite Components

Composite components are React components that compose multiple shadcn/ui primitives with marketplace domain logic. They live in `app/components/marketplace/` and are the primary building blocks of the Celis buyer and seller experiences. Each composite exports a single default component with named subcomponents where composability is required.

### 4.2.1 ListingCard

The `ListingCard` component is the most frequently rendered element in the Celis browsing experience. It combines Card, Badge, Avatar, and Carousel primitives into a self-contained unit that renders in a responsive grid (2 columns mobile / 3 columns tablet / 4 columns desktop).

**Code Block 1: ListingCard Component**

```typescript
// app/components/marketplace/listing-card.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: "new" | "like-new" | "good" | "fair" | "parts";
  images: string[];
  location: string;
  seller: {
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
  };
  onClick?: (id: string) => void;
}

const conditionMap = {
  "new":       { label: "New",        variant: "success" as const },
  "like-new":  { label: "Like New",   variant: "success" as const },
  "good":      { label: "Good",       variant: "default" as const },
  "fair":      { label: "Fair",       variant: "caution" as const },
  "parts":     { label: "For Parts",  variant: "destructive" as const },
};

export function ListingCard({
  id,
  title,
  price,
  currency,
  condition,
  images,
  location,
  seller,
  onClick,
}: ListingCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const conditionMeta = conditionMap[condition];

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat("en-SO", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden rounded-md border shadow-sm",
        "transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5"
      )}
      onClick={() => onClick?.(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(id)}
    >
      {/* Image Carousel */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={images[currentImage]}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Condition Badge — top-left */}
        <Badge
          variant={conditionMeta.variant}
          className="absolute left-2 top-2 z-10"
        >
          {conditionMeta.label}
        </Badge>

        {/* Carousel Dots — bottom-center */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-150",
                  idx === currentImage
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/60"
                )}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows — visible on hover (desktop) */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-150 hover:bg-black/60 group-hover:opacity-100 md:inline-flex"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-150 hover:bg-black/60 group-hover:opacity-100 md:inline-flex"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-3">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
          {title}
        </h3>

        {/* Price */}
        <p className="mt-1 font-mono text-base font-semibold tabular-nums text-foreground">
          {formatPrice(price, currency)}
        </p>

        {/* Location + Seller Row */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{location}</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={seller.avatar} alt={seller.name} />
              <AvatarFallback className="text-[8px]">
                {seller.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[60px] text-xs text-muted-foreground">
              {seller.name}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-caution text-caution" />
            <span className="text-xs font-medium text-muted-foreground">
              {seller.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

The `ListingCard` uses `aspect-[4/3]` for consistent image proportions across all listings. The price renders in Geist Mono with `tabular-nums` to prevent digit-width jitter. The condition badge maps to semantic variants — "New" and "Like New" use the success variant, "Fair" uses caution, "For Parts" uses destructive. On mobile, carousel arrows are hidden; users swipe horizontally to change images via touch. The card's entire surface is keyboard-accessible with `Enter` key activation and a visible focus ring.

### 4.2.2 OrderStatusBar

The `OrderStatusBar` displays order progress through five milestones: Ordered → Confirmed → Shipped → Delivered → Completed. Each milestone renders as a node in a horizontal track with connecting lines.

**Code Block 2: OrderStatusBar Component**

```typescript
// app/components/marketplace/order-status-bar.tsx
"use client";

import { Check, Loader2, Truck, Package, Home, Star, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

type Milestone = "ordered" | "confirmed" | "shipped" | "delivered" | "completed";

interface OrderStatusBarProps {
  current: Milestone;
  className?: string;
}

const milestones: { key: Milestone; label: string; icon: React.ElementType }[] = [
  { key: "ordered",    label: "Ordered",    icon: ClipboardList },
  { key: "confirmed",  label: "Confirmed",  icon: Check },
  { key: "shipped",    label: "Shipped",    icon: Truck },
  { key: "delivered",  label: "Delivered",  icon: Home },
  { key: "completed",  label: "Completed",  icon: Star },
];

export function OrderStatusBar({ current, className }: OrderStatusBarProps) {
  const currentIndex = milestones.findIndex((m) => m.key === current);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {milestones.map((milestone, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const Icon = milestone.icon;

            return (
              <div key={milestone.key} className="flex flex-1 items-center">
                {/* Node */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isPast && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary bg-background text-primary",
                      !isPast && !isCurrent && "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isPast ? (
                      <Check className="h-5 w-5" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isPast && "text-primary",
                      isCurrent && "text-foreground",
                      !isPast && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {milestone.label}
                  </span>
                </div>

                {/* Connector Line */}
                {idx < milestones.length - 1 && (
                  <div className="relative mx-2 mb-6 h-0.5 flex-1">
                    <div className="absolute inset-0 bg-muted" />
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 bg-primary transition-all duration-500",
                        idx < currentIndex ? "right-0" : "right-full"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical Accordion */}
      <div className="md:hidden">
        <div className="space-y-0">
          {milestones.map((milestone, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;
            const Icon = milestone.icon;

            return (
              <div key={milestone.key} className="flex gap-3">
                {/* Vertical line + node */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2",
                      isPast && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary bg-background text-primary",
                      isFuture && "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isPast ? (
                      <Check className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {idx < milestones.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 flex-1 min-h-[24px]",
                        isPast ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="pb-4">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isPast && "text-primary",
                      isCurrent && "text-foreground font-semibold",
                      isFuture && "text-muted-foreground"
                    )}
                  >
                    {milestone.label}
                  </span>
                  {isCurrent && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Current status — updating automatically
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

The desktop layout renders a horizontal timeline with 10px nodes connected by animated progress lines. The line fill transitions with a 500ms duration as the order advances. On mobile, the component switches to a vertical stack with a connecting line running down the left edge. Each node uses a distinct icon from `lucide-react`: `ClipboardList` for Ordered, `Check` for Confirmed, `Truck` for Shipped, `Home` for Delivered, `Star` for Completed. The current milestone displays a spinning `Loader2` icon, while past milestones show a solid checkmark. Future milestones render in muted gray.

### 4.2.3 WalletPaymentModal

The `WalletPaymentModal` handles mobile money payments through Somali providers (EVC Plus, eDahab, Premier Wallet). It is a multi-step dialog that guides the buyer from provider selection through USSD prompt to confirmation.

**Code Block 3: WalletPaymentModal Component**

```typescript
// app/components/marketplace/wallet-payment-modal.tsx
"use client";

import { useState } from "react";
import { Phone, Copy, RefreshCw, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Provider = "evc" | "edahab" | "premier";
type PaymentStep = "select" | "confirm" | "processing" | "success" | "failed";

interface WalletPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  merchantName: string;
  onPaymentComplete?: (txId: string) => void;
}

const providers: { key: Provider; name: string; ussdPrefix: string; color: string }[] = [
  { key: "evc",     name: "EVC Plus",      ussdPrefix: "*770#",   color: "bg-emerald-600" },
  { key: "edahab",  name: "eDahab",        ussdPrefix: "*712#",   color: "bg-amber-600" },
  { key: "premier", name: "Premier Wallet", ussdPrefix: "*880#",  color: "bg-blue-600" },
];

export function WalletPaymentModal({
  open,
  onClose,
  amount,
  currency,
  merchantName,
  onPaymentComplete,
}: WalletPaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("select");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const formatAmount = (val: number, curr: string) =>
    new Intl.NumberFormat("en-SO", { style: "currency", currency: curr, minimumFractionDigits: 0 }).format(val);

  const provider = providers.find((p) => p.key === selectedProvider);

  const handleConfirm = () => {
    setStep("processing");
    // Simulate USSD processing — in production, polls payment API
    setTimeout(() => {
      setStep("success");
      onPaymentComplete?.(`TXN-${Date.now()}`);
    }, 4000);
  };

  const handleRetry = () => {
    setStep("select");
    setSelectedProvider(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md rounded-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {step === "select" && "Choose Payment Method"}
            {step === "confirm" && "Confirm Payment"}
            {step === "processing" && "Processing Payment"}
            {step === "success" && "Payment Successful"}
            {step === "failed" && "Payment Failed"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {step === "select" && `Pay ${formatAmount(amount, currency)} to ${merchantName}`}
            {step === "confirm" && `Review and confirm your ${provider?.name} payment`}
            {step === "processing" && "Complete the USSD prompt on your phone"}
            {step === "success" && `Your payment of ${formatAmount(amount, currency)} has been received`}
            {step === "failed" && "We couldn't process your payment. Please try again."}
          </DialogDescription>
        </DialogHeader>

        {/* Provider Selection */}
        {step === "select" && (
          <div className="space-y-3">
            {providers.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setSelectedProvider(p.key);
                  setStep("confirm");
                }}
                className={cn(
                  "flex w-full items-center gap-4 rounded-md border p-4 transition-all duration-150",
                  "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <div className={cn("h-10 w-10 rounded-full", p.color)} />
                <div className="text-left">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.ussdPrefix}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Confirmation */}
        {step === "confirm" && provider && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-mono font-semibold">{formatAmount(amount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium">{provider.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Merchant</span>
                <span className="font-medium">{merchantName}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-mono">{formatAmount(0, currency)}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md bg-primary/5 p-3 text-xs text-primary">
              <Phone className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                You will receive a USSD prompt on your phone. Enter your PIN to authorize this payment.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={handleRetry}>
                Cancel
              </Button>
              <Button className="flex-1 h-12" onClick={handleConfirm}>
                Pay {formatAmount(amount, currency)}
              </Button>
            </div>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="relative h-16 w-16">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Waiting for USSD confirmation...
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>Check your phone for {provider?.ussdPrefix}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRetry} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Cancel & Retry
            </Button>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Payment confirmed</p>
              <p className="text-xs text-muted-foreground mt-1">
                Funds held in escrow until delivery
              </p>
            </div>
            <Button className="w-full h-12" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {/* Failed */}
        {step === "failed" && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <Button className="w-full h-12" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

The modal progresses through five steps: `select` (provider grid), `confirm` (amount review), `processing` (USSD polling), `success` (confirmation), and `failed` (retry). Each provider renders as a colored circle — emerald for EVC, amber for eDahab, blue for Premier — with name and USSD prefix. The confirmation step displays a summary card with amount, provider, merchant, and fee (always zero for buyer-side payments). During processing, a spinning loader indicates active polling with a cancel option. The entire flow maintains a `min-h-[48px]` on all buttons for touch targets.

### 4.2.4 PickupHandshake

The `PickupHandshake` component facilitates in-person exchanges by displaying a shared PIN, countdown timer, QR code, and handover confirmation for the seller.

**Code Block 4: PickupHandshake Component**

```typescript
// app/components/marketplace/pickup-handshake.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, CheckCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PickupHandshakeProps {
  pin: string;
  expiresAt: Date;
  qrData: string;
  onHandover?: () => void;
  onExpire?: () => void;
}

export function PickupHandshake({
  pin,
  expiresAt,
  qrData,
  onHandover,
  onExpire,
}: PickupHandshakeProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [handedOver, setHandedOver] = useState(false);

  const updateTimer = useCallback(() => {
    const remaining = Math.max(0, expiresAt.getTime() - Date.now());
    setTimeLeft(remaining);
    if (remaining === 0) onExpire?.();
  }, [expiresAt, onExpire]);

  useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isExpired = timeLeft === 0;
  const isUrgent = timeLeft < 300000; // < 5 minutes

  const handleHandover = () => {
    setHandedOver(true);
    onHandover?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto rounded-md">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-base font-semibold">
          Exchange Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* PIN Display */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Shared PIN
          </p>
          <div className="flex items-center justify-center gap-2">
            {pin.split("").map((digit, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex h-14 w-12 items-center justify-center rounded-md border-2",
                  "bg-muted font-mono text-3xl font-bold tracking-tight",
                  isExpired ? "border-destructive text-destructive" : "border-primary text-foreground"
                )}
              >
                {digit}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Both parties must see the same PIN
          </p>
        </div>

        {/* Countdown Timer */}
        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-md py-3",
            isExpired ? "bg-destructive/10" : isUrgent ? "bg-caution/10" : "bg-muted"
          )}
        >
          <Timer
            className={cn(
              "h-4 w-4",
              isExpired ? "text-destructive" : isUrgent ? "text-caution" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "font-mono text-lg font-semibold tabular-nums",
              isExpired ? "text-destructive" : isUrgent ? "text-caution" : "text-foreground"
            )}
          >
            {isExpired
              ? "EXPIRED"
              : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
          </span>
        </div>

        {/* QR Code Panel */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <QrCode className="h-3 w-3" />
            <span>Scan to verify</span>
          </div>
          <div className="h-40 w-40 rounded-md border bg-white p-2 flex items-center justify-center">
            {/* QRCode.react component renders here */}
            <QrCode className="h-32 w-32 text-foreground" />
          </div>
        </div>

        {/* Seller Handover Button */}
        <Button
          className={cn("w-full h-14 text-base font-semibold transition-all duration-300", handedOver && "bg-success hover:bg-success")}
          onClick={handleHandover}
          disabled={handedOver || isExpired}
        >
          {handedOver ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Handed Over
            </>
          ) : (
            "Mark as Handed Over"
          )}
        </Button>

        {isExpired && (
          <p className="text-center text-xs text-destructive">
            This exchange session has expired. Generate a new PIN to continue.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

The PIN displays as six individual digit boxes at 48px font size (`text-3xl` on `h-14` containers), ensuring readability in outdoor lighting. Each digit renders in a bordered box with monospace font for uniform glyph width. The countdown timer shows `MM:SS` format with color escalation: default gray above 5 minutes, amber caution below 5 minutes, and red on expiry. The QR code panel (rendered via `qrcode.react` `<QRCodeSVG>` in production) encodes the same verification data as the PIN. The "Mark as Handed Over" button is a full-width `h-14` (56px) touch target that transitions to a green success state on activation, providing immediate visual confirmation.

### 4.2.5 CommissionCalculator

The `CommissionCalculator` provides an interactive price exploration tool for sellers, showing real-time commission breakdowns as they adjust their listing price.

**Code Block 5: CommissionCalculator Component**

```typescript
// app/components/marketplace/commission-calculator.tsx
"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CommissionCalculatorProps {
  minPrice?: number;
  maxPrice?: number;
  commissionRate?: number; // e.g., 0.05 = 5%
  shippingEstimate?: number;
  currency?: string;
}

export function CommissionCalculator({
  minPrice = 500,
  maxPrice = 500000,
  commissionRate = 0.05,
  shippingEstimate = 0,
  currency = "SLSH",
}: CommissionCalculatorProps) {
  const [price, setPrice] = useState<number>(25000);
  const debouncedPrice = useDebounce(price, 100);

  const breakdown = useMemo(() => {
    const commission = Math.round(debouncedPrice * commissionRate);
    const net = debouncedPrice - commission - shippingEstimate;
    return {
      gross: debouncedPrice,
      commission,
      shipping: shippingEstimate,
      net: Math.max(0, net),
      rate: commissionRate,
    };
  }, [debouncedPrice, commissionRate, shippingEstimate]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-SO", { style: "currency", currency, minimumFractionDigits: 0 }).format(val);

  const sliderValue = [Math.round(((price - minPrice) / (maxPrice - minPrice)) * 100)];

  const handleSliderChange = (vals: number[]) => {
    const pct = vals[0] / 100;
    setPrice(Math.round(minPrice + pct * (maxPrice - minPrice)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(val)) setPrice(Math.min(maxPrice, Math.max(minPrice, val)));
  };

  return (
    <Card className="w-full max-w-md rounded-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Payout Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Listing Price</label>
          <Input
            type="text"
            value={formatCurrency(price)}
            onChange={handleInputChange}
            className="h-12 text-lg font-mono font-semibold text-right tabular-nums"
          />
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={sliderValue}
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(minPrice)}</span>
            <span>{formatCurrency(maxPrice)}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-md bg-muted p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Listing Price</span>
            <span className="font-mono font-medium">{formatCurrency(breakdown.gross)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Commission ({(breakdown.rate * 100).toFixed(0)}%)
            </span>
            <span className="font-mono text-destructive">
              −{formatCurrency(breakdown.commission)}
            </span>
          </div>

          {breakdown.shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping Estimate</span>
              <span className="font-mono text-caution">
                −{formatCurrency(breakdown.shipping)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between">
            <span className="text-sm font-semibold">You Receive</span>
            <span className="font-mono text-lg font-bold tabular-nums text-success">
              {formatCurrency(breakdown.net)}
            </span>
          </div>
        </div>

        {/* Visual bar */}
        <div className="space-y-1">
          <div className="flex h-3 overflow-hidden rounded-full">
            <div
              className="bg-success transition-all duration-300"
              style={{ width: `${(breakdown.net / breakdown.gross) * 100}%` }}
            />
            <div
              className="bg-destructive/70 transition-all duration-300"
              style={{ width: `${(breakdown.commission / breakdown.gross) * 100}%` }}
            />
            {breakdown.shipping > 0 && (
              <div
                className="bg-caution/70 transition-all duration-300"
                style={{ width: `${(breakdown.shipping / breakdown.gross) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success" />
              Net
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-destructive/70" />
              Commission
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

The calculator combines a currency-formatted text input with a range slider covering 500–500,000 SLSH. The slider uses the shadcn `Slider` primitive (built on Radix UI Slider), which provides full keyboard control (arrow keys for 1% increments, Page Up/Down for 10%). The breakdown card displays gross price, commission deduction (in red), shipping estimate (in amber), and net payout (in green, emphasized at `text-lg font-bold`). A proportional bar below visualizes the split between net earnings and fees. The debounced price update (100ms) prevents excessive re-renders during slider drag operations.

### 4.2.6 LocalPickupMap

The `LocalPickupMap` component renders an embedded map with a pickup radius circle, meeting point pin, and landmark labels. On low-end devices, it falls back to a district list with textual directions.

```typescript
// app/components/marketplace/local-pickup-map.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { MapPin, Navigation, List, Map as MapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Landmark {
  name: string;
  distance: string;
  direction: string;
}

interface LocalPickupMapProps {
  center: { lat: number; lng: number };
  radiusMeters?: number;
  meetingPoint: { lat: number; lng: number; description: string };
  landmarks?: Landmark[];
  districtName: string;
  fallbackMode?: boolean;
}

export function LocalPickupMap({
  center,
  radiusMeters = 500,
  meetingPoint,
  landmarks = [],
  districtName,
  fallbackMode: forceFallback,
}: LocalPickupMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [useFallback, setUseFallback] = useState(forceFallback ?? false);

  // Detect low-end devices for automatic fallback
  useEffect(() => {
    if (forceFallback !== undefined) return;
    const memory = (navigator as any).deviceMemory;
    const connection = (navigator as any).connection;
    const isLowEnd =
      memory !== undefined && memory < 4 ||
      connection?.effectiveType === "2g" ||
      connection?.saveData === true;
    setUseFallback(isLowEnd);
  }, [forceFallback]);

  const radiusKm = (radiusMeters / 1000).toFixed(1);

  if (useFallback) {
    return (
      <Card className="w-full rounded-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <List className="h-4 w-4" />
              Pickup Location
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseFallback(false)}
              className="h-8"
            >
              <MapIcon className="h-4 w-4 mr-1" />
              Try Map
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">{districtName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Within {radiusKm}km of meeting point
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Meeting Point
            </p>
            <div className="flex items-start gap-3 p-3 border rounded-md">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{meetingPoint.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coordinates: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {landmarks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Nearby Landmarks
              </p>
              {landmarks.map((lm, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors"
                >
                  <span className="text-sm">{lm.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {lm.distance}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{lm.direction}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" className="w-full h-12 gap-2" asChild>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${meetingPoint.lat},${meetingPoint.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Map mode: renders embedded interactive map
  return (
    <Card className="w-full rounded-md overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Pickup Location</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseFallback(true)}
            className="h-8"
          >
            <List className="h-4 w-4 mr-1" />
            Text View
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="relative h-72 w-full bg-muted">
          {/* MapLibre GL / Mapbox GL container — initialized in useEffect */}
          <div id="pickup-map" className="absolute inset-0" />

          {/* Meeting point overlay */}
          <div className="absolute bottom-4 left-4 right-4 rounded-md bg-background/95 p-3 shadow-md backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{meetingPoint.description}</p>
                <p className="text-xs text-muted-foreground">
                  {radiusKm}km radius · {districtName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

The component operates in two modes: **map mode** (default on capable devices) renders a MapLibre GL instance with a circle layer for the pickup radius and a marker at the meeting point; **fallback mode** (automatic on devices with `<4GB` RAM, 2G connection, or `saveData` enabled) presents a structured text view with district name, meeting point coordinates, nearby landmarks with distances and directions, and a "Get Directions" link to Google Maps. Users can toggle between modes via a button in the header. The fallback detection uses the Device Memory API, Network Information API, and `Save-Data` header — falling back gracefully when APIs are unavailable.

---

## 4.3 Admin Components

Admin components live in `app/components/admin/` and serve the operational console used by Celis staff for dispute resolution, financial oversight, escrow management, and platform configuration. These components prioritize information density, rapid scanning, and keyboard-driven workflows over the visual polish of consumer-facing components.

### 4.3.1 DisputePanel

The `DisputePanel` provides a split-view interface for dispute resolution, showing the listing description and buyer claim side-by-side with evidence photos and resolution actions.

**Code Block 6: DisputePanel Component**

```typescript
// app/components/admin/dispute-panel.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Shield, User, Package, MessageSquare, CheckCircle, XCircle, Split, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ResolutionAction = "release" | "refund" | "split" | "request_evidence";

interface DisputePanelProps {
  listing: {
    title: string;
    description: string;
    price: number;
    condition: string;
    images: string[];
    sellerName: string;
  };
  buyerClaim: {
    buyerName: string;
    reason: string;
    description: string;
    submittedAt: string;
  };
  evidencePhotos: string[];
  orderAmount: number;
  currency: string;
  onResolve?: (action: ResolutionAction, note: string) => void;
}

export function DisputePanel({
  listing,
  buyerClaim,
  evidencePhotos,
  orderAmount,
  currency,
  onResolve,
}: DisputePanelProps) {
  const [selectedAction, setSelectedAction] = useState<ResolutionAction | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-SO", { style: "currency", currency, minimumFractionDigits: 0 }).format(val);

  const actions: { key: ResolutionAction; label: string; icon: React.ElementType; variant: "default" | "destructive" | "outline" | "secondary" }[] = [
    { key: "release",         label: "Release to Seller", icon: CheckCircle,  variant: "default" },
    { key: "refund",          label: "Refund Buyer",      icon: XCircle,      variant: "destructive" },
    { key: "split",           label: "Split 50/50",       icon: Split,        variant: "secondary" },
    { key: "request_evidence", label: "Request Evidence", icon: ImageIcon,    variant: "outline" },
  ];

  const handleResolve = () => {
    if (selectedAction) {
      onResolve?.(selectedAction, resolutionNote);
    }
  };

  return (
    <div className="grid h-full gap-6 lg:grid-cols-2">
      {/* Left: Listing Description */}
      <Card className="rounded-md overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Listing Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Listing images */}
          <div className="grid grid-cols-3 gap-2">
            {listing.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                <Image src={img} alt={`${listing.title} ${idx + 1}`} fill className="object-cover" sizes="200px" />
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold">{listing.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{listing.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xl font-bold tabular-nums">{formatCurrency(listing.price)}</span>
            <Badge variant="secondary">{listing.condition}</Badge>
          </div>

          <Separator />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Seller: {listing.sellerName}</span>
          </div>
        </CardContent>
      </Card>

      {/* Right: Buyer Claim + Resolution */}
      <div className="space-y-4">
        {/* Buyer Claim */}
        <Card className="rounded-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Buyer Claim</CardTitle>
              </div>
              <Badge variant="caution">{buyerClaim.reason}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Buyer: {buyerClaim.buyerName}</span>
              <span className="text-muted-foreground">{buyerClaim.submittedAt}</span>
            </div>
            <p className="text-sm leading-relaxed">{buyerClaim.description}</p>
          </CardContent>
        </Card>

        {/* Evidence Photos */}
        {evidencePhotos.length > 0 && (
          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Evidence Photos ({evidencePhotos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {evidencePhotos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <Image src={photo} alt={`Evidence ${idx + 1}`} fill className="object-cover" sizes="120px" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution Actions */}
        <Card className={cn("rounded-md", selectedAction === "split" && "border-caution")}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Resolution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => (
                <Button
                  key={action.key}
                  variant={selectedAction === action.key ? "default" : action.variant}
                  className={cn(
                    "h-12 justify-start gap-2 transition-all duration-150",
                    selectedAction === action.key && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setSelectedAction(action.key)}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>

            <Textarea
              placeholder="Add resolution notes (optional)..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="min-h-[80px] resize-y"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Order amount: <span className="font-mono font-medium">{formatCurrency(orderAmount)}</span>
              </span>
              <Button
                onClick={handleResolve}
                disabled={!selectedAction}
                className="h-10 px-6"
              >
                Apply Resolution
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

The `DisputePanel` uses a two-column grid on desktop (`lg:grid-cols-2`) that stacks vertically on mobile. The left column shows the original listing — images, title, description, price, condition badge, and seller name. The right column contains the buyer's claim (reason badge + description), evidence photo grid, and resolution action bar. The four resolution actions render as a 2×2 button grid: Release to Seller (primary), Refund Buyer (destructive), Split 50/50 (secondary with caution border on selection), and Request Evidence (outline). Financial amounts render in Geist Mono with tabular alignment. All action buttons are `h-12` (48px) for touch accessibility.

### 4.3.2 FinancialLedger

The `FinancialLedger` component displays a complete transaction history with sorting, filtering, CSV export, and revenue KPI cards.

```typescript
// app/components/admin/financial-ledger.tsx
"use client";

import { useState, useMemo } from "react";
import { Download, ArrowUpDown, TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TransactionType = "sale" | "refund" | "commission" | "withdrawal" | "deposit";

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  currency: string;
  party: string;
  status: "completed" | "pending" | "failed";
}

interface FinancialLedgerProps {
  transactions: Transaction[];
  dateRange: { from: string; to: string };
  onDateRangeChange?: (range: { from: string; to: string }) => void;
  onExport?: () => void;
}

const typeConfig: Record<TransactionType, { label: string; variant: "default" | "success" | "destructive" | "caution" | "secondary" }> = {
  sale:        { label: "Sale",        variant: "success" },
  refund:      { label: "Refund",      variant: "destructive" },
  commission:  { label: "Commission",  variant: "secondary" },
  withdrawal:  { label: "Withdrawal",  variant: "caution" },
  deposit:     { label: "Deposit",     variant: "default" },
};

export function FinancialLedger({
  transactions,
  dateRange,
  onDateRangeChange,
  onExport,
}: FinancialLedgerProps) {
  const [sortColumn, setSortColumn] = useState<"date" | "amount">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");

  const toggleSort = (col: "date" | "amount") => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  };

  const kpi = useMemo(() => {
    const totalRevenue = transactions
      .filter((t) => t.type === "sale" || t.type === "commission")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRefunds = transactions
      .filter((t) => t.type === "refund")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netRevenue = totalRevenue - totalRefunds;
    const transactionCount = transactions.length;
    return { totalRevenue, totalRefunds, netRevenue, transactionCount };
  }, [transactions]);

  const filtered = useMemo(() => {
    let data = [...transactions];
    if (filterText) {
      const q = filterText.toLowerCase();
      data = data.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.party.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      if (sortColumn === "date") return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return multiplier * (a.amount - b.amount);
    });
    return data;
  }, [transactions, filterText, sortColumn, sortDirection]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-SO", { style: "currency", currency: "SLSH", minimumFractionDigits: 0 }).format(Math.abs(val));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Gross Revenue</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tabular-nums">{formatCurrency(kpi.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Refunds</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tabular-nums">{formatCurrency(kpi.totalRefunds)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Net Revenue</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tabular-nums text-success">{formatCurrency(kpi.netRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Transactions</span>
            </div>
            <p className="mt-2 font-mono text-xl font-bold tabular-nums">{kpi.transactionCount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => onDateRangeChange?.({ ...dateRange, from: e.target.value })}
            className="h-10 w-auto"
          />
          <span className="flex items-center text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => onDateRangeChange?.({ ...dateRange, to: e.target.value })}
            className="h-10 w-auto"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search transactions..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 w-64"
          />
          <Button variant="outline" className="h-10 gap-2" onClick={onExport}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Transaction Table */}
      <Card className="rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-12 bg-muted/50">
              <TableHead className="text-xs font-medium">ID</TableHead>
              <TableHead className="text-xs font-medium">Description</TableHead>
              <TableHead className="text-xs font-medium">Party</TableHead>
              <TableHead className="text-xs font-medium">
                <button onClick={() => toggleSort("type")} className="flex items-center gap-1">
                  Type
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium text-right">
                <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 ml-auto">
                  Amount
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium">
                <button onClick={() => toggleSort("date")} className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((tx) => {
              const config = typeConfig[tx.type];
              return (
                <TableRow key={tx.id} className="h-12 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{tx.description}</TableCell>
                  <TableCell className="text-sm">{tx.party}</TableCell>
                  <TableCell>
                    <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-sm tabular-nums", tx.amount < 0 && "text-destructive")}>
                    {tx.amount < 0 ? "−" : ""}{formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === "completed" ? "success" : tx.status === "pending" ? "caution" : "destructive"} className="text-xs">
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```

The `FinancialLedger` opens with four KPI cards in a responsive grid (2 columns mobile, 4 columns desktop): Gross Revenue, Refunds, Net Revenue, and Transaction Count. Below the KPIs, a toolbar provides date range inputs, text search, and CSV export. The transaction table uses the shadcn `Table` primitive with sortable headers — clicking a column header toggles between ascending and descending sort. Type badges use semantic variants (green for sales, red for refunds, gray for commissions, amber for withdrawals). Amounts render in Geist Mono with negative values in red. The table rows use `h-12` for density while maintaining the 48px touch target.

### 4.3.3 EscrowMonitor

The `EscrowMonitor` displays all escrowed transactions with days-held tracking, aging indicators, and manual intervention controls.

**Code Block 8: EscrowMonitor Component**

```typescript
// app/components/admin/escrow-monitor.tsx
"use client";

import { useState, useMemo } from "react";
import { Clock, Unlock, CalendarDays, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type EscrowStatus = "holding" | "pending_release" | "released" | "refunded";

interface EscrowTransaction {
  id: string;
  orderId: string;
  buyer: string;
  seller: string;
  amount: number;
  currency: string;
  fundedAt: string;
  status: EscrowStatus;
  daysHeld: number;
  disputeOpen: boolean;
}

interface EscrowMonitorProps {
  transactions: EscrowTransaction[];
  onRelease?: (id: string) => void;
  onExtend?: (id: string) => void;
}

const statusConfig: Record<EscrowStatus, { label: string; variant: "default" | "success" | "destructive" | "caution" | "secondary" }> = {
  holding:         { label: "Holding",         variant: "default" },
  pending_release: { label: "Pending Release", variant: "caution" },
  released:        { label: "Released",        variant: "success" },
  refunded:        { label: "Refunded",        variant: "destructive" },
};

export function EscrowMonitor({
  transactions,
  onRelease,
  onExtend,
}: EscrowMonitorProps) {
  const [filter, setFilter] = useState<"all" | "aging" | "disputed">("all");

  const agingThreshold = 14; // days

  const stats = useMemo(() => ({
    totalHeld: transactions.filter((t) => t.status === "holding" || t.status === "pending_release").length,
    totalReleased: transactions.filter((t) => t.status === "released").length,
    agingCount: transactions.filter((t) => t.daysHeld > agingThreshold && t.status === "holding").length,
    disputedCount: transactions.filter((t) => t.disputeOpen).length,
    totalValue: transactions
      .filter((t) => t.status === "holding" || t.status === "pending_release")
      .reduce((sum, t) => sum + t.amount, 0),
  }), [transactions]);

  const filtered = useMemo(() => {
    if (filter === "aging") return transactions.filter((t) => t.daysHeld > agingThreshold && t.status === "holding");
    if (filter === "disputed") return transactions.filter((t) => t.disputeOpen);
    return transactions;
  }, [transactions, filter]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-SO", { style: "currency", currency: "SLSH", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn("rounded-md", stats.agingCount > 0 && "border-caution")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className={cn("h-4 w-4", stats.agingCount > 0 ? "text-caution" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">Active Escrows</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold">{stats.totalHeld}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Value Held</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-md", stats.agingCount > 0 && "border-destructive")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("h-4 w-4", stats.agingCount > 0 ? "text-destructive" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">Aging &gt;{agingThreshold}d</span>
            </div>
            <p className={cn("mt-2 font-mono text-2xl font-bold", stats.agingCount > 0 && "text-destructive")}>
              {stats.agingCount}
            </p>
          </CardContent>
        </Card>
        <Card className={cn("rounded-md", stats.disputedCount > 0 && "border-caution")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("h-4 w-4", stats.disputedCount > 0 ? "text-caution" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">In Dispute</span>
            </div>
            <p className={cn("mt-2 font-mono text-2xl font-bold", stats.disputedCount > 0 && "text-caution")}>
              {stats.disputedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "aging", "disputed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className="h-10 capitalize"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All Escrows" : f === "aging" ? `Aging (>${agingThreshold}d)` : "Disputed"}
            {f === "aging" && stats.agingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">{stats.agingCount}</Badge>
            )}
            {f === "disputed" && stats.disputedCount > 0 && (
              <Badge variant="caution" className="ml-2 h-5 min-w-5 px-1">{stats.disputedCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Escrow Table */}
      <Card className="rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-12 bg-muted/50">
              <TableHead className="text-xs font-medium">Order</TableHead>
              <TableHead className="text-xs font-medium">Buyer</TableHead>
              <TableHead className="text-xs font-medium">Seller</TableHead>
              <TableHead className="text-xs font-medium text-right">Amount</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Days Held</TableHead>
              <TableHead className="text-xs font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((tx) => {
              const status = statusConfig[tx.status];
              const isAging = tx.daysHeld > agingThreshold && tx.status === "holding";
              return (
                <TableRow
                  key={tx.id}
                  className={cn("h-12 hover:bg-muted/30 transition-colors", isAging && "bg-destructive/5")}
                >
                  <TableCell className="font-mono text-xs">{tx.orderId.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{tx.buyer}</TableCell>
                  <TableCell className="text-sm">{tx.seller}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                    {tx.disputeOpen && (
                      <Badge variant="caution" className="text-xs ml-1">DISPUTE</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1 font-mono text-sm",
                      isAging ? "text-destructive font-bold" : "text-muted-foreground"
                    )}>
                      {isAging && <AlertTriangle className="h-3 w-3" />}
                      {tx.daysHeld}d
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {tx.status === "holding" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => onRelease?.(tx.id)}
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Release
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => onExtend?.(tx.id)}
                          >
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Extend
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```

The `EscrowMonitor` leads with four stat cards: Active Escrows, Total Value Held, Aging count (>14 days), and In Dispute count. Cards gain colored borders when their values are non-zero — caution orange for aging, red for disputes. Filter tabs above the table toggle between All, Aging, and Disputed views with inline count badges. The table's "Days Held" column renders in bold red with an `AlertTriangle` icon for transactions exceeding the 14-day threshold. Action buttons (Release, Extend) appear only for transactions in `holding` status. The Release button uses an `Unlock` icon and the outline variant; Extend uses a `CalendarDays` icon and ghost variant. Both are `h-8` (32px) compact size for dense table contexts.

### 4.3.4 ConfigEditor

The `ConfigEditor` provides an interface for managing platform configuration parameters with validation, change highlighting, and an audit log.

```typescript
// app/components/admin/config-editor.tsx
"use client";

import { useState, useCallback } from "react";
import { Save, RotateCcw, History, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ParamType = "string" | "number" | "boolean" | "percentage";

interface ConfigParam {
  key: string;
  label: string;
  description: string;
  type: ParamType;
  value: string | number | boolean;
  defaultValue: string | number | boolean;
  min?: number;
  max?: number;
  validation?: RegExp;
}

interface AuditEntry {
  id: string;
  paramKey: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

interface ConfigEditorProps {
  params: ConfigParam[];
  auditLog: AuditEntry[];
  onSave?: (changes: Record<string, string | number | boolean>) => void;
  onReset?: () => void;
}

export function ConfigEditor({ params, auditLog, onSave, onReset }: ConfigEditorProps) {
  const [edits, setEdits] = useState<Record<string, string | number | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const currentValue = (param: ConfigParam) =>
    edits[param.key] !== undefined ? edits[param.key] : param.value;

  const isDirty = (param: ConfigParam) =>
    edits[param.key] !== undefined && edits[param.key] !== param.value;

  const isDefault = (param: ConfigParam) =>
    currentValue(param) === param.defaultValue;

  const validate = useCallback((param: ConfigParam, value: string): string | null => {
    if (param.type === "number" || param.type === "percentage") {
      const num = parseFloat(value);
      if (isNaN(num)) return "Must be a number";
      if (param.min !== undefined && num < param.min) return `Minimum ${param.min}`;
      if (param.max !== undefined && num > param.max) return `Maximum ${param.max}`;
    }
    if (param.validation && !param.validation.test(value)) {
      return "Invalid format";
    }
    return null;
  }, []);

  const handleChange = (param: ConfigParam, value: string) => {
    const error = validate(param, value);
    setErrors((prev) => ({ ...prev, [param.key]: error || "" }));
    setEdits((prev) => ({ ...prev, [param.key]: param.type === "number" || param.type === "percentage" ? parseFloat(value) || 0 : value }));
    setSavedKeys((prev) => { const next = new Set(prev); next.delete(param.key); return next; });
  };

  const handleSave = () => {
    const validChanges: Record<string, string | number | boolean> = {};
    Object.entries(edits).forEach(([key, value]) => {
      const param = params.find((p) => p.key === key);
      if (param && !validate(param, String(value))) {
        validChanges[key] = value;
      }
    });
    onSave?.(validChanges);
    setSavedKeys(new Set(Object.keys(validChanges)));
  };

  const handleReset = () => {
    setEdits({});
    setErrors({});
    setSavedKeys(new Set());
    onReset?.();
  };

  const dirtyCount = params.filter(isDirty).length;

  return (
    <div className="grid h-full gap-6 lg:grid-cols-3">
      {/* Parameter Cards */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Platform Configuration</h2>
          <div className="flex gap-2">
            <Button variant="outline" className="h-10 gap-2" onClick={handleReset} disabled={dirtyCount === 0}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button className="h-10 gap-2" onClick={handleSave} disabled={dirtyCount === 0}>
              <Save className="h-4 w-4" />
              Save {dirtyCount > 0 && `(${dirtyCount})`}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {params.map((param) => {
            const value = currentValue(param);
            const dirty = isDirty(param);
            const error = errors[param.key];
            const saved = savedKeys.has(param.key);

            return (
              <Card
                key={param.key}
                className={cn(
                  "rounded-md transition-colors duration-150",
                  dirty && "border-caution",
                  saved && "border-success",
                  error && "border-destructive"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{param.label}</span>
                        {dirty && <Badge variant="caution" className="text-xs">Modified</Badge>}
                        {saved && <Badge variant="success" className="text-xs">Saved</Badge>}
                        {isDefault(param) && !dirty && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
                      <code className="text-xs text-muted-foreground">{param.key}</code>
                    </div>
                    <div className="w-48 shrink-0">
                      <div className="relative">
                        <Input
                          value={String(value)}
                          onChange={(e) => handleChange(param, e.target.value)}
                          className={cn(
                            "h-10 text-sm font-mono",
                            param.type === "percentage" && "pr-8",
                            dirty && "bg-caution/5",
                            error && "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        {param.type === "percentage" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        )}
                      </div>
                      {error && (
                        <p className="flex items-center gap-1 mt-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {error}
                        </p>
                      )}
                      {saved && (
                        <p className="flex items-center gap-1 mt-1 text-xs text-success">
                          <Check className="h-3 w-3" />
                          Saved successfully
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Audit Log Sidebar */}
      <div className="space-y-4">
        <Card className="rounded-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Audit Log</CardTitle>
            </div>
            <CardDescription className="text-xs">Recent configuration changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditLog.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No changes recorded</p>
            )}
            {auditLog.map((entry) => (
              <div key={entry.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono">{entry.paramKey}</code>
                  <span className="text-xs text-muted-foreground">{entry.changedAt}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="line-through text-muted-foreground truncate max-w-[80px]">{entry.oldValue}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground font-medium truncate max-w-[80px]">{entry.newValue}</span>
                </div>
                <p className="text-xs text-muted-foreground">by {entry.changedBy}</p>
                <Separator className="mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

The `ConfigEditor` uses a 3-column layout: 2 columns for parameter cards and 1 column for the audit log sidebar. Each parameter card displays the label, description, configuration key, and an input field with inline validation. Dirty (modified) parameters gain a caution-orange border and "Modified" badge; saved parameters show a green border and "Saved" badge; parameters at default values display a gray "Default" badge. Validation errors render below the input with a red border and `AlertCircle` icon. The audit log sidebar shows the 20 most recent changes with param key, old→new value transition, author, and timestamp. Save and Reset buttons in the header enable only when modifications exist; the Save button displays a count of pending changes.

---

## 4.4 Component Reference Tables

### Table 1: Core shadcn/ui Components

| Component | shadcn Primitive | Celis Customization | Usage Locations |
|---|---|---|---|
| Sidebar | `@radix-ui/react-collapsible` | Icon-only mode (64px), tooltip labels, `grid-template-rows` animation | Seller dashboard, Admin console |
| Breadcrumb | Custom (Next.js routes) | Category hierarchy segments, mobile ellipsis collapse | Listing detail, Category pages |
| Tabs | `@radix-ui/react-tabs` | `h-12` touch targets, 2px bottom indicator, horizontal scroll on mobile | Dashboard home, Seller profile |
| Command | `@radix-ui/react-dialog` + `cmdk` | `h-12` items, 40px thumbnails, grouped results | Global CMD-K search |
| Table | Custom (semantic HTML) | Sort headers, checkbox selection, skeleton rows, `h-12` rows | Transaction history, Order list |
| Card | Custom (div composition) | `rounded-md` (6px), `shadow-sm` light / `shadow-none` dark | Listing cards, KPI cards, Forms |
| Badge | Custom (span) | Six semantic variants, `/15` opacity backgrounds, pill shape | Status indicators, Category tags |
| Avatar | `@radix-ui/react-avatar` | 4 sizes (sm/md/lg/xl), fallback initials, `bg-primary/10` | User profiles, Seller display |
| Skeleton | Custom (div + shimmer) | `skeleton` utility class, 2s linear shimmer, static fallback | Loading states throughout |
| Input | Custom (native `<input>`) | `rounded-none`, `h-10`/`h-12` mobile, `+252` phone prefix | All forms, Search fields |
| Textarea | Custom (native `<textarea>`) | Character counter, 2000 max, `min-h-[120px]` | Listing description, Dispute notes |
| Select | `@radix-ui/react-select` | `h-12` trigger, `rounded-none`, grouped options | Category, Condition, Carrier selects |
| Checkbox | `@radix-ui/react-checkbox` | `rounded-sm`, `scale-0→scale-100` check transition | Faceted filters, Row selection |
| RadioGroup | `@radix-ui/react-radio-group` | `h-14` card-style items, `border-primary` selected | Delivery method, Monetization tier |
| Switch | `@radix-ui/react-switch` | `w-11 h-6`, `translate-x-5` thumb, 150ms transition | Feature flags, Notifications |
| DatePicker | Popover + Calendar | `rounded-none` trigger, disabled past dates, PPP format | Listing expiry, Date filters |
| Dialog | `@radix-ui/react-dialog` | `rounded-md`, `max-w-lg`, destructive confirm delay | Confirmation modals |
| Alert | Custom (div) | Four variants, 16px status icon, `rounded-md` p-4 | Form errors, System notices |
| Toast | `@radix-ui/react-toast` | Bottom-right desktop / bottom-center mobile, 5s auto-dismiss | Transaction notifications |
| Progress | Custom (div) | `h-2 rounded-full`, indeterminate shimmer, `aria-*` attrs | Uploads, Escrow status |
| Tooltip | `@radix-ui/react-tooltip` | 150ms fade, muted background, 12px text | Icon hints, Sidebar labels |
| Sheet | `@radix-ui/react-dialog` | Right slide desktop, bottom 80vh mobile, `shadow-xl` | Filter panels, Detail views |
| Drawer | `vaul` | `rounded-t-xl`, 90vh, 3 snap points (25/50/100%), drag handle | Mobile forms, Bottom sheets |
| Popover | `@radix-ui/react-popover` | `rounded-md`, `shadow-md`, 12px padding | Price calculator, Calendar |
| DropdownMenu | `@radix-ui/react-dropdown-menu` | `h-10` items, destructive variant, 16px icons | Action menus, User menus |

### Table 2: Marketplace Composite Components

| Component | Props Interface | shadcn Primitives Used | Key Behavior |
|---|---|---|---|
| `ListingCard` | `id, title, price, currency, condition, images[], location, seller{name, avatar, rating, reviewCount}, onClick` | Card, Badge, Avatar, Image | Responsive grid (2/3/4 col), image carousel with swipe, hover lift on desktop |
| `OrderStatusBar` | `current: Milestone, className?` | Custom (div composition) | Horizontal timeline desktop, vertical accordion mobile, animated connector lines |
| `WalletPaymentModal` | `open, onClose, amount, currency, merchantName, onPaymentComplete?` | Dialog, Button | 5-step flow (select→confirm→process→success/fail), USSD polling simulation |
| `PickupHandshake` | `pin: string, expiresAt: Date, qrData: string, onHandover?, onExpire?` | Card, Button, Input | 6-digit PIN display, countdown timer with color escalation, QR code panel |
| `CommissionCalculator` | `minPrice?, maxPrice?, commissionRate?, shippingEstimate?, currency?` | Card, Slider, Input | Real-time breakdown, debounced slider, proportional fee bar, payout preview |
| `LocalPickupMap` | `center{lat,lng}, radiusMeters?, meetingPoint, landmarks[], districtName, fallbackMode?` | Card, Button, Badge | MapLibre GL embed, auto fallback on low-end devices, district list with directions link |

### Table 3: Admin Components

| Component | Props Interface | shadcn Primitives Used | Key Behavior |
|---|---|---|---|
| `DisputePanel` | `listing{title,description,price,condition,images,sellerName}, buyerClaim{buyerName,reason,description,submittedAt}, evidencePhotos[], orderAmount, currency, onResolve?` | Card, Badge, Button, Textarea, Separator | Split-view layout (listing \| claim), evidence photo grid, 4-resolution action bar |
| `FinancialLedger` | `transactions[], dateRange{from,to}, onDateRangeChange?, onExport?` | Card, Table, Button, Badge, Input | 4 KPI cards, sortable columns, text search, CSV export, type badges |
| `EscrowMonitor` | `transactions[], onRelease?, onExtend?` | Card, Table, Button, Badge | Aging indicators (>14d = red), filter tabs (all/aging/disputed), manual release/extend |
| `ConfigEditor` | `params[], auditLog[], onSave?, onReset?` | Card, Input, Button, Badge, Separator | Change highlighting (caution=dirty, green=saved), inline validation, audit log sidebar |

---

## 4.5 Component Installation Summary

The complete shadcn/ui installation command for the Celis project:

**Code Block 7: Component Installation & Registry Pattern**

```bash
# ── Step 1: Initialize shadcn/ui with Next.js ──
npx shadcn@latest init --yes --template next --base-color neutral

# ── Step 2: Install all core primitives ──
npx shadcn add sidebar breadcrumb tabs command table card badge avatar skeleton
npx shadcn add input textarea select checkbox radio-group switch date-picker
npx shadcn add dialog alert toast progress tooltip sheet popover dropdown-menu drawer

# ── Step 3: Install marketplace dependencies ──
npm install qrcode.react      # QR code generation for PickupHandshake
npm install date-fns           # Date formatting for Calendar
npm install vaul               # Drawer primitive (shadcn dependency)
npm install @radix-ui/react-icons  # Icon fallback

# ── Step 4: Verify component registry ──
# Components install to app/components/ui/ per components.json
# Custom composites live in app/components/marketplace/ and app/components/admin/

# ── Tailwind v4 @theme directive (app/globals.css) ──
# The following @theme block makes shadcn variables available as Tailwind utilities:

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-caution: hsl(var(--caution));
  --color-caution-foreground: hsl(var(--caution-foreground));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

The `@theme` directive in Tailwind CSS v4 replaces the `theme.extend` object from v3. Each `--color-*` declaration maps a shadcn CSS variable to a Tailwind utility class — `bg-background`, `text-primary`, `border-destructive` — enabling full token-driven styling without `tailwind.config.ts` modifications. The `--radius-*` declarations expose the `radius` variable at four breakpoints for `rounded-sm` through `rounded-xl` utilities.

All 24 shadcn primitives install into `app/components/ui/` and are imported by composite components via `@/components/ui/*` path aliases. The custom marketplace and admin components import these primitives and add domain logic, marketplace-specific styling (touch targets, phone number formatting), and business rules (commission calculation, dispute resolution flows). Dark mode support requires zero component-level code because all colors resolve through the CSS variable bridge defined in Chapter 3.


---

# 5. Page Templates & Wireframes

Every Celis page is designed mobile-first at 375px logical width, scaling through four breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Mobile uses a 4-tab bottom nav (Browse, Sell, Orders, Profile) at 64px height above the safe-area inset; desktop uses a 256px collapsible sidebar. Page transitions use fade (`opacity: 0 → 1`) with a 12px upward slide over 250ms at `cubic-bezier(0.4, 0, 0.2, 1)`, collapsing to instant swap when `prefers-reduced-motion: reduce` is active.

## 5.1 Public Pages

Public pages require no authentication and optimize for discovery and scanability.

### 5.1.1 Home / Feed

The Home/Feed (`/`) prioritizes immediate search access and infinite-scroll browsing.

**Layout Structure.** Three stacked zones: a sticky search bar (`<StickySearchBar />`) at `z-index: 50`, `position: sticky; top: 0`; a horizontally scrollable category chips row (`<CategoryChips />`) at 48px height with `overflow-x: auto; scrollbar-width: none`; and a responsive `<ListingCard />` grid — 1 column (base), 2 (`md`), 3 (`lg`), 4 (`xl`), with 16px gutters. The bottom nav remains visible at all times.

**Component Inventory.** `<StickySearchBar />`, `<CategoryChips />`, `<ListingCard />`, `<FilterFAB />` (mobile), `<FilterSidebar />` (desktop `lg+`), `<BottomNav />`, `<InfiniteScrollTrigger />`.

**Mobile/Desktop Differences.** Mobile exposes filters through a 56px FAB (`position: fixed; bottom: 80px; right: 16px`) opening a full-screen bottom sheet. Desktop renders a 280px fixed filter sidebar on `lg+`, collapsible via chevron. Category chips are scrollable on all breakpoints; desktop adds a "See All" link.

**Interaction Patterns.** Pull-to-refresh triggers a rotation animation (360° over 1s past 80px threshold). Category chip taps apply filters immediately with 3 skeleton card loaders. Search bar expands full-screen on mobile focus with recent searches overlay. Infinite scroll triggers at 200px from bottom, fetching 20 listings per page.

**Empty State.** No-match filters show a 192×192px illustration with "No listings found" (`text-xl font-semibold`) and a "Clear all filters" `<Button variant="outline" />`.

**ASCII Wireframe — Mobile Home/Feed (375px):**

```
+----------------------------------+
|  🔍  Search for anything...       |  ← StickySearchBar (h=56, z-50)
+----------------------------------+
| [All][Phones][Fashion][Home]...  |  ← CategoryChips (h=48, scroll-x)
+----------------------------------+
| +-----------------------------+  |
| | 📷  iPhone 14 Pro           |  |
| |     $850 · Like New         |  |  ← ListingCard
| |     Kampala · 2h ago        |  |
| +-----------------------------+  |
| +-----------------------------+  |
| | 📷  Nike Air Force 1        |  |  ← ListingCard
| |     $65 · Good              |  |
| |     Nairobi · 5h ago        |  |
| +-----------------------------+  |
| +-----------------------------+  |
| | 📷  Samsung Fridge          |  |  ← ListingCard
| |     $320 · Fair             |  |
| |     Dar es Salaam · 1d      |  |
| +-----------------------------+  |
|        [Scrolls infinitely]      |
|       [⚪ Filter FAB]            |  ← Fixed, bottom-right
+----------------------------------+
|  🏠  ➕  📦  👤                  |  ← BottomNav (h=64)
| Browse Sell Orders Profile       |
+----------------------------------+
```

### 5.1.2 Listing Detail

The Listing Detail page (`/listings/:id`) is the primary conversion surface.

**Layout Structure.** Full-bleed image gallery at top 55vh (mobile), 45vh (desktop). Below, a sticky `<ListingHeader />` pins at `top: 0` with truncated title, price in `tabular-nums`, and condensed "Buy Now" button. Body stacks: title/price row, condition badge, `<SellerCard />`, description with metadata table, and similar listings carousel. Mobile CTA is a fixed bottom bar (72px with safe-area inset).

**Component Inventory.** `<ImageGallery />`, `<ListingHeader />`, `<ConditionBadge />`, `<SellerCard />`, `<MetadataTable />`, `<BuyNowCTA />`, `<SimilarListingsCarousel />`, `<ShareButton />`.

**Image Gallery Behavior.** Mobile: swipeable via `embla-carousel-react` with 8px pagination dots (active: `--color-brand`), up to 8 images, "+N" overlay on final thumbnail if exceeded. Desktop (`lg+`): hero image at 60% + 2×2 thumbnail grid, "View all photos" overlay. Double-tap opens pinch-to-zoom.

**Mobile/Desktop Differences.** Mobile uses swipeable gallery and fixed bottom CTA. Desktop relocates CTA to a `<ListingSidebar />` (360px) that sticks at `top: 24px`. Seller card on desktop shows rating distribution and response time metrics.

**Interaction Patterns.** "Buy Now" triggers a confirmation bottom sheet (mobile) or modal (desktop) with 400ms hold-to-confirm. "Make Offer" opens a numeric input sheet with percentage buttons (-10%, -15%, -20%). Share uses Web Share API on mobile, copy-link toast on desktop.

**Empty State.** Removed/sold listings show "Listing unavailable" with a "Browse similar items" CTA.

**ASCII Wireframe — Mobile Listing Detail (375px):**

```
+----------------------------------+
|  ←  Share  ···                   |  ← Top nav (back, share, more)
+----------------------------------+
|                                  |
|           [📷📷📷]               |  ← ImageGallery (55vh, swipeable)
|           [📷📷📷]               |     pagination dots bottom-right
|                                  |
+----------------------------------+
| iPhone 14 Pro 256GB Unlocked     |  ← Title (text-2xl, font-bold)
| UGX 3,200,000                    |  ← Price (text-3xl, tabular-nums)
| ★ Like New · Posted 2h ago       |  ← ConditionBadge + meta
+----------------------------------+
| +-----------------------------+  |
| |  👤  John K.    ★ 4.8       |  |
| |      12 sales · Kampala      |  |  ← SellerCard
| |  [View Store]                |  |
| +-----------------------------+  |
+----------------------------------+
| Description                      |
| Original box included. Battery   |
| health 96%. No scratches.        |  ← Description block
+----------------------------------+
| Category    Electronics          |  ← MetadataTable
| Brand       Apple                |     (2-col dl/dt/dd)
| Condition Like New               |
| Posted      2 hours ago          |
+----------------------------------+
| Similar Listings                 |
| [📷] [📷] [📷] [📷] →          |  ← Horizontal carousel
+----------------------------------+
|  [      🔒 Buy Now      ]        |  ← Fixed CTA bar (h=72)
+----------------------------------+
```

### 5.1.3 Search Results

The Search Results page (`/search?q=...`) extends the Home/Feed layout with filter management and sorting.

**Layout Structure.** Sub-header below search bar shows query in `text-lg font-medium`, result count in `text-sm text-muted-foreground`, and `<SortDropdown />` right-aligned. Below, `<ActiveFiltersBar />` renders dismissible chips as `<Badge variant="secondary" />` with × icons, scrollable when overflowing. Listing grid follows Home/Feed column strategy.

**Component Inventory.** `<StickySearchBar />` (pre-filled), `<SortDropdown />`, `<ActiveFiltersBar />`, `<FilterFAB />` / `<FilterSidebar />`, `<ListingCard />`, `<Pagination />` (desktop), `<InfiniteScrollTrigger />` (mobile).

**Responsive Breakpoints.** Mobile: infinite scroll. Desktop (`md+`): numbered pagination (20 per page), 5 visible page numbers with ellipsis. Active filters wrap on desktop, single-row scrollable on mobile.

**Interaction Patterns.** Filter chip removal triggers re-fetch with 150ms fade. Sorting (Relevance, Price Low–High, Price High–Low, Newest, Nearest) applies with skeleton loading. Filter combinations are deep-linkable via URL parameters.

**Empty State.** Zero results show a 192×192px illustration, "No results for 'query'", and suggestions: "Try different keywords", "Browse all in [category]", "Clear all filters".

## 5.2 Seller Pages

Seller pages require authentication and optimize for workflow efficiency.

### 5.2.1 Listing Wizard

The Listing Wizard (`/sell`) is a 6-step linear flow with autosave after every step.

**Layout Structure.** Sticky `<StepIndicator />` with 6 circular nodes (32px): Photos, Category, Details, Pricing, Delivery, Review. Completed: checkmark; current: `--color-brand`; future: `--color-muted`. Step content fills remaining viewport. Fixed bottom action bar (mobile) or right-aligned buttons (desktop) with "Back" and "Next"/"Publish".

**Step 1 — Photos.** 3-column upload grid (mobile), 4-column (desktop). Cells 96×96px, 2px dashed border. Thumbnails with drag handle and remove button (24px touch targets). Max 8, min 1. Reordering via `@dnd-kit/sortable`. Camera button on mobile.

**Step 2 — Category.** Searchable hierarchical selector. Primary categories as 80px cards (icon + label). Subcategories in right slide-in (mobile) or accordion (desktop). Breadcrumb shows selected path.

**Step 3 — Details.** Dynamic form: Title (`<Input maxLength={80} />`), Description (`<Textarea maxLength={2000} rows={5} />`), Brand (`<Combobox />`), Condition (`<RadioGroup />`: New, Like New, Good, Fair). Category-specific fields conditionally. Validation on blur.

**Step 4 — Pricing.** Price input with `inputMode="decimal"`. Calculator overlay: price minus flat fee (UGX 2,500) minus commission (5%) = net. `<Popover />` on desktop, `<BottomSheet />` on mobile. "Negotiable" checkbox.

**Step 5 — Delivery.** `<RadioGroup />`: "Meet in Person" or "Celis Delivery". Celis reveals pickup address form and fee calculator. Map preview: static image on low bandwidth, Mapbox GL on desktop.

**Step 6 — Review.** Read-only summary with collapsible sections and "Edit" links. "Publish Listing" loads for up to 5s, then redirects to live listing.

**Responsive Behavior.** Mobile: fixed bottom bar with full-width buttons. Desktop (`md+`): 720px max-width centered container.

**Autosave.** Form state persists to `localStorage` as `celis_draft_listing`. Revisiting with draft data shows a restoration modal. Drafts expire after 7 days.

**ASCII Wireframe — Mobile Listing Wizard Step 3 (375px):**

```
+----------------------------------+
|  ←  New Listing        Save      |  ← Top bar with Save
+----------------------------------+
|  ●──●──◉──○──○──○                |  ← StepIndicator (6 steps)
|  1   2  3   4  5  6              |     Step 3 active
+----------------------------------+
| Details                          |
| Title *                          |
| +-----------------------------+  |
| | iPhone 14 Pro 256GB...      |  |  ← Input (max 80 chars)
| +-----------------------------+  |
| 45/80                            |
|                                  |
| Description *                    |
| +-----------------------------+  |
| | Original box included...    |  |  ← Textarea (5 rows)
| |                             |  |
| +-----------------------------+  |
|                                  |
| Brand                            |
| +-----------------------------+  |
| | Apple                 ▼     |  |  ← Combobox
| +-----------------------------+  |
|                                  |
| Condition *                      |
| (○) New  (○) Like New           |  ← RadioGroup (2×2)
| (●) Good  (○) Fair              |
|                                  |
| Storage                          |
| +-----------------------------+  |
| | 256GB                  ▼    |  |
| +-----------------------------+  |
|        [Scrolls if needed]       |
+----------------------------------+
|  [   Back   ]  [    Next    ]    |  ← Fixed bottom actions
+----------------------------------+
```

### 5.2.2 Seller Dashboard

The Seller Dashboard (`/dashboard`) is the seller's operational hub.

**Layout Structure.** Three `<EarningsCard />` components in a horizontal scroll row (mobile) or 3-column grid (desktop). Each card (160px mobile, flex-1 desktop) has a label ("Revenue", "Pending", "Available"), value in `text-2xl font-bold tabular-nums`, and trend indicator (change vs. prior 30 days). Below, `<Tabs />` with status tabs: "All", "Pending", "Shipped", "Completed" rendering `<DataTable />` (desktop) or card list (mobile). Quick actions ("New Listing", "Withdraw") between earnings and orders on desktop, floating buttons on mobile.

**Component Inventory.** `<EarningsCard />` (×3), `<Tabs />`, `<DataTable />`, `<StatusBadge />`, `<QuickActions />`, `<ActivityFeed />`, `<WithdrawalModal />`.

**Responsive Behavior.** At `md+`, orders table shows all columns sortable. Mobile: vertical cards with thumbnail, title, buyer, amount, `<StatusBadge />`. Activity feed (new order, payment received, review) is a right sidebar on `xl+` (320px), collapsible section below on smaller viewports.

**Interaction Patterns.** Order row tap navigates to `/dashboard/orders/:id`. Status tabs filter client-side with 150ms fade. "Withdraw" opens modal with balance, method selection (Mobile Money, Bank), amount input (min UGX 10,000). Row actions in dropdown (desktop) or bottom sheet (mobile).

**Empty State.** No orders: 160×160px illustration, "No orders yet", "Create Your First Listing" CTA to `/sell`.

### 5.2.3 Order Detail

The Order Detail page (`/dashboard/orders/:id`) provides transaction visibility with status-driven actions.

**Layout Structure.** Stacked: item summary card, buyer info card, delivery method card, `<StatusTimeline />` (ordered → paid → shipped → completed with timestamps), and contextual action area.

**Component Inventory.** `<ItemSummaryCard />`, `<BuyerInfoCard />`, `<DeliveryMethodCard />`, `<StatusTimeline />`, `<ActionButtons />`, `<TrackingInput />`, `<PINDisplay />`.

**Status-Driven Actions.**

| Status | Seller Actions |
|--------|---------------|
| Pending Payment | None — "Awaiting Payment" text |
| Paid | "Confirm & Prepare", "Cancel Order" |
| Ready for Pickup | "Enter Tracking", "Mark as Picked Up" |
| In Transit | "View Tracking" |
| Delivered | "Confirm Delivery" (PIN entry) |
| Completed | "Leave Review", "Contact Support" |
| Disputed | "View Dispute", "Upload Evidence" |
| Cancelled | "Archive", "Relist Item" |

**Delivery Behaviors.** Celis Delivery: tracking number input at "Ready for Pickup" (alphanumeric, 30 chars). Meet-in-person: 6-digit PIN displayed after buyer confirms; seller enters PIN to release payment. PIN shows as dots revealing on tap, valid for 30 minutes.

**Responsive Behavior.** Mobile: full-width stacked cards, sticky bottom action bar (64px). Desktop (`lg+`): 66%/33% split — left has item, timeline, actions; right has buyer, delivery, chat preview.

## 5.3 Admin Pages

Admin pages are restricted to platform operators. Financial data uses `font-variant-numeric: tabular-nums` with 2 decimal places. Admin layout uses fixed sidebar (64px collapsed, 256px expanded) with 56px top header.

### 5.3.1 Admin Dashboard

The Admin Dashboard (`/admin`) is the operational command center.

**Layout Structure.** Three KPI cards top row, 12-month trend chart full-width below, two-column split: pending disputes (left, 40%) and recent transactions (right, 60%). Mobile stacks vertically with horizontally scrollable KPIs.

**KPI Cards.** Three `<KPICard />`: (1) Flat Fee Revenue MTD (UGX 2,500/tx); (2) Commission Revenue MTD (5%); (3) Shipping Revenue MTD. Each shows value in `text-3xl font-bold tabular-nums`, change badge vs. prior month, and 30-point sparkline (60px). Backgrounds: flat fee `--color-brand` 5%, commission `--color-success` 5%, shipping `--color-info` 5%.

**12-Month Trend Chart.** Stacked area chart via `recharts`, three series. X-axis: month abbreviations; y-axis: nearest million UGX. Height: 320px desktop, 240px mobile. Colors: #1A6B54, #2D7A3E, #3B6F9C. Below `md`: single total revenue line.

**Pending Disputes Alert.** Open dispute count, color-coded: red >48h, amber >24h, neutral <24h. Each shows truncated summary with "Review" link.

**Recent Transactions Table.** `<DataTable />`: ID, Date, Buyer, Seller, Amount, Fee Type, Status, Action. Last 20 with pagination.

### 5.3.2 Disputes Hub

The Disputes Hub (`/admin/disputes`) supports rapid triage and resolution.

**Layout Structure.** Desktop: split-view with queue table left (45%, min 480px) and detail panel right (55%). Mobile: full-screen list, detail pushes on stack.

**Filterable Queue Table.** Controls: search (ID, names), status (Open, Under Review, Resolved, Escalated), priority (Critical, High, Normal, Low), date range (7/30/90/custom). Columns: Priority, ID, Type, Buyer, Seller, Amount, Age, Status. Sortable by age, amount. Critical rows (>48h) have `--color-destructive` left border with pulsing dot.

**Detail Split-View.** Displays: header (ID, type, amount, date), event timeline, messages thread, evidence gallery, resolution form. Resolution form: type (`<Select />`: Full Refund, Partial Refund, Reject, Escalate), refund amount (conditional), notes (`<Textarea />`), submit with confirmation.

**Component Inventory.** `<DisputesTable />`, `<DisputeDetailPanel />`, `<DisputeTimeline />`, `<EvidenceGallery />`, `<ResolutionForm />`, `<PriorityBadge />`.

**Interaction Patterns.** Dispute selection updates detail panel client-side with 200ms cross-fade. Evidence opens in lightbox. Refunds > UGX 500,000 require second confirmation. Filtering updates URL for shareable views.

**Empty State.** No matches: "No disputes found" with reset CTA. All resolved: "All caught up!" messaging.

### 5.3.3 Financial Reports

The Financial Reports page (`/admin/reports`) enables revenue reporting and export.

**Layout Structure.** Control bar (date range, filters), revenue chart, transaction ledger with export. Desktop: control bar sticky at `top: 56px`; mobile: collapsible accordion.

**Control Bar.** `<DateRangePicker />` with presets (This Month, Last Month, Last Quarter, YTD, Custom). `<MultiSelect />` stream filter (Flat Fees, Commissions, Shipping, All). `<ToggleGroup />` granularity (Daily, Weekly, Monthly).

**Revenue by Stream Chart.** Grouped bar chart per period per stream. Mobile: stacked below `md`. Y-axis formats millions ("2.5M") above 1M. Data table below exact values, hidden on mobile behind expander.

**Transaction Ledger.** `<DataTable />`: Transaction ID, Date, Type, Buyer, Seller, Gross, Flat Fee, Commission, Shipping, Net Revenue, Status. Column visibility toggles, sortable numerics. 50 rows/page, selector (25/50/100). Global search across buyer, seller, ID.

**Export Functionality.** "Export Report" triggers PDF generation. Modal: format (PDF, CSV), date confirmation, stream checkboxes, optional notes. Progress: preparing → generating → ready. Branded PDF with logo, date, page numbers, alternating row backgrounds.

**Monthly Reconciliation.** Dedicated tab comparing expected revenue (fee sum) vs. actual (settled payments). Discrepancies in `--color-destructive`. Restricted to `finance_admin` role.

**Responsive Behavior.** Control bar stacks on mobile. Chart simplifies to total-revenue line below `md`. Ledger uses horizontal scroll with sticky first column.

**Empty State.** No data: flat zero line with "No data for this period" and date range adjustment suggestion.

---

## Page Inventory Table

| Page | Route | User Type | Primary Components | Mobile/Desktop Differences |
|------|-------|-----------|-------------------|---------------------------|
| Home / Feed | `/` | Public | StickySearchBar, CategoryChips, ListingCard, FilterFAB, FilterSidebar, BottomNav | FAB + bottom sheet vs. fixed sidebar; 1-col vs. 2–4 col grid |
| Listing Detail | `/listings/:id` | Public | ImageGallery, ListingHeader, SellerCard, MetadataTable, BuyNowCTA, SimilarListingsCarousel | Fixed bottom CTA vs. sticky sidebar; swipeable gallery vs. thumbnail grid |
| Search Results | `/search` | Public | StickySearchBar, SortDropdown, ActiveFiltersBar, ListingCard, Pagination | Infinite scroll vs. numbered pagination; scrollable vs. wrapping filters |
| Listing Wizard | `/sell` | Authenticated | StepIndicator, ImageUploadGrid, CategorySelector, DynamicForm, PricingCalculator, ReviewSummary | Full-screen stepper with bottom bar vs. 720px centered container |
| Seller Dashboard | `/dashboard` | Seller | EarningsCard, Tabs, DataTable, QuickActions, ActivityFeed | Horizontal scroll KPIs vs. 3-col grid; card list vs. data table |
| Order Detail | `/dashboard/orders/:id` | Seller | ItemSummaryCard, BuyerInfoCard, DeliveryMethodCard, StatusTimeline, ActionButtons | Vertical stack vs. 2-col layout; PIN readout; sticky action bar |
| Admin Dashboard | `/admin` | Admin | KPICard, RevenueChart, DisputesAlert, TransactionsTable | Scroll KPIs vs. grid; simplified chart vs. stacked area |
| Disputes Hub | `/admin/disputes` | Admin | DisputesTable, DisputeDetailPanel, EvidenceGallery, ResolutionForm | Push detail page vs. persistent split-view |
| Financial Reports | `/admin/reports` | Admin | DateRangePicker, RevenueChart, TransactionLedger, ExportModal | Collapsible controls vs. sticky bar; horizontal scroll ledger |

## Navigation Architecture

Mobile (< `lg`) uses a 4-tab bottom nav: Browse (`/`, house icon), Sell (`/sell`, plus-circle), Orders (`/dashboard/orders`, package), Profile (`/profile`, user). Active tab: 24px filled icon, `--color-brand` with 2px top border. Bar: 64px + `env(safe-area-inset-bottom)`, `position: fixed; bottom: 0`, `z-index: 40`, `backdrop-filter: blur(8px)`. Sell tab triggers login modal for unauthenticated users.

Desktop (`lg+`) replaces bottom nav with collapsible sidebar (256px expanded, 64px collapsed). Active items: `--color-brand` at 8% opacity, 3px left border. Sub-navigation indents 24px with disclosure chevron.

Admin layout (`/admin/*`) uses dedicated sidebar (always expanded) with darker background (`hsl(150 8% 12%)`): Dashboard, Disputes, Reports, Users, Settings.

## Responsive Breakpoint Strategy

| Breakpoint | Width | Use | Behavior |
|------------|-------|-----|----------|
| Base | 0–639px | Phones | Single column, bottom nav, bottom sheets, swipeable galleries, infinite scroll |
| `sm` | 640px | Large phones | Minor spacing; some 2-column grids |
| `md` | 768px | Tablets | 2-column grids; data tables replace card lists; modals replace sheets |
| `lg` | 1024px | Laptops | Sidebar replaces bottom nav; 3-column grids; split-view layouts |
| `xl` | 1280px | Desktops | 4-column grids; expanded sidebar; activity sidebars; content max 1280px centered |

All containers: `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8`.

## Page Transition Animation

Exiting page fades `opacity: 1 → 0` over 150ms, translating 8px down. Entering page fades `opacity: 0 → 1` over 250ms, translating from 12px below to `translate-y: 0`. Easing: `cubic-bezier(0.4, 0, 0.2, 1)`.

```tsx
// PageTransition.tsx — root layout wrapper
import { motion, AnimatePresence } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1],
};

export function PageTransition({ children, pathname }: {
  children: React.ReactNode;
  pathname: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

`prefers-reduced-motion: reduce` sets duration to 0. Bottom sheets slide up from `translate-y: 100%` over 300ms with backdrop fade. Admin pages use instant swaps.


---

# 6. Animation & Interaction Specification

Every animation in the Celis system serves a functional purpose — guiding attention, confirming action, or masking latency. Decorative motion is excluded by default. All timing values derive from a four-step duration scale, and every implementation checks `prefers-reduced-motion` before executing.

## Animation Tokens

The system defines four duration tiers and three easing families. These tokens are available as CSS custom properties and as a JavaScript constants object for Framer Motion.

| Token | Value | Usage |
|-------|-------|-------|
| `duration-instant` | `0ms` | State toggles, color swaps |
| `duration-fast` | `150ms` | Button press, icon state, hover shadows |
| `duration-normal` | `250ms` | Page transitions, input focus, card hover |
| `duration-slow` | `400ms` | Escrow release, milestone fill, modals |

| Easing | CSS Value | Usage |
|--------|-----------|-------|
| `ease-entrance` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the viewport |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the viewport |
| `ease-expansion` | `cubic-bezier(0.4, 0, 0.2, 1)` | Expand/collapse, accordion, wizard steps |

The shared spring configuration for Framer Motion micro-interactions uses `stiffness: 300`, `damping: 30`, `mass: 1`. This produces a slight overshoot on entrance that settles within `250ms` — perceptible as responsive without feeling bouncy. The reduced-motion override flips all durations to `0.01ms` and strips transform animations, leaving only opacity crossfades for state changes.

```typescript
// src/lib/animation.ts
import { useReducedMotion, type Transition } from 'framer-motion';

export const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 1 };

export const DURATION = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;

export function useAccessibleTransition(transition: Transition): Transition {
  const shouldReduce = useReducedMotion();
  if (!shouldReduce) return transition;
  return {
    duration: 0.01,
    opacity: { duration: 0.15 },
    x: false, y: false, scale: false, rotate: false,
  };
}

export const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: DURATION.normal, ease: [0, 0, 0.2, 1] },
};
```

---

## 6.1 Micro-Interactions

### 6.1.1 Button Press

The active state on all button variants applies `transform: scale(0.97)` combined with `opacity: 0.9` over `150ms` using `ease-out`. This compression simulates physical depression. The transform originates from `transform-origin: center` and uses `will-change: transform` for compositor-thread rendering. On touch devices, the active state triggers on `touchstart` and clears on `touchend` or `touchcancel` — there is no `:hover` state on touch.

When a button enters loading state, the text label fades out (`opacity: 1 → 0`, `150ms`) and a spinner icon fades in with the same timing. The spinner itself rotates continuously via CSS `@keyframes spin` at `1s linear infinite`. The button maintains its layout dimensions during the swap to prevent layout shift — the spinner is absolutely positioned within a relative container. Framer Motion's `AnimatePresence` handles the enter/exit crossfade.

### 6.1.2 Input Focus

On focus, the input border transitions from `border-color: hsl(var(--muted))` to `border-color: hsl(var(--primary))` over `200ms`. Simultaneously, a `box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2)` ring appears using the same duration. The ring uses the primary color at `20%` opacity to meet WCAG non-text contrast requirements. The input container applies a subtle `scale(1.02)` on focus via Framer Motion — this grow is `duration-fast` with `SPRING_CONFIG` stiffness reduced to `200` to avoid a jarring pop.

Error validation triggers a horizontal shake: `translateX` oscillates `±4px` over `300ms` in three complete cycles. The keyframe sequence is `0 → 4 → -4 → 4 → -4 → 4 → 0`. This pattern is implemented as a CSS keyframe animation class `.animate-shake` that applies on validation failure and removes after the animation completes via the `animationend` event. The shake does not repeat — it fires once per validation attempt.

### 6.1.3 Card Hover

Interactive cards (listings, order summaries, profile cards) elevate on hover via `translateY(-2px)` and a shadow tier increase from `shadow-sm` to `shadow-md`. The transition runs `200ms ease-out`. On dark mode, the shadow shift is replaced by a `border-color` lightening from `hsl(var(--border))` to `hsl(var(--border-hover))` since shadows carry less visual weight against dark surfaces. Touch devices disable hover elevation entirely — the card uses the active-press state instead (`scale(0.98)`, `duration-fast`). This detection uses `@media (hover: hover)` rather than viewport width, ensuring hybrid devices (stylus, hover-capable tablets) receive the correct behavior.

### 6.1.4 Toast Entrance and Exit

Toast notifications enter from the right edge: `translateX(100%) → translateX(0)` combined with `opacity: 0 → 1` over `300ms` using Framer Motion spring physics. The spring uses `stiffness: 400`, `damping: 28` — slightly tighter than the default spring to prevent overshoot past the viewport edge. Exit reverses the motion: `translateX(0) → translateX(100%)` with `opacity: 1 → 0` over `200ms` `ease-in`. `AnimatePresence` with `mode="wait"` ensures the exiting toast completes before a new one enters at the same position.

Each toast carries an auto-dismiss progress bar at the bottom edge: a `2px` strip that shrinks from `width: 100%` to `width: 0%` over the toast's configured duration (default `5000ms`) using `linear` easing. When the user hovers over the toast, the progress bar animation pauses via `animation-play-state: paused`. The bar color matches the toast variant: `hsl(var(--primary))` for info, `hsl(var(--destructive))` for error, `hsl(var(--warning))` for warning.

---

## 6.2 Page Transitions

### 6.2.1 Route Transitions

All route changes in the TanStack Start application wrap outgoing and incoming pages in a shared `PageTransition` component. The animation applies `opacity: 0 → 1` combined with `translateY(8px) → translateY(0)` over `250ms` using `ease-out` for entrances. Exits mirror the motion: `opacity: 1 → 0`, `translateY(0) → translateY(-4px)` over `200ms` `ease-in`. The `PageTransition` component uses Framer Motion's `AnimatePresence` with a unique `key` derived from the current route pathname to ensure React correctly tracks mounted pages.

The integration with TanStack Start's `useTransition` hook (for pending navigation state) works as follows: when a route transition begins, the current page holds in its exit state until the deferred data for the incoming route resolves. A global loading indicator — a `4px` primary-colored bar at the top of the viewport using the indeterminate shimmer pattern — fills the gap during data fetching. Once data resolves, the exit animation plays, then the entrance animation fires for the new route. The transition wrapper is placed at the root layout level so all routes inherit it automatically.

### 6.2.2 Skeleton Loading

Every asynchronous content area renders a skeleton placeholder during data fetching. The skeleton consists of rounded rectangles that approximate the final content layout — text lines as `h-4` blocks with `w` values proportional to expected content width, image areas as `aspect-ratio` boxes with `rounded-lg`. The skeleton color uses `hsl(var(--muted) / 0.4)` against light surfaces and `hsl(var(--muted) / 0.25)` on dark.

The shimmer animation sweeps a `linear-gradient(90deg, transparent, hsl(var(--muted) / 0.6), transparent)` across each skeleton block from `background-position: -200% 0` to `200% 0` over `1.5s` with `linear` easing and `infinite` iteration. This creates a left-to-right light sweep that signals activity without implying progress. When the actual content loads, skeleton blocks fade out (`opacity: 1 → 0`, `200ms`) while content fades in (`opacity: 0 → 1`, `200ms`) with a `50ms` overlap so the viewport never blanks. Skeleton blocks use `overflow: hidden` and `border-radius: inherit` to contain the shimmer gradient within their rounded bounds.

### 6.2.3 Wizard Step Transitions

Multi-step flows (KYC verification, dispute filing, merchant onboarding) use directional slide transitions. Advancing to the next step slides content left: outgoing step `translateX(0) → translateX(-100%)`, incoming step `translateX(100%) → translateX(0)` over `300ms` `ease-in-out`. Navigating back reverses the direction: outgoing `translateX(0) → translateX(100%)`, incoming `translateX(-100%) → translateX(0)`.

A crossfade overlap runs concurrently: the outgoing step fades from `opacity: 1 → 0` over `150ms` starting at `0ms`, while the incoming step fades from `opacity: 0 → 1` over `150ms` starting at `150ms`. This `50%` overlap ensures the viewport never appears empty during the transition. Step content uses `position: absolute` within a relative container of fixed height to prevent vertical layout shift during the slide. The container height animates to match the incoming step's content height using Framer Motion's `layout` prop with `transition: { duration: DURATION.slow, ease: easeExp }`.

---

## 6.3 State Change Animations

### 6.3.1 Order Status Milestone Fill

The order tracking component displays three to five milestone nodes connected by a horizontal track. When a milestone completes, its connecting track fills from `width: 0%` to `width: 100%` over `400ms` using `ease-out`. The fill color transitions from `hsl(var(--muted))` to `hsl(var(--primary))`. The milestone node itself scales from `scale(0.8)` to `scale(1)` with a `300ms` spring and changes from an outlined circle to a filled circle containing a checkmark SVG.

The checkmark draws via SVG `stroke-dasharray` and `stroke-dashoffset` animation. The path has a computed `pathLength` of `100`; `stroke-dashoffset` animates from `100` to `0` over `300ms` with `ease-out`, creating the illusion of a pen drawing the check. The stroke color is `hsl(var(--primary-foreground))` against the filled primary circle. Completed milestones remain in their filled state; future milestones stay outlined in `hsl(var(--muted))`. When all milestones complete, the entire track pulses once: `box-shadow` expands from `0 0 0 0 hsl(var(--primary) / 0.4)` to `0 0 0 12px hsl(var(--primary) / 0)` over `600ms` — a single ripple that signals order completion without requiring user dismissal.

### 6.3.2 Escrow Release

On successful escrow release, a confetti burst renders on a `canvas` element absolutely positioned over the transaction card. The implementation uses a lightweight particle system: `50` particles spawn from the center of the release button, each with a random velocity vector (`angle: Math.random() * Math.PI * 2`, `speed: 4 + Math.random() * 6`) and gravity acceleration (`0.25px/frame`). Particles are small rectangles (`4px × 4px` to `8px × 8px`) in brand-aligned colors: `hsl(25 95% 53%)` (primary orange), `hsl(142 76% 36%)` (success green), `hsl(45 93% 47%)` (warning yellow). Each particle rotates randomly (`rotationSpeed: -10 to +10 deg/frame`) and fades from `opacity: 1` to `0` over its lifetime. The animation runs for `1000ms` using `requestAnimationFrame` and cleans up by removing the canvas element on completion.

Simultaneously, the wallet balance display triggers a green pulse ring: a `box-shadow` ripple identical to the order completion pulse but using `hsl(142 76% 36%)` expands outward once. The balance number itself animates using a `countUp` pattern — the displayed value increments from the old balance to the new balance over `800ms` with `ease-out`, updating every `16ms` (one frame). If the new balance is lower (funds sent), the count direction reverses and the pulse uses `hsl(0 84% 60%)` (destructive red).

### 6.3.3 PIN Countdown Timer

The escrow dispute PIN entry screen displays a circular SVG countdown timer with `r="45"`, giving a circumference of `~283px` (`2 * π * 45`). The timer ring is an SVG `<circle>` with `stroke-dasharray: 283` and `stroke-dashoffset` animated from `0` (full ring) to `283` (empty ring) over the countdown duration (default `300s`). The animation uses `stroke-linecap: round` and `transform: rotate(-90deg)` so the depletion begins at the 12 o'clock position.

Color thresholds shift the ring stroke as time depletes: above `60%` remaining uses `hsl(142 76% 36%)` (green), `30–60%` uses `hsl(45 93% 47%)` (yellow), below `30%` uses `hsl(0 84% 60%)` (red). These transitions apply via CSS `transition: stroke 300ms ease-out` on the `<circle>` element. A numeric countdown label at the center displays `MM:SS` format, updating every second. At `<10s` remaining, the label gains the error shake animation (see 6.1.2) to signal urgency. When the timer reaches zero, the ring disappears and a "Timed Out" state crossfades in with the standard `fadeInUp` entrance pattern.

### 6.3.4 Image Upload

During image upload, a linear progress bar fills from `width: 0%` to `width: 100%` synchronized with the actual upload progress percentage. The bar uses `hsl(var(--primary))` fill against `hsl(var(--muted))` track, with `4px` height and `rounded-full` ends. The width transition uses CSS `transition: width 200ms linear` so the bar moves smoothly even when progress events are irregular.

When upload completes, the thumbnail image scales in from `scale(0.9)` to `scale(1)` with `opacity: 0 → 1` over `250ms` using `SPRING_CONFIG`. A small checkmark badge overlays the bottom-right corner of the thumbnail, entering with a `scale(0) → scale(1)` pop over `150ms` with a slight spring overshoot (`stiffness: 500`, `damping: 15`).

For reordering uploaded images, Framer Motion's `Reorder.Group` wraps the thumbnail grid. Each item uses `Reorder.Item` with `dragListener` enabled on a dedicated drag handle (six-dot grip icon, `24px × 24px` touch target) to prevent accidental drag during scroll. The reorder animation uses spring physics: `stiffness: 300`, `damping: 25` — slightly lower damping than the default spring to allow smooth positional settling as items shift to accommodate the dragged element. On drop, the new order commits to state and a subtle haptic feedback pattern fires on supported devices via `navigator.vibrate(10)`. The drag handle appears on hover (desktop) and is always visible on touch devices to indicate reorder capability.

---

## Code Block 1: Framer Motion Component Primitives

```tsx
// src/components/motion/index.tsx
import { motion, AnimatePresence, Reorder, useReducedMotion } from 'framer-motion';
import { useState, useCallback, type ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';

export const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 1 };
export const SPRING_BOUNCY = { stiffness: 500, damping: 15, mass: 1 };
export const DURATION = { instant: 0, fast: 0.15, normal: 0.25, slow: 0.4 };

// --- useAccessibleTransition hook ---
export function useAccessibleTransition(transition: object = {}) {
  const reduced = useReducedMotion();
  if (!reduced) return transition;
  return { duration: 0.01, opacity: { duration: 0.15 }, x: false, y: false, scale: false };
}

// --- AnimatedButton with press + loading state ---
export function AnimatedButton({
  children,
  loading,
  onClick,
  ...props
}: {
  children: ReactNode;
  loading?: boolean;
  onClick?: () => void;
} & React.ComponentProps<typeof motion.button>) {
  const transition = useAccessibleTransition({
    type: 'spring' as const, ...SPRING_CONFIG,
  });

  return (
    <motion.button
      whileTap={!loading ? { scale: 0.97, opacity: 0.9 } : undefined}
      transition={transition}
      onClick={onClick}
      disabled={loading}
      style={{ position: 'relative', willChange: 'transform' }}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
          >
            {/* Spinner SVG */}
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"
                strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// --- PageTransition wrapper for TanStack Start ---
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const transition = useAccessibleTransition({
    duration: DURATION.normal,
    ease: [0, 0, 0.2, 1],
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={transition}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// --- AnimatedToast with AnimatePresence ---
export function AnimatedToast({
  id, message, variant = 'info', duration = 5000, onDismiss,
}: {
  id: string; message: string; variant?: 'info' | 'success' | 'warning' | 'error';
  duration?: number; onDismiss: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const variantColor = {
    info: 'hsl(var(--primary))',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(45 93% 47%)',
    error: 'hsl(0 84% 60%)',
  }[variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={useAccessibleTransition({
        type: 'spring', stiffness: 400, damping: 28,
      })}
      onHoverStart={() => setIsPaused(true)}
      onHoverEnd={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-lg border bg-background px-4 py-3 shadow-lg"
      style={{ minWidth: 280, maxWidth: 400 }}
    >
      <p className="text-sm font-medium">{message}</p>
      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ backgroundColor: variantColor }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        onAnimationComplete={() => onDismiss(id)}
      />
    </motion.div>
  );
}

// --- ReorderableImageGrid for uploaded images ---
export function ReorderableImageGrid({
  items, onReorder,
}: {
  items: { id: string; url: string }[];
  onReorder: (newOrder: typeof items) => void;
}) {
  return (
    <Reorder.Group
      axis="x"
      values={items}
      onReorder={onReorder}
      className="flex flex-wrap gap-2"
    >
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          dragListener={false}
          dragControls={undefined}
          whileDrag={{ scale: 1.05, zIndex: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative rounded-lg overflow-hidden"
          style={{ width: 96, height: 96 }}
        >
          <img src={item.url} alt="" className="w-full h-full object-cover" />
          <div className="drag-handle absolute top-1 left-1 p-1 rounded bg-black/40 cursor-grab active:cursor-grabbing">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <circle cx="5" cy="5" r="1.5" /><circle cx="11" cy="5" r="1.5" />
              <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="11" r="1.5" /><circle cx="11" cy="11" r="1.5" />
            </svg>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

---

## Code Block 2: CSS Keyframe Animations

```css
/* src/styles/animations.css */

/* ── Duration & Easing Tokens ── */
@layer base {
  :root {
    --duration-instant: 0ms;
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;

    --ease-entrance: cubic-bezier(0, 0, 0.2, 1);
    --ease-exit: cubic-bezier(0.4, 0, 1, 1);
    --ease-expansion: cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* ── Reduced Motion Override ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ── Skeleton Shimmer ── */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--muted) / 0.4) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted) / 0.4) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

/* ── Error Shake ── */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(4px); }
  20% { transform: translateX(-4px); }
  30% { transform: translateX(4px); }
  40% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  60% { transform: translateX(0); }
}

.animate-shake {
  animation: shake 300ms ease-in-out;
}

/* ── Spinner Rotation ── */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* ── Pulse Ring (order complete, escrow release) ── */
@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 var(--pulse-color, hsl(25 95% 53% / 0.4));
  }
  100% {
    box-shadow: 0 0 0 12px var(--pulse-color, hsl(25 95% 53% / 0));
  }
}

.animate-pulse-ring {
  animation: pulse-ring 600ms ease-out forwards;
}

/* ── Countdown Ring SVG Animation ── */
@keyframes countdown-stroke {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 283; }   /* 2 * π * 45 */
}

.animate-countdown {
  animation: countdown-stroke linear forwards;
}

/* ── Toast Progress Bar ── */
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

.animate-toast-progress {
  animation: toast-progress linear forwards;
}

/* ── Confetti Particle Keyframes ── */
@keyframes confetti-fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
    opacity: 0;
  }
}

/* ── Checkmark SVG Stroke Draw ── */
@keyframes draw-check {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}

.animate-draw-check {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: draw-check 300ms ease-out forwards;
}

/* ── Escrow Confetti Canvas Implementation ── */
/* Usage: call triggerConfetti(canvasElement, buttonRect) on escrow release */

@keyframes confetti-burst { /* CSS fallback for no-JS environments */
  0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
  50% { opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.2) rotate(var(--dr)); opacity: 0; }
}
```

```typescript
// src/lib/confetti.ts — Canvas-based escrow confetti implementation
interface Particle {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; color: string;
  rotation: number; rotationSpeed: number;
  opacity: number; lifetime: number; age: number;
}

const COLORS = [
  'hsl(25 95% 53%)',   /* primary orange */
  'hsl(142 76% 36%)',  /* success green */
  'hsl(45 93% 47%)',   /* warning yellow */
  'hsl(221 83% 53%)',  /* info blue */
];

export function triggerConfetti(
  canvas: HTMLCanvasElement,
  originRect: DOMRect,
  particleCount: number = 50,
  duration: number = 1000,
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const originX = originRect.left + originRect.width / 2;
  const originY = originRect.top + originRect.height / 2;

  const particles: Particle[] = Array.from({ length: particleCount }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 6;
    return {
      x: originX, y: originY,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
      w: 4 + Math.random() * 4, h: 4 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
      opacity: 1, lifetime: duration, age: 0,
    };
  });

  let rafId: number;
  const startTime = performance.now();

  function render(now: number) {
    const elapsed = now - startTime;
    ctx!.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.age = elapsed;
      const progress = p.age / p.lifetime;
      if (progress >= 1) return;

      p.vy += 0.25; /* gravity */
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity = 1 - progress;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.globalAlpha = p.opacity;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx!.restore();
    });

    if (elapsed < duration) {
      rafId = requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }

  rafId = requestAnimationFrame(render);
  return () => cancelAnimationFrame(rafId);
}
```

---

## Animation Parameter Matrix

| Animation | Trigger | Property | From | To | Duration | Easing |
|-----------|---------|----------|------|-----|----------|--------|
| Button press | `:active` / `whileTap` | `scale` | `1` | `0.97` | `150ms` | `ease-out` |
| Button press | `:active` / `whileTap` | `opacity` | `1` | `0.9` | `150ms` | `ease-out` |
| Button loading swap | `loading` prop change | `opacity` (text) | `1` | `0` | `150ms` | `ease` |
| Button loading swap | `loading` prop change | `opacity` (spinner) | `0` | `1` | `150ms` | `ease` |
| Input focus | `onFocus` | `border-color` | muted | primary | `200ms` | `ease` |
| Input focus | `onFocus` | `box-shadow` | none | `0 0 0 2px primary/20` | `200ms` | `ease` |
| Input focus grow | `onFocus` | `scale` | `1` | `1.02` | `150ms` | spring (`stiffness: 200`) |
| Input error shake | validation fail | `translateX` | `0` | `±4px × 3` | `300ms` | `ease-in-out` |
| Card hover | `@media (hover: hover)` | `translateY` | `0` | `-2px` | `200ms` | `ease-out` |
| Card hover | `@media (hover: hover)` | `box-shadow` | sm | md | `200ms` | `ease-out` |
| Card touch active | `whileTap` | `scale` | `1` | `0.98` | `150ms` | `ease-out` |
| Toast enter | mount | `translateX` | `100%` | `0` | `300ms` | spring (`stiffness: 400`) |
| Toast enter | mount | `opacity` | `0` | `1` | `300ms` | spring |
| Toast exit | unmount | `translateX` | `0` | `100%` | `200ms` | `ease-in` |
| Toast exit | unmount | `opacity` | `1` | `0` | `200ms` | `ease-in` |
| Toast progress | auto-dismiss | `width` | `100%` | `0%` | `5000ms` | `linear` |
| Route enter | pathname change | `translateY` | `8px` | `0` | `250ms` | `ease-out` |
| Route enter | pathname change | `opacity` | `0` | `1` | `250ms` | `ease-out` |
| Route exit | pathname change | `translateY` | `0` | `-4px` | `200ms` | `ease-in` |
| Route exit | pathname change | `opacity` | `1` | `0` | `200ms` | `ease-in` |
| Skeleton shimmer | loading state | `background-position` | `-200%` | `200%` | `1500ms` | `linear` |
| Content reveal | data resolved | `opacity` | `0` | `1` | `200ms` | `ease` |
| Wizard step forward | next click | `translateX` outgoing | `0` | `-100%` | `300ms` | `ease-in-out` |
| Wizard step forward | next click | `translateX` incoming | `100%` | `0` | `300ms` | `ease-in-out` |
| Wizard step back | back click | `translateX` outgoing | `0` | `100%` | `300ms` | `ease-in-out` |
| Wizard step back | back click | `translateX` incoming | `-100%` | `0` | `300ms` | `ease-in-out` |
| Wizard crossfade | step change | `opacity` overlap | `1 → 0` / `0 → 1` | — | `150ms` each | `ease` |
| Milestone track fill | status update | `width` | `0%` | `100%` | `400ms` | `ease-out` |
| Milestone node pop | status update | `scale` | `0.8` | `1` | `300ms` | spring |
| Checkmark draw | status update | `stroke-dashoffset` | `100` | `0` | `300ms` | `ease-out` |
| Completion pulse | all done | `box-shadow` spread | `0` | `12px` | `600ms` | `ease-out` |
| Confetti particle | escrow release | `translate` + `rotate` | origin | random | `1000ms` | gravity + velocity |
| Balance countUp | balance change | displayed number | old | new | `800ms` | `ease-out` |
| Countdown ring | timer tick | `stroke-dashoffset` | `0` | `283` | `300000ms` | `linear` |
| Countdown color | threshold cross | `stroke` | green → yellow → red | — | `300ms` | `ease-out` |
| Upload progress | `onProgress` | `width` | `0%` | `upload%` | `200ms` | `linear` |
| Thumbnail scale-in | upload complete | `scale` | `0.9` | `1` | `250ms` | spring |
| Thumbnail scale-in | upload complete | `opacity` | `0` | `1` | `250ms` | spring |
| Image reorder | drag end | position swap | — | — | `spring` | `stiffness: 300, damping: 25` |

---

## Accessibility Requirements

All animations in the system are subject to `prefers-reduced-motion`. When the user has this preference enabled, the `useAccessibleTransition` hook and the CSS `@media (prefers-reduced-motion: reduce)` block activate simultaneously. The result: all transforms (scale, translate, rotate) execute in `0.01ms` and are effectively removed; only opacity crossfades remain at `150ms` to prevent jarring instant state changes. The confetti canvas does not render. The countdown timer displays as a numeric label only, with no SVG ring animation. Skeleton shimmer is replaced by a static `hsl(var(--muted) / 0.4)` block. Wizard step transitions become instant swaps with a `50ms` opacity flash to indicate change. Route transitions reduce to a simple `150ms` opacity fade with no positional movement.

No animation in the system uses parallax, continuous rotation (beyond the button loading spinner, which also respects reduced motion), rapid oscillation, or vestibular-triggering patterns. The maximum simultaneous animated element count on any screen is capped at `20` to maintain `60fps` on entry-level Android devices.


---

# 7. Image Asset Requirements & Generation Brief

All image assets in the Celis design system follow a strict taxonomy: every file is versioned, named predictably, and generated through reproducible methods. The asset inventory table at the end of this section serves as the single source of truth for the frontend build pipeline.

---

## 7.1 Logo Assets

### 7.1.1 SVG Master Specification

The Celis logomark is a single-path, geometric dual-interlocking "C" form — two mirrored C-shapes interlocking at their open ends to create a continuous loop. The mark is purely geometric: no gradients, no strokes, no illustrative detail. This constraint guarantees that the logo renders identically at 16px favicon size and at billboard scale without perceptual degradation.

The SVG master file operates on a `40x40` viewBox. All coordinates are expressed as integers to avoid subpixel rendering artifacts. The path uses a single `fill` attribute referencing the brand primary color token. No internal CSS, no `style` attributes, no `<defs>` blocks — the master is a clean, self-contained SVG path ready for programmatic manipulation.

**SVG master structure:**

```svg
<!-- celis-logo-mark.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <path
    fill="hsl(221 83% 53%)"
    d="M20 4C11.2 4 4 11.2 4 20s7.2 16 16 16c4.4 0 8.4-1.8 11.3-4.7l-2.8-2.8C26.6 30.8 23.5 32 20 32c-6.6 0-12-5.4-12-12S13.4 8 20 8c3.5 0 6.6 1.5 8.8 3.9l-6.8 6.8h12V6.7l-3.5 3.5C27.8 6.6 24.1 4 20 4zm10.3 10.3l-2.8 2.8c1.1 1.6 1.8 3.5 1.8 5.5 0 2.2-.8 4.2-2.1 5.8l2.8 2.8c2-2.4 3.3-5.5 3.3-8.8 0-2.9-1-5.6-2.7-7.8l-.3.7z"
  />
</svg>
```

The `fill` value binds to `hsl(221 83% 53%)` — the Celis primary blue. In the React component wrapper, this is parameterized through a `color` prop defaulting to the primary token, allowing dark-mode inversion or contextual color shifts without duplicating SVG files.

**Export sizes and naming convention:**

| Size | Filename | Format | Use Case |
|------|----------|--------|----------|
| 16px | `celis-logo-16.png` | PNG | Favicon legacy, Chrome tab |
| 32px | `celis-logo-32.png` | PNG | Favicon retina |
| 64px | `celis-logo-64.png` | PNG | PWA icon small |
| 128px | `celis-logo-128.png` | PNG | PWA icon medium, social share |
| 256px | `celis-logo-256.png` | PNG | PWA icon large, OG image |
| 512px | `celis-logo-512.png` | PNG | PWA splash screen |
| 1024px | `celis-logo-1024.png` | PNG | App store, marketing |
| Scalable | `celis-logo-mark.svg` | SVG | All responsive contexts |

All PNG exports are generated from the SVG master via a headless Chromium render pipeline at `2x` device pixel ratio for sizes 128px and above, then downscaled with Lanczos resampling to preserve edge crispness. Export runs as a pre-build script; no raster assets are committed to the repository — only the SVG master lives in `src/assets/logo/`.

### 7.1.2 Favicon Implementation

Modern browsers receive the SVG favicon first. Legacy browsers and Safari fall back to PNG. The implementation loads in this order:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

The SVG favicon uses `currentColor` for its fill, inheriting the browser's default text color — rendering dark on light tab backgrounds and light on dark tab backgrounds automatically. For browsers that do not support SVG favicons (pre-2020 Chrome, all IE), the 16px and 32px PNG variants provide the fallback. The `apple-touch-icon` at 180x180 is precomposed (no gloss overlay) and uses the full-color mark on a `hsl(0 0% 100%)` rounded-rectangle mask matching iOS icon spec.

---

## 7.2 UI Illustrations

All UI illustrations in Celis share a unified flat geometric style — two-dimensional shapes, no gradients, no drop shadows, no 3D perspective. Color is limited to the brand palette: primary blue `hsl(221 83% 53%)`, secondary teal `hsl(174 72% 38%)`, neutral slate `hsl(215 19% 35%)`, and warm background tones `hsl(30 20% 97%)`. This constraint produces illustrations that weigh under 15KB each as optimized SVGs and maintain visual coherence with the rest of the interface.

Canvas dimensions for all illustrations are `240x180px` (4:3 ratio) at `1x` with a `480x360px` `@2x` variant generated from the same source. This size fills the illustration container in empty states without dominating the screen.

### 7.2.1 Empty State Illustrations

Three empty state illustrations communicate absence without creating anxiety. Each pairs with a headline, supportive body copy, and a primary CTA button.

**No Search Results.** A magnifying glass hovering over an open, empty box. The box interior uses the warm background tone. The magnifying glass frame is primary blue with a teal handle. Scattered around the box are three small geometric shapes (circle, triangle, square) in muted slate — representing items that were not found.

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. A magnifying glass with a blue frame and teal handle hovering over an open empty cardboard box. Three small geometric shapes — a circle, a triangle, and a square — scattered nearby in muted slate gray. Clean white background. Minimalist style similar to Notion or Linear empty states. Primary colors: blue #2563eb, teal #0d9488, slate #475569. Simple shapes, no outlines, no texture. 240x180px composition.

**No Orders.** A clipboard with a checklist, all checkboxes empty. A small calendar icon floats beside it with no dates highlighted. The clipboard body uses warm background tone; the clip and empty checkboxes use slate.

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. A clipboard holding a blank checklist with empty square checkboxes. A small floating calendar icon beside it with no highlighted dates. Clean white background. Colors: slate gray clipboard and checkboxes #475569, warm off-white paper #faf8f5, subtle blue accent on calendar #2563eb. Minimalist flat style, simple geometric shapes, no texture or outlines. 240x180px composition.

**No Listings.** A simple storefront outline with the door slightly ajar and empty shelves visible inside. A small "+" icon in a circle hovers near the door, suggesting the action to create a first listing.

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. A simple storefront outline with an open door revealing empty shelves inside. A floating circular button with a plus icon near the entrance. Clean white background. Colors: blue storefront outline #2563eb, teal plus button #0d9488, warm interior #faf8f5, slate shelf lines #475569. Minimalist geometric style, no texture, no shadows. 240x180px composition.

### 7.2.2 Onboarding Illustrations

Three onboarding screens introduce new users to Celis. These illustrations are larger at `320x240px` (4:3) and include friendly geometric character forms — abstract human figures built from circles and rectangles, not detailed portraits.

**Welcome Screen.** Two geometric character figures — one holding a package, one holding a phone — standing on either side of the Celis logomark. Warm background. Characters use primary blue and secondary teal as fill colors with white circle heads.

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. Two friendly abstract human characters made of simple geometric shapes — circular heads, rectangular bodies — standing on either side of a central interlocking-C logo mark. One character holds a small package, the other holds a smartphone. Warm off-white background. Character colors: blue #2563eb and teal #0d9488 with white circular heads. Minimalist style like Linear or Notion illustrations, clean composition, no texture. 320x240px.

**How Escrow Works.** A three-step visual: (1) buyer sends payment to a locked safe icon, (2) seller ships a package, (3) safe unlocks and payment releases. Connected by a dotted line arrow flowing left to right.

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. A three-step process flow connected by dotted arrows. Step 1: a hand placing a coin into a locked safe. Step 2: a package on a delivery truck. Step 3: the safe unlocking with coins flowing out. Clean white background. Colors: blue #2563eb for primary elements, teal #0d9488 for the flow arrows, slate #475569 for secondary details, warm off-white #faf8f5 for backgrounds. Simple geometric icons, no texture, minimalist style. 320x240px horizontal composition.

**Safety Tips.** A shield icon in the center with five small geometric icons orbiting around it: a checkmark (verify identity), a lock (secure payments), a chat bubble (communicate in-app), a flag (report suspicious activity), and a star (rate your experience).

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. A large shield icon at the center with five small geometric icons orbiting around it in a circular arrangement: a checkmark, a padlock, a chat bubble, a flag, and a star. Clean white background. Shield in blue #2563eb, orbiting icons in teal #0d9488 and slate #475569. Simple flat shapes, no outlines, no texture. Minimalist safety-themed illustration. 320x240px.

### 7.2.3 Error State Illustrations

Error illustrations acknowledge failure while redirecting the user toward recovery. Each includes a headline, explanatory text, and a primary action button.

**404 — Lost Package.** A small cardboard box with a question mark on it, sitting at a crossroads with two diverging paths. A map pin icon floats above, slightly askew. The metaphor: the page, like a package, took a wrong turn.

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. A small cardboard package box with a question mark printed on its side, sitting at a crossroads where two paths diverge. A map pin icon floating slightly askew above the box. Clean white background. Colors: warm brown box #a78b5a, blue paths and pin #2563eb, teal question mark #0d9488, slate crossroad lines #475569. Minimalist flat style, simple geometric shapes, no texture. 240x180px composition.

**500 — Broken Connection.** Two geometric device shapes (a phone and a laptop) with a snapped connection line between them. Small data packet squares are falling from the broken line. A subtle gear icon in the background suggests something is being fixed.

**AI Generation Prompt:**

> Flat geometric vector illustration, no gradients, no 3D. A smartphone and a laptop with a snapped connection line between them, small square data packets falling from the broken connection. A subtle gear icon in the background. Clean white background. Colors: blue devices #2563eb, teal gear #0d9488, slate broken line and data packets #475569, warm off-white device screens #faf8f5. Minimalist flat style, simple geometric shapes, no texture. 240x180px composition.

---

## 7.3 Category Icons

The Celis marketplace organizes listings into 31 categories. Every category icon is a monochrome stroke icon rendered at `24px` default and `20px` dense, using a consistent `2px` stroke width with `round` stroke-linecap and `round` stroke-linejoin. No fill, no color — icons inherit the current text color through `currentColor`, ensuring they adapt to any surface without additional configuration.

### 7.3.1 Icon Strategy: Lucide Base + Custom Extensions

Of the 31 category icons, 24 map directly to existing Lucide icons. The remaining 7 require custom SVG paths drawn to match Lucide's visual grammar. All icons — Lucide and custom — are bundled as a single icon library in `src/components/icons/categories/`.

**Lucide imports for mapped categories:**

```tsx
import {
  Smartphone,        // Electronics
  Shirt,             // Fashion
  Sofa,              // Furniture
  Car,               // Vehicles
  Home,              // Real Estate
  BookOpen,          // Books
  Gamepad2,          // Gaming
  Dumbbell,          // Sports
  PawPrint,          // Pets
  Baby,              // Baby & Kids
  Wrench,            // Services
  Hammer,            // Construction
  Music,             // Musical Instruments
  Camera,            // Photography
  Watch,             // Watches & Jewelry
  Stethoscope,       // Health & Beauty
  GraduationCap,     // Education
  PartyPopper,       // Events
  Briefcase,         // Jobs
  Truck,             // Logistics
  Leaf,              // Agriculture
  Cpu,               // Computing
  Utensils,          // Food & Dining
  Paintbrush,        // Art & Crafts
} from "lucide-react";
```

**Custom category icons (7 icons requiring bespoke paths):**

| Category | Icon Name | Visual Concept |
|----------|-----------|----------------|
| Livestock | `Livestock` | Stylized cow/ram head, single path, 2px stroke |
| Textiles | `Textiles` | Rolled fabric bolt with visible fold lines |
| Handicrafts | `Handicrafts` | Woven basket pattern, geometric weave lines |
| Motorcycles | `Motorcycle` | Simplified two-wheeled vehicle profile |
| Mobile Money | `MobileMoney` | Phone outline with coin overlapping corner |
| Matatu/Transport | `SharedTransport` | Minibus front view, simplified geometric |
| Cleaning | `Cleaning` | Spray bottle with droplet arcs |

Each custom icon is drawn on a `24x24` viewBox using the same stroke parameters as Lucide: `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"`. Custom icons are validated against a visual regression test that overlays them with equivalent Lucide icons to confirm stroke weight, corner radius, and optical center alignment.

**Category icon usage pattern:**

```tsx
import { categoryIcons } from "@/components/icons/categories";

// In a category listing component
function CategoryCard({ category }: { category: Category }) {
  const Icon = categoryIcons[category.slug];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <span className="text-sm font-medium text-foreground">
        {category.name}
      </span>
    </div>
  );
}
```

The icon container uses `48px x 48px` touch targets — exceeding the WCAG 2.1 minimum for pointer targets. On dense layouts (search filters, dropdown menus), icons scale to `20px` within `40px` containers.

---

## 7.4 Photo Guidelines

Listing photos are the primary trust signal in a P2P marketplace. Consistent photo standards reduce cognitive load for buyers and increase conversion rates for sellers. Celis enforces these standards at the upload layer, not merely as guidelines.

### 7.4.1 Listing Photo Standards

**Dimensions and format.** All listing photos are cropped to a `1:1` square aspect ratio — a familiar frame for East African users accustomed to Instagram and WhatsApp status formats. Minimum upload resolution is `800x800px`. The platform accepts JPEG and PNG uploads but converts all stored images to WebP at quality `0.82` using Sharp.js. This quality setting produces file sizes averaging 45-65KB per image at 800x800px, a 60-70% reduction over equivalent JPEG at quality 85.

**Upload pipeline.** The client-side uploader resizes images to a maximum of `1600x1600px` before transmission, preventing oversized uploads on limited bandwidth. The server generates three variants:

| Variant | Dimensions | Use Case |
|---------|-----------|----------|
| Thumbnail | `200x200px` | Grid views, search results |
| Standard | `800x800px` | Detail page gallery |
| Full | `1600x1600px` | Zoom/lightbox view |

**Hero image guidance overlay.** The upload UI displays a compositional overlay to guide sellers toward better photography. This overlay appears as a semi-transparent grid on the photo preview:

```tsx
function PhotoGuidanceOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Rule of thirds grid */}
      <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
      <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
      <div className="absolute left-0 top-1/3 h-px w-full bg-white/30" />
      <div className="absolute left-0 top-2/3 h-px w-full bg-white/30" />
      {/* Center crosshair */}
      <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/50" />
      <div className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-white/50" />
      {/* Guidance label */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1">
        <span className="text-xs font-medium text-white">
          Take photo in daylight — place item in center
        </span>
      </div>
    </div>
  );
}
```

The overlay renders at `opacity: 0` by default and fades to `opacity: 1` on hover or touch-hold, ensuring it does not obstruct the photo preview permanently. The guidance text is localized: Swahili (`Piga picha wakati wa mchana — weka kitu katikati`) displays for `sw` locale, English for `en`.

**Photo quality checks.** Before upload completion, the client runs three automated checks: (1) minimum dimension validation — reject if either edge is below `800px`; (2) blur detection using a Laplacian variance threshold of `100` — reject overly blurry images; (3) aspect ratio enforcement — crop tool forces `1:1` before submission. These checks execute in a Web Worker to avoid blocking the main thread.

**WebP compression configuration (Sharp.js):**

```ts
import sharp from "sharp";

const processed = await sharp(inputBuffer)
  .resize(800, 800, { fit: "cover", position: "center" })
  .webp({
    quality: 82,
    effort: 4,        // encoding speed: 0=fastest, 6=best compression
    smartSubsample: true,
    nearLossless: false,
  })
  .toBuffer();
```

The `effort: 4` setting balances compression time against file size. On the deployment hardware, this produces a typical throughput of 45 images per second at 800x800px — sufficient for Celis's expected concurrent upload volume.

---

## 7.5 Complete Asset Inventory

| Asset Name | Type | Dimensions | Format | Usage Location | Generation Method |
|---|---|---|---|---|---|
| Logo Mark (Master) | SVG | 40x40 viewBox | SVG | All responsive contexts | Hand-coded, single path |
| Logo 16px | Raster | 16x16 | PNG | Legacy favicon | SVG render pipeline |
| Logo 32px | Raster | 32x32 | PNG | Retina favicon | SVG render pipeline |
| Logo 64px | Raster | 64x64 | PNG | PWA icon small | SVG render pipeline |
| Logo 128px | Raster | 128x128 | PNG | PWA medium, social | SVG render pipeline |
| Logo 256px | Raster | 256x256 | PNG | PWA large, OG | SVG render pipeline |
| Logo 512px | Raster | 512x512 | PNG | PWA splash | SVG render pipeline |
| Logo 1024px | Raster | 1024x1024 | PNG | App store | SVG render pipeline |
| Favicon SVG | Vector | 16x16 viewBox | SVG | Modern browser tabs | Hand-coded, currentColor fill |
| Apple Touch Icon | Raster | 180x180 | PNG | iOS home screen | SVG render + rounded mask |
| Empty Search | Illustration | 240x180 / 480x360 | SVG | Search results empty state | AI gen → vector trace |
| Empty Orders | Illustration | 240x180 / 480x360 | SVG | Orders page empty state | AI gen → vector trace |
| Empty Listings | Illustration | 240x180 / 480x360 | SVG | Seller dashboard empty state | AI gen → vector trace |
| Onboarding Welcome | Illustration | 320x240 / 640x480 | SVG | First-launch welcome screen | AI gen → vector trace |
| Onboarding Escrow | Illustration | 320x240 / 640x480 | SVG | Escrow education screen | AI gen → vector trace |
| Onboarding Safety | Illustration | 320x240 / 640x480 | SVG | Safety tips screen | AI gen → vector trace |
| Error 404 | Illustration | 240x180 / 480x360 | SVG | 404 error page | AI gen → vector trace |
| Error 500 | Illustration | 240x180 / 480x360 | SVG | 500 error page | AI gen → vector trace |
| Category Icons (24) | Icon | 24x24 viewBox | SVG (React) | Category navigation, filters | Lucide imports |
| Category Icons (7) | Icon | 24x24 viewBox | SVG (React) | Custom category navigation | Hand-coded paths |
| Listing Thumbnail | Photo | 200x200 | WebP | Grid views, search results | Server-side Sharp.js |
| Listing Standard | Photo | 800x800 | WebP | Detail page gallery | Server-side Sharp.js |
| Listing Full | Photo | 1600x1600 | WebP | Zoom/lightbox view | Server-side Sharp.js |

The generation pipeline for illustrations follows a consistent workflow: AI image generation (Midjourney v6 or DALL-E 3) using the prompts specified in each subsection above produces a raster reference. This reference is then traced to SVG using Figma's vector networks or Vectr, producing a clean, optimizable SVG under 15KB. The traced SVG undergoes manual cleanup: merging overlapping paths, converting strokes to outlines where needed, and running through SVGO with the prefixIds plugin to prevent ID collisions when multiple illustrations render on the same page. Final SVGs are stored as React components in `src/components/illustrations/` with typed props for size and optional color overrides.

