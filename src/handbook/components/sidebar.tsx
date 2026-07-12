/**
 * sidebar.tsx — Fixed tree view of handbook levels and topics
 *
 * Renders a bounded list of items within a maxVisibleItems viewport.
 * Items outside the viewport are hidden (simulated scroll).
 * The sidebar stays fixed while content scrolls independently.
 */

import { Box, Text } from "ink";
import type { NavItem } from "../hooks/use-handbook-nav.js";

interface SidebarProps {
  items: NavItem[];
  selectedIndex: number;
  scrollOffset: number;
  maxVisibleItems: number;
}

export function Sidebar({ items, selectedIndex, scrollOffset, maxVisibleItems }: SidebarProps) {
  const visibleItems = items.slice(scrollOffset, scrollOffset + maxVisibleItems);
  const hasMoreAbove = scrollOffset > 0;
  const hasMoreBelow = scrollOffset + maxVisibleItems < items.length;

  return (
    <Box flexDirection="column" width="40%" height="100%">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Handbook
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {hasMoreAbove && (
          <Text dimColor>{`  ▲ ${scrollOffset} mais acima`}</Text>
        )}

        {visibleItems.map((item, index) => {
          const realIndex = scrollOffset + index;
          return (
            <SidebarItem
              key={`${item.type}-${item.levelNumber}-${item.topic?.id}-${item.isExpanded}`}
              item={item}
              isSelected={realIndex === selectedIndex}
            />
          );
        })}

        {hasMoreBelow && (
          <Text dimColor>{`  ▼ ${items.length - scrollOffset - maxVisibleItems} mais abaixo`}</Text>
        )}
      </Box>
    </Box>
  );
}

interface SidebarItemProps {
  item: NavItem;
  isSelected: boolean;
}

function SidebarItem({ item, isSelected }: SidebarItemProps) {
  if (item.type === "level") {
    const arrow = item.isExpanded ? "▼" : "▶";
    return (
      <Box paddingLeft={0}>
        <Text
          bold
          color={isSelected ? "blue" : undefined}
          inverse={isSelected}
        >
          {` ${arrow} ${item.levelNumber} — ${item.levelName}`}
        </Text>
      </Box>
    );
  }

  if (item.type === "topic" && item.topic) {
    return (
      <Box paddingLeft={2}>
        <Text
          color={isSelected ? "blue" : undefined}
          inverse={isSelected}
        >
          {` ▸ ${item.topic.title}`}
        </Text>
      </Box>
    );
  }

  return null;
}
