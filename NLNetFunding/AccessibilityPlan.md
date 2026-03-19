# Web Accessibility Checklist (WCAG 2.1)

A practical, actionable checklist for bringing a plain HTML + JavaScript/TypeScript web application up to WCAG 2.1 AA compliance.

---

## Table of Contents

1. [Perceivable](#perceivable)
   
   1.1 [Text Alternatives (1.1)](#text-alternatives-11)

   1.2 [Time-based Media (1.2)](#time-based-media-12)
   
   1.3 [Adaptable (1.3)](#adaptable-13)
   
   1.4 [Distinguishable (1.4)](#distinguishable-14)
   
3. [Operable](#operable)
   
   2.1 [Keyboard Accessible (2.1)](#keyboard-accessible-21)
   
   2.2 [Enough Time (2.2)](#enough-time-22)
   
   2.3 [Seizures / Physical Reactions (2.3)](#seizures--physical-reactions-23)
   
   2.4 [Navigable (2.4)](#navigable-24)
   
   2.5 [Input Modalities (2.5)](#input-modalities-25)
   
5. [Understandable](#understandable)
   
   3.1 [Readable (3.1)](#readable-31)
   
   3.2 [Predictable (3.2)](#predictable-32)
   
   3.3 [Input Assistance (3.3)](#input-assistance-33)
   
7. [Robust](#robust)
   
   4.1 [Compatible (4.1)](#compatible-41)
   
9. [Testing & Automation](#testing--automation)
   

---

# Perceivable

## Text Alternatives (1.1)

### 1.1.1 Non-text Content

* [ ] Provide `alt` text for all images.
* [ ] For decorative images, use `alt=""` or CSS background images.
* [ ] Provide text labels for `<input type="image">`.
* [ ] Provide labels or ARIA for SVG icons.
* [ ] Provide accessible names for custom UI elements (ARIA or visible text).
* [ ] Provide captions/labels for form controls.

---

## Time-based Media (1.2)

*(If your app has no audio/video, check these off.)*

* [ ] Provide captions for video with audio.
* [ ] Provide text transcripts for audio-only content.
* [ ] Provide audio descriptions for important visual-only information.

---

## Adaptable (1.3)

### 1.3.1 Info and Relationships

* [ ] Use semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`, etc.).
* [ ] Use proper headings: one `<h1>`, then nested `<h2>`, `<h3>`, …
* [ ] Associate labels with inputs using `<label for="">`.
* [ ] Use lists `<ul>`, `<ol>`, `<dl>` where appropriate.
* [ ] Use tables only for tabular data (with `<th>`, scope).
* [ ] Ensure custom components expose programmatic roles, names, states.

### 1.3.2 Meaningful Sequence

* [ ] DOM order matches visual reading order.
* [ ] Avoid layout rearrangements that break reading sequence.

### 1.3.3 Sensory Characteristics

* [ ] Never rely only on color, shape, position, or sound to convey meaning.

### 1.3.4 Orientation (AA)

* [ ] Support both portrait and landscape orientation.

### 1.3.5 Identify Input Purpose

* [ ] Use autocomplete attributes (e.g., `autocomplete="email"`).
* [ ] Use standard HTML input types (`email`, `tel`, `url`).

---

## Distinguishable (1.4)

### 1.4.1 Use of Color

* [ ] Do not communicate information solely with color.

### 1.4.3 Contrast (Minimum) (AA)

* [ ] Text has 4.5:1 contrast (3:1 for large text).

### 1.4.4 Resize Text

* [ ] Page is usable at 200% zoom without loss of functionality.

### 1.4.5 Images of Text

* [ ] Avoid images of text unless necessary.

### 1.4.10 Reflow (AA)

* [ ] Layout reflows at 320px width without horizontal scrolling.

### 1.4.11 Non-text Contrast (AA)

* [ ] Controls, focus indicators, and icons have 3:1 contrast.

### 1.4.12 Text Spacing (AA)

* [ ] No text breaks when users increase spacing.

### 1.4.13 Content on Hover/Focus (AA)

* [ ] Tooltips/menus are dismissible, hoverable, and persistent while hovered.

---

# Operable

## Keyboard Accessible (2.1)

* [ ] All functionality is operable with keyboard only.
* [ ] No keyboard traps.
* [ ] Provide visible focus indicators on all focusable elements.
* [ ] For custom components, use proper keyboard patterns (Enter, Space, Arrow keys).

---

## Enough Time (2.2)

* [ ] Provide controls for time limits (extend, pause, stop).
* [ ] Provide pause/stop on auto-updating content.

---

## Seizures & Physical Reactions (2.3)

* [ ] No content flashes more than 3 times per second.
* [ ] Avoid rapid animations or provide a setting to disable them.

---

## Navigable (2.4)

* [ ] Provide a "Skip to main content" link.
* [ ] Page has unique, descriptive titles.
* [ ] Headings reflect page structure.
* [ ] Interactive controls have accessible names.
* [ ] Use proper link text (no “click here”).
* [ ] Current focus location is always visible.
* [ ] Provide consistent navigation and layout.
* [ ] Use landmarks: `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`.

---

## Input Modalities (2.5)

* [ ] Touch targets are at least 44×44 CSS pixels.
* [ ] Components with gestures (swipe, pinch) have simple alternatives.
* [ ] Device motion (shake/tilt) is optional.
* [ ] Labels/text match accessible name exactly (“Label in name”).

---

# Understandable

## Readable (3.1)

* [ ] Language declared using `<html lang="">`.
* [ ] Use `lang` attributes for mixed-language sections.

---

## Predictable (3.2)

* [ ] UI behaves consistently across pages.
* [ ] No unexpected context changes (focus, page navigation, modals).
* [ ] Components with same action have same labels everywhere.

---

## Input Assistance (3.3)

* [ ] Provide error messages that identify the problem and solution.
* [ ] Use inline validation with ARIA `aria-invalid` and `aria-describedby`.
* [ ] Provide instructions before the user submits forms.
* [ ] Ensure autocomplete works for personal information fields.

---

# Robust

## Compatible (4.1)

### 4.1.1 Parsing

* [ ] No duplicate IDs.
* [ ] Valid HTML (run through validator).
* [ ] Elements properly nested.

### 4.1.2 Name, Role, Value

* [ ] Custom components expose ARIA roles.
* [ ] Expose accessible names (`aria-label`, `aria-labelledby`, or text).
* [ ] States and values are updated programmatically (`aria-expanded`, etc.).
* [ ] Use ARIA only when no semantic HTML alternative exists.

### 4.1.3 Status Messages (AA)

* [ ] Use `role="status"`, `role="alert"`, or `aria-live` for updates.

---

# Testing & Automation

### Automated Testing

* [ ] Integrate axe-core into CI.
* [ ] Run Lighthouse Accessibility audits.
* [ ] Run jest-axe for unit tests (if using Jest).
* [ ] Use Playwright or Cypress + axe for end-to-end accessibility tests.

### Manual Testing

* [ ] Test with only keyboard.
* [ ] Test with a screen reader (NVDA, VoiceOver).
* [ ] Test high-zoom (200%–400%).
* [ ] Test mobile screen readers (TalkBack, VoiceOver).
* [ ] Test colorblindness filters.

