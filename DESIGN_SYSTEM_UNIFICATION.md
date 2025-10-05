# Design System Unification Plan

## Problem Statement

Currently, the blipee OS platform has **inconsistent layouts** across different sections:
- ProfileLayout, SustainabilityLayout, SettingsLayout all have **duplicated code**
- Different sidebars, headers, colors, backgrounds
- No unified design system
- Difficult to maintain consistency

## Solution: BaseSidebarLayout Template

Created a **single, unified layout template** (`BaseSidebarLayout.tsx`) that all pages can use.

### Design Principles

**Consistent Elements:**
1. ✅ **Sidebar**: Same width, collapse behavior, styling
2. ✅ **Header**: Same mobile header with back button and menu
3. ✅ **Colors**: Unified color scheme
   - Background: `bg-white dark:bg-black`
   - Sidebar: `bg-white dark:bg-[#111111]`
   - Content: `bg-white dark:bg-[#212121]`
   - Borders: `border-gray-200 dark:border-white/[0.05]`
   - Active state: `bg-gray-100 dark:bg-[#757575]`
4. ✅ **Logo**: Consistent blipee branding with accent gradient
5. ✅ **User Section**: Profile avatar, chat, settings, logout
6. ✅ **Responsive**: Mobile menu overlay, collapsible sidebar

### Template Features

**Props Interface:**
```typescript
{
  children: ReactNode;           // Page content
  navItems: NavItem[];           // Section-specific navigation
  pageTitle?: string;            // Optional page title
  sectionTitle?: string;         // Section name (default: "blipee")
  selectedView?: string;         // For view-based navigation
  onSelectView?: (view: string) => void;  // View change handler
}
```

**NavItem Interface:**
```typescript
{
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  view?: string | null;  // For dashboard view switching
}
```

## Migration Plan

### Phase 1: Layouts to Update
1. ✅ **ProfileLayout** - Use BaseSidebarLayout with profile nav items
2. ✅ **SustainabilityLayout** - Use BaseSidebarLayout with sustainability nav items
3. ✅ **SettingsLayout** - Refactor to use BaseSidebarLayout

### Phase 2: Benefits
- **90% less duplicate code**
- **Consistent UX** across all sections
- **Easier maintenance** - one place to fix bugs
- **Faster development** - reuse template for new sections

## Color System (Standardized)

### Backgrounds
- **App Background**: `bg-white dark:bg-black`
- **Sidebar Background**: `bg-white dark:bg-[#111111]`
- **Content Background**: `bg-white dark:bg-[#212121]`

### Borders
- **All Borders**: `border-gray-200 dark:border-white/[0.05]`

### Text
- **Primary**: `text-gray-900 dark:text-white`
- **Secondary**: `text-gray-700 dark:text-gray-300`
- **Muted**: `text-gray-500 dark:text-gray-400`

### Interactive States
- **Active Item**: `bg-gray-100 dark:bg-[#757575]`
- **Hover**: `hover:bg-gray-50 dark:hover:bg-white/[0.05]`

### Accent Colors (from CSS variables)
- **Gradient**: `linear-gradient(to right, rgb(var(--accent-primary-rgb)), rgb(var(--accent-secondary-rgb)))`
- **Classes**: `accent-gradient`, `accent-text`

## Implementation Status

### ✅ Completed
- [x] Created `BaseSidebarLayout.tsx` template
- [x] Documented design system
- [x] Defined color standards

### 📋 Next Steps
1. Update ProfileLayout to use BaseSidebarLayout
2. Update SustainabilityLayout to use BaseSidebarLayout
3. Refactor SettingsLayout to use BaseSidebarLayout
4. Test all pages for consistency
5. Remove duplicate layout code

### 🎯 Expected Outcome
- **One template** powering all section layouts
- **Consistent design** across entire platform
- **Easy to theme** - change one file, update everywhere
- **Maintainable** - bug fixes apply to all layouts

---

*Based on ProfileLayout design pattern - the cleanest implementation in the codebase*
