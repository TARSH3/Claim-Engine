import { Suspense } from "react";
import ClaimReview from "@/components/adjuster/ClaimReview";

async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClaimReview id={id} />;
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <Review params={props.params} />
    </Suspense>
  );
}
