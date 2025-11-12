// src/app/signup/layout.tsx
// Removed duplicate <html> and <body> tags

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}