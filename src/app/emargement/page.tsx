import { Suspense } from "react";
import EmargementContenu from "@/components/EmargementContenu";

export default function EmargementPage() {
  return (
    <Suspense fallback={null}>
      <EmargementContenu />
    </Suspense>
  );
}
