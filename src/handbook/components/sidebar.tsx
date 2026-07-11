/**
 * sidebar.tsx — Tree view of handbook levels and topics
 *
 * Displays expandable levels with nested topics.
 * Supports keyboard navigation and mouse click.
 */

import { useRef } from "react";
import { Box, Text } from "ink";
import { useOnClick } from "@ink-tools/ink-mouse";
import type { NavItem } from "../hooks/use-handbook-nav.js";

interface SidebarProps {
  items: NavItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onExpand: (levelNumber: number) => void;
}

export function Sidebar({ items, selectedIndex, onSelect, onExpand }: SidebarProps) {
  return (
    <Box flexDirection="column" width="40%">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Handbook
        </Text>
      </Box>

      {items.map((item, index) => (
        <SidebarItem
          key={item.type === "level" ? `level-${item.levelNumber}` : `topic-${item.topic?.id}`}
          item={item}
          isSelected={index === selectedIndex}
          onSelect={() => onSelect(index)}
          onExpand={() => {
            if (item.type === "level") {
              onExpand(item.levelNumber);
            }
          }}
        />
      ))}
    </Box>
  );
}

interface SidebarItemProps {
  item: NavItem;
  isSelected: boolean;
  onSelect: () => void;
  onExpand: () => void;
}

function SidebarItem({ item, isSelected, onSelect, onExpand }: SidebarItemProps) {
  const ref = useRef(null);

  useOnClick(ref, () => {
    onSelect();
    if (item.type === "level") {
      onExpand();
    }
  });

  if (item.type === "level") {
    const arrow = item.isExpanded ? "▼" : "▶";
    return (
      <Box ref={ref} flexDirection="column">
        <Box paddingLeft={0}>
          <Text
            bold
            color={isSelected ? "blue" : undefined}
            inverse={isSelected}
          >
            {` ${arrow} ${item.levelNumber} — ${item.levelName}`}
          </Text>
        </Box>
        {isSelected && (
          <Box paddingLeft={2}>
            <Text dimColor>{item.levelName}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (item.type === "topic" && item.topic) {
    return (
      <Box ref={ref} paddingLeft={2}>
        <Text
          color={isSelected ? "blue" : undefined}
          inverse={isSelected}
        >
          {` ▸ ${item.topic.title}`}
        </Text>
        {isSelected && (
          <Box paddingLeft={2}>
            <Text dimColor>{item.topic.description}</Text>
          </Box>
        )}
      </Box>
    );
  }

  return null;
}
