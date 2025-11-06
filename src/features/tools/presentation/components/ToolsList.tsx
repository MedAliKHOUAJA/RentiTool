import React from "react";
import { useRouter } from "next/navigation";
import ToolCard from "@/components/Cards/ToolCard";
import { Tool } from "../../domain/tool";

interface ToolsListProps {
  tools: Tool[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, currentActive?: boolean) => void;
}

export function ToolsList({
  tools,
  loading,
  error,
  onDelete,
  onToggleActive,
}: ToolsListProps) {
  const router = useRouter();

  if (loading) {
    return <div className="py-6 text-neutral-500">Loading your tools…</div>;
  }

  if (error) {
    return <div className="py-6 text-red-600">{error}</div>;
  }

  if (tools.length === 0) {
    return (
      <div className="py-6 text-neutral-500">
        You don't have any tools yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {tools.map((tool) => {
        const ownerHref = `/owner-tool-detail?id=${encodeURIComponent(
          String(tool.toolId)
        )}` as any;

        return (
          <ToolCard
            key={tool.toolId}
            data={{ ...tool, href: ownerHref }}
            onDelete={() => onDelete(Number(tool.toolId))}
            onEdit={() =>
              router.push(
                `/tools-management/edit?id=${encodeURIComponent(
                  String(tool.toolId)
                )}` as any
              )
            }
            onToggleActive={() => onToggleActive(Number(tool.toolId), tool.isActive)}
            showLike={false}
            showStatusBadge
          />
        );
      })}
    </div>
  );
}