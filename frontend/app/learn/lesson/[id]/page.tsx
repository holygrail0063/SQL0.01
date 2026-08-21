import { AppShell } from "@/components/AppShell";
import { LessonWorkspace } from "@/components/LessonWorkspace";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AppShell>
        <LessonWorkspace lessonId={id} />
      </AppShell>
    </ProtectedRoute>
  );
}
