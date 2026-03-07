# Color Palette Design Guide
## Building Code Occupancy Classifier

This document provides professional color palette options specifically designed for the Building Code Occupancy Classifier application. Each palette is tailored to the construction/building industry while maintaining excellent readability, accessibility, and professional appearance.

---

## Design Principles

1. **Professional & Trustworthy**: Colors should convey reliability and authority suitable for building code compliance
2. **High Contrast**: Ensure WCAG AA compliance (4.5:1 minimum contrast ratio for text)
3. **Industry-Appropriate**: Reflect construction, architecture, and engineering aesthetics
4. **Functional Hierarchy**: Clear visual distinction between primary actions, warnings, and informational content
5. **Reduced Eye Strain**: Suitable for extended use by inspectors and contractors

---

## Palette Option 1: **Blueprint Professional**
### Theme: Traditional architectural blueprint aesthetic with modern refinement

**Primary Colors:**
- **Primary**: `#1E3A8A` (Deep Blueprint Blue) - Main actions, headers, links
  - RGB: 30, 58, 138
  - Use for: Primary buttons, active tabs, key headings
  
- **Secondary**: `#475569` (Slate Gray) - Secondary elements, borders
  - RGB: 71, 85, 105
  - Use for: Secondary buttons, card borders, inactive states

**Accent Colors:**
- **Accent**: `#F59E0B` (Construction Orange) - Highlights, warnings, important notices
  - RGB: 245, 158, 11
  - Use for: Warning badges, critical items, hover states
  
- **Success**: `#10B981` (Safety Green) - Completed items, success states
  - RGB: 16, 185, 129
  - Use for: Checkmarks, completion badges, success messages

**Background Colors:**
- **Background**: `#F8FAFC` (Cool White) - Main background
  - RGB: 248, 250, 252
  
- **Surface**: `#FFFFFF` (Pure White) - Cards, panels
  - RGB: 255, 255, 255
  
- **Muted**: `#E2E8F0` (Light Slate) - Disabled states, subtle backgrounds
  - RGB: 226, 232, 240

**Text Colors:**
- **Primary Text**: `#0F172A` (Near Black) - Main content
  - RGB: 15, 23, 42
  
- **Secondary Text**: `#64748B` (Medium Slate) - Supporting text
  - RGB: 100, 116, 139
  
- **Muted Text**: `#94A3B8` (Light Slate) - Placeholder, disabled
  - RGB: 148, 163, 184

**Semantic Colors:**
- **Error**: `#DC2626` (Safety Red)
- **Warning**: `#F59E0B` (Construction Orange)
- **Info**: `#3B82F6` (Information Blue)
- **Success**: `#10B981` (Safety Green)

**Implementation in `index.css`:**
```css
@layer base {
  :root {
    --background: 220 20% 98%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 32%;
    --primary-foreground: 210 40% 98%;
    --secondary: 215 16% 35%;
    --secondary-foreground: 210 40% 98%;
    --accent: 38 92% 50%;
    --accent-foreground: 222 47% 11%;
    --muted: 214 32% 91%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 32%;
  }
}
```

---

## Palette Option 2: **Steel & Concrete**
### Theme: Modern industrial with steel and concrete tones

**Primary Colors:**
- **Primary**: `#18181B` (Charcoal Steel) - Strong, authoritative
  - RGB: 24, 24, 27
  
- **Secondary**: `#52525B` (Medium Steel) - Balanced neutral
  - RGB: 82, 82, 91

**Accent Colors:**
- **Accent**: `#EAB308` (Caution Yellow) - High visibility
  - RGB: 234, 179, 8
  
- **Success**: `#22C55E` (Approval Green)
  - RGB: 34, 197, 94

**Background Colors:**
- **Background**: `#FAFAFA` (Concrete White)
  - RGB: 250, 250, 250
  
- **Surface**: `#FFFFFF` (Pure White)
  - RGB: 255, 255, 255
  
- **Muted**: `#F4F4F5` (Light Concrete)
  - RGB: 244, 244, 245

**Text Colors:**
- **Primary Text**: `#18181B` (Charcoal)
  - RGB: 24, 24, 27
  
- **Secondary Text**: `#71717A` (Steel Gray)
  - RGB: 113, 113, 122
  
- **Muted Text**: `#A1A1AA` (Light Steel)
  - RGB: 161, 161, 170

**Implementation in `index.css`:**
```css
@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 240 6% 10%;
    --primary: 240 6% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4% 36%;
    --secondary-foreground: 0 0% 98%;
    --accent: 48 96% 47%;
    --accent-foreground: 240 6% 10%;
    --muted: 240 5% 96%;
    --muted-foreground: 240 4% 46%;
    --border: 240 5% 96%;
    --input: 240 5% 96%;
    --ring: 240 6% 10%;
  }
}
```

---

## Palette Option 3: **Forest & Earth**
### Theme: Natural, sustainable building with warm earth tones

**Primary Colors:**
- **Primary**: `#065F46` (Forest Green) - Sustainable, natural
  - RGB: 6, 95, 70
  
- **Secondary**: `#78716C` (Earth Brown) - Grounded, stable
  - RGB: 120, 113, 108

**Accent Colors:**
- **Accent**: `#DC2626` (Alert Red) - Critical attention
  - RGB: 220, 38, 38
  
- **Success**: `#16A34A` (Growth Green)
  - RGB: 22, 163, 74

**Background Colors:**
- **Background**: `#F5F5F4` (Stone White)
  - RGB: 245, 245, 244
  
- **Surface**: `#FFFFFF` (Pure White)
  - RGB: 255, 255, 255
  
- **Muted**: `#E7E5E4` (Light Stone)
  - RGB: 231, 229, 228

**Text Colors:**
- **Primary Text**: `#1C1917` (Deep Earth)
  - RGB: 28, 25, 23
  
- **Secondary Text**: `#78716C` (Earth Brown)
  - RGB: 120, 113, 108
  
- **Muted Text**: `#A8A29E` (Light Earth)
  - RGB: 168, 162, 158

**Implementation in `index.css`:**
```css
@layer base {
  :root {
    --background: 60 9% 98%;
    --foreground: 20 14% 10%;
    --primary: 162 91% 20%;
    --primary-foreground: 162 100% 95%;
    --secondary: 24 6% 45%;
    --secondary-foreground: 60 9% 98%;
    --accent: 0 84% 49%;
    --accent-foreground: 60 9% 98%;
    --muted: 60 5% 90%;
    --muted-foreground: 24 6% 45%;
    --border: 60 5% 90%;
    --input: 60 5% 90%;
    --ring: 162 91% 20%;
  }
}
```

---

## Palette Option 4: **Safety First**
### Theme: High-visibility safety colors with professional balance

**Primary Colors:**
- **Primary**: `#1E40AF` (Safety Blue) - Trust, compliance
  - RGB: 30, 64, 175
  
- **Secondary**: `#64748B` (Neutral Gray) - Balance
  - RGB: 100, 116, 139

**Accent Colors:**
- **Accent**: `#EA580C` (Safety Orange) - High visibility
  - RGB: 234, 88, 12
  
- **Success**: `#059669` (Safety Green)
  - RGB: 5, 150, 105

**Background Colors:**
- **Background**: `#F8FAFC` (Clean White)
  - RGB: 248, 250, 252
  
- **Surface**: `#FFFFFF` (Pure White)
  - RGB: 255, 255, 255
  
- **Muted**: `#E2E8F0` (Light Gray)
  - RGB: 226, 232, 240

**Text Colors:**
- **Primary Text**: `#0F172A` (Deep Navy)
  - RGB: 15, 23, 42
  
- **Secondary Text**: `#475569` (Medium Gray)
  - RGB: 71, 85, 105
  
- **Muted Text**: `#94A3B8` (Light Gray)
  - RGB: 148, 163, 184

**Implementation in `index.css`:**
```css
@layer base {
  :root {
    --background: 220 20% 98%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 40%;
    --primary-foreground: 210 40% 98%;
    --secondary: 215 16% 47%;
    --secondary-foreground: 210 40% 98%;
    --accent: 20 91% 48%;
    --accent-foreground: 0 0% 100%;
    --muted: 214 32% 91%;
    --muted-foreground: 215 20% 35%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 40%;
  }
}
```

---

## Palette Option 5: **Modern Architect**
### Theme: Contemporary architectural studio aesthetic

**Primary Colors:**
- **Primary**: `#0C4A6E` (Deep Teal) - Sophisticated, modern
  - RGB: 12, 74, 110
  
- **Secondary**: `#334155` (Slate) - Professional neutral
  - RGB: 51, 65, 85

**Accent Colors:**
- **Accent**: `#0891B2` (Bright Teal) - Modern, fresh
  - RGB: 8, 145, 178
  
- **Success**: `#14B8A6` (Turquoise)
  - RGB: 20, 184, 166

**Background Colors:**
- **Background**: `#F9FAFB` (Gallery White)
  - RGB: 249, 250, 251
  
- **Surface**: `#FFFFFF` (Pure White)
  - RGB: 255, 255, 255
  
- **Muted**: `#F1F5F9` (Cool Gray)
  - RGB: 241, 245, 249

**Text Colors:**
- **Primary Text**: `#0F172A` (Charcoal)
  - RGB: 15, 23, 42
  
- **Secondary Text**: `#64748B` (Medium Slate)
  - RGB: 100, 116, 139
  
- **Muted Text**: `#94A3B8` (Light Slate)
  - RGB: 148, 163, 184

**Implementation in `index.css`:**
```css
@layer base {
  :root {
    --background: 210 20% 98%;
    --foreground: 222 47% 11%;
    --primary: 200 96% 24%;
    --primary-foreground: 180 100% 95%;
    --secondary: 215 25% 27%;
    --secondary-foreground: 210 40% 98%;
    --accent: 188 95% 37%;
    --accent-foreground: 0 0% 100%;
    --muted: 214 32% 95%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 95%;
    --input: 214 32% 95%;
    --ring: 200 96% 24%;
  }
}
```

---

## Recommended Palette

**For the Building Code Occupancy Classifier, I recommend Palette Option 1: "Blueprint Professional"**

### Rationale:
1. **Industry Recognition**: Blueprint blue is instantly recognizable in construction/architecture
2. **Professional Authority**: Deep blue conveys trust and compliance
3. **Excellent Contrast**: Meets WCAG AA standards for accessibility
4. **Functional Color Coding**: Orange for warnings, green for success aligns with industry standards
5. **Reduced Eye Strain**: Cool tones are easier on eyes during extended use
6. **Brand Consistency**: Aligns with building/construction industry visual language

---

## Implementation Steps

1. **Backup Current Styles**: Save a copy of `client/src/index.css`

2. **Update CSS Variables**: Replace the `:root` section in `index.css` with chosen palette

3. **Test Contrast**: Verify all text/background combinations meet WCAG AA (4.5:1 ratio)

4. **Adjust Components**: Review key components for color harmony:
   - Buttons and CTAs
   - Cards and panels
   - Tables and data displays
   - Badges and tags
   - Form inputs

5. **Dark Mode (Optional)**: Create `.dark` variant with inverted luminosity

---

## Accessibility Checklist

✅ **Text Contrast**: All text meets 4.5:1 minimum (7:1 for AAA)
✅ **Interactive Elements**: 3:1 contrast for buttons, inputs, focus states
✅ **Color Independence**: Information not conveyed by color alone
✅ **Focus Indicators**: Visible keyboard focus rings
✅ **Error States**: Clear visual distinction beyond color

---

## Testing Recommendations

1. **Browser Testing**: Chrome, Firefox, Safari, Edge
2. **Device Testing**: Desktop, tablet, mobile
3. **Lighting Conditions**: Bright office, dim lighting, outdoor
4. **User Feedback**: Gather feedback from inspectors and contractors
5. **Accessibility Tools**: Use WAVE, axe DevTools, Lighthouse

---

## Future Enhancements

- **Theme Switcher**: Allow users to choose preferred palette
- **High Contrast Mode**: For users with visual impairments
- **Print Styles**: Optimize for black & white printing
- **Custom Branding**: Allow organizations to apply their brand colors

---

**Document Version**: 1.0
**Last Updated**: January 2026
**Author**: Building Code Occupancy Classifier Development Team
