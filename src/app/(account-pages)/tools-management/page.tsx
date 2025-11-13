"use client";

import { Suspense } from "react";
import ToolsManagementPage from "@/features/tools/presentation/pages/ToolsManagementPage";

export const dynamic = 'force-dynamic';

function ToolsManagementContent() {
  return <ToolsManagementPage />;
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ToolsManagementContent />
    </Suspense>
  );
}