import { AppShell } from "@/components/AppShell";
import { ChallengeWorkspace } from "@/components/ChallengeWorkspace";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challengeId = Number(id);

  return (
    <ProtectedRoute>
      <AppShell>
        <ChallengeWorkspace challengeId={Number.isFinite(challengeId) ? challengeId : 1} />
      </AppShell>
    </ProtectedRoute>
  );
}
