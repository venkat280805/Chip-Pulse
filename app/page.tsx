import { Suspense } from "react";
import { HomePageClient } from "@/components/home-page-client";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomePageClient />
    </Suspense>
  );
}
