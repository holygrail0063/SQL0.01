export function lastSqlWorkspaceKey(userId: string) {
  return `queryright:sql-editor:${userId}:last-workspace`;
}

export function lessonDraftKey(userId: string, lessonId: string, stageId: string) {
  return `queryright:sql-editor:${userId}:lesson:${lessonId}:${stageId}:draft`;
}

export function challengeDraftKey(userId: string, challengeId: number) {
  return `queryright:sql-editor:${userId}:challenge:${challengeId}:draft`;
}
