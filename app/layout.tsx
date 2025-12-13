import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Aegis - Field Reporter",
  description: "Offline-first incident reporting application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
