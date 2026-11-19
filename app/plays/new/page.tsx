import type { Metadata } from "next";
import PlayForm from "@/components/PlayForm";

export const metadata: Metadata = { title: "Create a play" };

export default function NewPlayPage() {
  return <PlayForm />;
}
