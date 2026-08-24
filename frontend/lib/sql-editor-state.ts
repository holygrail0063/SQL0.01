export function lastSqlWorkspaceKey(userId: string) {
  return `queryright:sql-editor:${userId}:last-workspace`;
}

export function lessonDraftKey(userId: string, lessonId: string, stageId: string) {
  return `queryright:sql-editor:${userId}:lesson:${lessonId}:${stageId}:draft`;
}

export function lessonHintKey(userId: string, lessonId: string, stageId: string) {
  return `queryright:sql-editor:${userId}:lesson:${lessonId}:${stageId}:hints`;
}

export function lessonResultKey(userId: string, lessonId: string, stageId: string) {
  return `queryright:sql-editor:${userId}:lesson:${lessonId}:${stageId}:result`;
}

export function lessonResultTabKey(userId: string, lessonId: string, stageId: string) {
  return `queryright:sql-editor:${userId}:lesson:${lessonId}:${stageId}:result-tab`;
}

export function lessonTutorKey(userId: string, lessonId: string, stageId: string) {
  return `queryright:sql-editor:${userId}:lesson:${lessonId}:${stageId}:coach-open`;
}

export function challengeDraftKey(userId: string, challengeId: number) {
  return `queryright:sql-editor:${userId}:challenge:${challengeId}:draft`;
}
