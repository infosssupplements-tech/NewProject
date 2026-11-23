"use client";

import dynamic from "next/dynamic";

const ExistingSite = dynamic(() => import("../src/main.jsx"), { ssr: false });

export default function HomePage() {
  return <ExistingSite />;
}
