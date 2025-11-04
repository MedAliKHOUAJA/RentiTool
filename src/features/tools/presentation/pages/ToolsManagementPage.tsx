"use client";

import React, { useState } from "react";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import BackgroundSection from "@/components/BackgroundSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useUserTools } from "../../../tools/application/hooks/useUserTools";
import { deleteTool } from "../../../tools/application/use-cases/delete-tool.use-case";
import { toggleToolStatus } from "../../../tools/application/use-cases/toggle-tool-status.use-case";
import { ToolsList } from "../components/ToolsList";
import { ToolsListControls } from "../components/ToolsListControls";
import { AddToolForm } from "../components/AddToolForm";
import { SortKey } from "../../domain/tool.types";

import { useAuth } from "@/hooks/useAuth";

const ToolsManagementPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"mine" | "add" | "reserved">("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const {
    tools,
    loading: toolsLoading,
    error: toolsError,
    refresh: refreshTools,
  } = useUserTools({
    sortKey,
    searchQuery,
    enabled: activeTab === "mine",
    ownerId: user?.userId,
  });

  // Delete confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Toggle confirmation state
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{
    id: number;
    nextActive: boolean;
  } | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const handleDeleteClick = (toolId: number) => {
    setPendingDeleteId(toolId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId == null) return;
    
    setConfirmLoading(true);
    const result = await deleteTool(pendingDeleteId);
    setConfirmLoading(false);

    if (result.success || result.notFound) {
      setConfirmOpen(false);
      setPendingDeleteId(null);
      await refreshTools();
      if (result.notFound) {
        alert("Tool not found. It may have been deleted already.");
      }
    } else {
      alert(result.error || "Failed to delete tool");
    }
  };

  const handleToggleClick = (toolId: number, currentActive?: boolean) => {
    const nextActive = !(currentActive ?? true);
    setPendingToggle({ id: toolId, nextActive });
    setToggleDialogOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;

    setToggleLoading(true);
    const result = await toggleToolStatus({
      toolId: pendingToggle.id,
      isActive: pendingToggle.nextActive,
    });
    setToggleLoading(false);

    if (result.success) {
      setToggleDialogOpen(false);
      setPendingToggle(null);
      await refreshTools();
    } else {
      alert(result.error || "Failed to update tool status");
    }
  };

  const handleToolCreated = async () => {
    setActiveTab("mine");
    await refreshTools();
  };

  return (
    <>
      <div className="nc-ToolsManagementPage container my-10 relative">
        <BgGlassmorphism className="absolute inset-x-0 md:top-10 xl:top-40 min-h-0 pl-20 py-24 flex overflow-hidden z-0 pointer-events-none" />
        <div className="relative py-8">
          <BackgroundSection className="bg-neutral-100 dark:bg-black dark:bg-opacity-20 pointer-events-none" />
          <h1 className="relative z-10 text-2xl md:text-3xl font-semibold">
            Tools management
          </h1>
          <p className="relative z-10 text-neutral-500 dark:text-neutral-400 mt-2">
            Manage your tools, add new ones, and check reservations.
          </p>

          {/* Tabs */}
          <div className="relative z-10 mt-6 border-b border-neutral-200 dark:border-neutral-700">
            <nav className="flex gap-6" aria-label="Tabs">
              {[
                { key: "mine", label: "My tools" },
                { key: "add", label: "Add a tool" },
                { key: "reserved", label: "Reserved tools" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`-mb-px pb-3 border-b-2 text-sm md:text-base ${
                    activeTab === t.key
                      ? "border-bleu-nuit text-bleu-nuit"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* CONTENT BY TAB */}
        {activeTab === "mine" && (
          <div className="mt-8">
            <ToolsListControls
              searchQuery={searchQuery}
              sortKey={sortKey}
              onSearchChange={setSearchQuery}
              onSortChange={setSortKey}
              onAddClick={() => setActiveTab("add")}
            />
            <ToolsList
              tools={tools}
              loading={toolsLoading}
              error={toolsError}
              onDelete={handleDeleteClick}
              onToggleActive={handleToggleClick}
            />
          </div>
        )}

        {activeTab === "add" && <AddToolForm onSuccess={handleToolCreated} />}

        {activeTab === "reserved" && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Reserved tools</h2>
            <div className="py-6 text-neutral-500">
              You don't have any reservations yet.
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmOpen}
        loading={confirmLoading}
        title="Delete tool"
        description="Are you sure you want to delete this tool? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
      />
      <ConfirmDialog
        open={toggleDialogOpen}
        loading={toggleLoading}
        title={pendingToggle?.nextActive ? "Enable tool" : "Disable tool"}
        description={
          pendingToggle?.nextActive
            ? "Make this tool visible to clients again."
            : "Disable this tool so it no longer appears to clients. You can enable it later."
        }
        confirmText={pendingToggle?.nextActive ? "Enable" : "Disable"}
        cancelText="Cancel"
        onCancel={() => {
          setToggleDialogOpen(false);
          setPendingToggle(null);
        }}
        onConfirm={handleConfirmToggle}
      />
    </>
  );
};

export default ToolsManagementPage;