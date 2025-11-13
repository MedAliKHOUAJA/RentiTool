// src/app/reset-password/page.tsx
import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}