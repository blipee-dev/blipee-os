# Mobile Design Patterns for AI Chat Applications

## Best-in-Class Examples

### 1. **ChatGPT Mobile**
- Bottom tab navigation (Home, Search, Account)
- Full-screen chat interface
- Floating "New Chat" button
- Swipe from left edge for conversation history
- Minimal top header with model selector

### 2. **Claude Mobile**
- Bottom navigation with centered "New" button
- Full-screen conversations
- Side drawer for chat history
- Clean, distraction-free interface

### 3. **Perplexity AI**
- Bottom navigation (Home, Discover, Library, Profile)
- Prominent search/ask bar
- Thread-based conversations
- Focus on discovery and exploration

## Recommended Approach for blipee OS

### Mobile (< 768px)
```
┌─────────────────────────┐
│      Status Bar         │
├─────────────────────────┤
│                         │
│                         │
│     Chat Interface      │
│      (Full Screen)      │
│                         │
│                         │
├─────────────────────────┤
│  🏠  💬  ➕  📚  ⚙️    │  <- Bottom Navigation
└─────────────────────────┘
```

**Key Features:**
- **Bottom Navigation**: 5 items max, thumb-reachable
- **Floating Action Button**: Prominent "New Chat" in center
- **Full-Screen Chat**: Maximize conversation space
- **Slide-out Drawer**: Chat history from left edge
- **Minimal Header**: Only show when needed

### Tablet (768px - 1024px)
```
┌──────────┬──────────────┐
│          │              │
│ Sidebar  │    Chat      │
│  (Mini)  │  Interface   │
│          │              │
│          │              │
└──────────┴──────────────┘
```

**Key Features:**
- **Mini Sidebar**: Icons only, expandable
- **Floating Action Button**: Bottom-right corner
- **More Content Density**: Show more information

### Desktop (> 1024px)
```
┌──────────┬──────────────┬──────────┐
│          │              │          │
│ Sidebar  │    Chat      │ Context  │
│  (Full)  │  Interface   │  Panel   │
│          │              │          │
└──────────┴──────────────┴──────────┘
```

**Key Features:**
- **Full Sidebar**: Complete navigation
- **Context Panel**: Additional information
- **Keyboard Shortcuts**: Power user features

## Implementation Guidelines

### 1. Touch Targets
- Minimum 44x44px (iOS) / 48x48px (Android)
- Add padding around small icons
- Use `touch-action: manipulation` to prevent zoom

### 2. Gestures
```javascript
// Swipe to open drawer
const swipeThreshold = 50;
const edgeWidth = 20;

if (touchStart.x < edgeWidth && swipeDistance > swipeThreshold) {
  openDrawer();
}
```

### 3. Performance
- Use `transform` instead of `left/top` for animations
- Implement virtual scrolling for long chat lists
- Lazy load images and heavy components
- Use `will-change` sparingly

### 4. Responsive Typography
```css
/* Mobile First */
.text-body {
  font-size: 14px;  /* Mobile */
}

@media (min-width: 768px) {
  .text-body {
    font-size: 16px;  /* Tablet+ */
  }
}
```

### 5. Safe Areas
```css
/* Handle iPhone notch and home indicator */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Component Structure

### MobileNavigation.tsx
- Fixed bottom position
- 5 navigation items maximum
- Center item as primary action
- Active state indicators
- Accessible labels

### AppLayout.tsx
- Responsive wrapper component
- Handles navigation state
- Manages drawer animations
- Coordinates with router

## Testing Checklist

- [ ] Test on real devices (not just browser DevTools)
- [ ] Check thumb reachability for all actions
- [ ] Verify touch targets are large enough
- [ ] Test landscape orientation
- [ ] Check performance on low-end devices
- [ ] Verify keyboard doesn't cover input
- [ ] Test with one-handed use
- [ ] Check accessibility with screen readers

## Common Pitfalls to Avoid

1. **Don't use hover states** - They don't exist on mobile
2. **Avoid small touch targets** - Frustrating for users
3. **Don't hide critical actions** - Keep them visible
4. **Avoid desktop patterns** - Dropdowns, tooltips don't work well
5. **Don't forget loading states** - Mobile networks are slower
6. **Avoid fixed headers/footers that cover content**
7. **Don't assume fast devices** - Optimize for performance

## Resources

- [Material Design - Navigation](https://material.io/components/navigation-drawer)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Web.dev - Mobile UX](https://web.dev/mobile/)
- [A11y Project - Touch Targets](https://www.a11yproject.com/posts/touch-targets/)