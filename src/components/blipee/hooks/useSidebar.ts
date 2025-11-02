/**
 * useSidebar Hook
 * Manage sidebar collapse state with localStorage persistence
 */

import { useLocalStorage } from './useLocalStorage';

export type SidebarState = 'collapsed' | 'expanded';

export function useSidebar() {
  const [sidebarState, setSidebarState] = useLocalStorage<SidebarState>(
    'blipee-sidebar',
    'expanded'
  );

  const toggleSidebar = () => {
    setSidebarState((prev) => (prev === 'collapsed' ? 'expanded' : 'collapsed'));
  };

  const isCollapsed = sidebarState === 'collapsed';
  const isExpanded = sidebarState === 'expanded';

  return {
    sidebarState,
    setSidebarState,
    toggleSidebar,
    isCollapsed,
    isExpanded,
  };
}
