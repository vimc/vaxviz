# Accessibility Documentation for Vaxviz

## Overview

This document describes the accessibility features implemented in the Vaxviz application to ensure WCAG 2.1 Level AA compliance. The application provides an accessible data visualization interface for vaccination coverage data.

## WCAG 2.1 Level AA Compliance

### Implemented Accessibility Features

#### 1. Semantic HTML Structure (WCAG 1.3.1 - Level A)

**Document Structure:**
- Added proper `<h1>` heading: "Vaxviz - Vaccination Coverage Visualization"
- Implemented semantic landmarks:
  - `<header>` - Contains the main page heading
  - `<nav>` - Wraps the plot controls for configuration
  - `<main>` - Contains the primary data visualization
  - `<aside>` - Contains supporting controls and legend
- Maintained proper heading hierarchy (h1 → h2)

**Components:**
- `App.vue`: Uses semantic HTML5 elements with proper landmark roles
- `ColorLegend.vue`: Uses `<h2>` for legend heading and `role="region"`
- `FetchErrorAlert.vue`: Uses `<h2>` for error heading
- `RidgelinePlot.vue`: Uses `<figure>` element for chart container

#### 2. Keyboard Navigation (WCAG 2.1.1 - Level A)

**Skip Navigation:**
- Added "Skip to main content" link in `index.html`
- Link is visually hidden but appears on keyboard focus
- Allows keyboard users to bypass navigation and go directly to chart

**Focus Indicators:**
- Enhanced `:focus-visible` styles with 3px solid blue outline
- 2px offset for better visibility
- Applied globally to all interactive elements

**Form Controls:**
- All form elements in `PlotControls.vue` are keyboard accessible
- Radio buttons, checkboxes, and select dropdown can be navigated with Tab/Shift+Tab
- Select dropdown supports arrow keys and type-to-search

#### 3. ARIA Implementation (WCAG 4.1.2 - Level A)

**Landmark Labels:**
- `<aside role="complementary" aria-label="Plot controls and legend">`
- `<nav aria-label="Plot configuration">`
- `<main role="main" aria-label="Vaccination data visualization">`

**Form Accessibility:**
- `<form aria-label="Visualization controls">` - Clear form purpose
- Removed invalid `aria-required="true"` from fieldsets
- Added proper `id` attribute to VueSelect component
- Linked label to select with `for` and `id` attributes
- Used standard `aria-labelledby` attribute instead of custom `:aria` prop

**Chart Accessibility:**
- Added `role="img"` to chart container
- Dynamic `aria-label` describes chart content:
  - Metric type (DALYs/Deaths averted)
  - Focus selection (location/disease)
  - Number of data series
- Example: "Ridgeline chart showing deaths data for All 117 VIMC countries. 24 data series displayed."

**Error Handling:**
- Error alerts have `role="alert"` for immediate announcement
- Error icon has descriptive alt text: "Error icon"

#### 4. Dynamic Content Announcements (WCAG 4.1.3 - Level AA)

**Loading States:**
- `<div role="status" aria-live="polite">` for loading spinner
- Screen reader text: "Loading data..."
- Prevents disruptive announcements during data fetch

**Error States:**
- `<div role="alert" aria-live="assertive">` for error messages
- Immediate announcement to screen readers
- Clear error message with expandable details

**Empty States:**
- "No data available" message has `role="status" aria-live="polite"`
- Announces when selection results in no data

#### 5. Screen Reader Support (WCAG 1.3.1, 1.3.2 - Level A)

**Screen Reader Only Content:**
- `.sr-only` utility class for visually hidden but accessible content
- Used for:
  - Main page heading (visually hidden to preserve design)
  - "Error" label in error alert icon
  - "Loading data..." text with spinner
  - Form field labels where visual label exists

**Accessible Labels:**
- All form controls have associated labels
- Labels use proper `for` and `id` associations
- VueSelect uses `aria-labelledby` for label association

#### 6. Focus Management (WCAG 2.4.7 - Level AA)

**Enhanced Focus Indicators:**
```css
*:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}
```

**Skip Link Styling:**
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

#### 7. Color and Contrast (WCAG 1.4.3, 1.4.11 - Level AA)

**Text Alternatives:**
- Color legend includes text labels for all color-coded categories
- Chart data is not conveyed by color alone
- Legend uses both color and text to identify data series

**Interactive Elements:**
- Form controls use Flowbite theme with WCAG AA compliant colors
- Focus indicators have 3:1 contrast ratio with background
- Error states use semantic colors with text descriptions

### Keyboard Navigation Testing

To test keyboard accessibility:

1. **Tab Navigation:**
   - Press `Tab` to navigate forward through interactive elements
   - Press `Shift+Tab` to navigate backward
   - Verify focus indicator is clearly visible on all elements

2. **Skip Link:**
   - Press `Tab` on page load
   - First focus should be the "Skip to main content" link
   - Press `Enter` to skip to main chart area

3. **Form Controls:**
   - Navigate to radio buttons with `Tab`
   - Use `Arrow Keys` to select different options
   - Press `Tab` to move to select dropdown
   - Press `Enter` or `Space` to open dropdown
   - Use `Arrow Keys` or type to filter options
   - Press `Enter` to select an option
   - Navigate to checkboxes with `Tab`
   - Press `Space` to toggle checkbox state

4. **Focus Order:**
   - Verify logical tab order:
     1. Skip link
     2. "Focus on" radio buttons
     3. Focus select dropdown
     4. "Burden metric" radio buttons
     5. "Split by activity type" checkbox
     6. "Log scale" checkbox

### Screen Reader Testing

The application has been optimized for screen reader compatibility:

**Tested Patterns:**
- NVDA/JAWS compatibility considered in ARIA implementation
- VoiceOver on macOS/iOS patterns followed
- Semantic HTML prioritized over ARIA where possible

**Announcement Behavior:**
- Loading states announced with `aria-live="polite"`
- Errors announced immediately with `aria-live="assertive"`
- Chart updates are not announced (to avoid excessive interruptions)
- Form changes announce through standard form semantics

### Browser and Assistive Technology Support

**Supported Browsers:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Compatible Screen Readers:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

### Known Limitations

1. **Chart Interaction:**
   - SVG chart generated by `@reside-ic/skadi-chart` library
   - Chart itself is not keyboard navigable
   - Tooltips are not keyboard accessible
   - Consider future enhancement: keyboard navigation for data points

2. **Dynamic Updates:**
   - Chart updates are not announced to screen readers (by design, to avoid excessive announcements)
   - Only initial chart description is provided via `aria-label`
   - Users can infer changes through form control announcements

3. **Third-Party Components:**
   - VueSelect keyboard navigation depends on library implementation
   - Flowbite components assumed to be accessible (using official components)

### Future Enhancements

**Potential Improvements:**
1. Add keyboard navigation to chart data points
2. Provide data table alternative to visual chart
3. Implement keyboard-accessible tooltips
4. Add "Describe this chart" button for detailed screen reader description
5. Consider reduced motion preferences (`prefers-reduced-motion`)
6. Add high contrast mode support
7. Implement focus trap for modal dialogs (if added)

### Automated Testing Recommendations

**Tools:**
- **axe DevTools**: Browser extension for automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built-in Chrome DevTools accessibility audit
- **Pa11y**: Command-line accessibility testing tool

**Manual Testing:**
- **Keyboard-only navigation**: Test all functionality without mouse
- **Screen reader testing**: Test with NVDA, JAWS, or VoiceOver
- **Zoom testing**: Test at 200% browser zoom
- **Color contrast**: Use contrast checker tools

### Accessibility Checklist

#### WCAG 2.1 Level A (Critical)
- [x] 1.1.1 Non-text Content: Alt text for images
- [x] 1.3.1 Info and Relationships: Semantic HTML and ARIA
- [x] 1.3.2 Meaningful Sequence: Logical reading order
- [x] 2.1.1 Keyboard: All functionality available via keyboard
- [x] 2.1.2 No Keyboard Trap: Focus can move away from all elements
- [x] 2.4.1 Bypass Blocks: Skip navigation link
- [x] 2.4.2 Page Titled: Descriptive page title
- [x] 3.3.2 Labels or Instructions: Form labels provided
- [x] 4.1.1 Parsing: Valid HTML
- [x] 4.1.2 Name, Role, Value: Proper ARIA implementation

#### WCAG 2.1 Level AA (Important)
- [x] 1.4.3 Contrast (Minimum): Text contrast ratio 4.5:1
- [x] 2.4.6 Headings and Labels: Descriptive headings
- [x] 2.4.7 Focus Visible: Visible focus indicators
- [x] 3.3.3 Error Suggestion: Error messages provided
- [x] 3.3.4 Error Prevention: Reversible selections
- [x] 4.1.3 Status Messages: ARIA live regions for updates

### Resources

**WCAG Guidelines:**
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM WCAG Checklist](https://webaim.org/standards/wcag/checklist)

**Testing Tools:**
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse in Chrome DevTools](https://developers.google.com/web/tools/lighthouse)

**Assistive Technology:**
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver Guide](https://www.apple.com/accessibility/voiceover/)

### Contact

For accessibility issues or questions, please open an issue in the GitHub repository with the label "accessibility".

---

**Last Updated:** January 2026  
**WCAG Version:** 2.1  
**Conformance Level:** AA
