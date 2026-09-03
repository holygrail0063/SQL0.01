import type { SupabaseClient, User } from "@supabase/supabase-js";
import { allSqlCourses, getCourseForProfile, getLessonStages, type CourseDefinition } from "@/lib/course";
import type { Profile, ProgressRow } from "@/lib/progress";

export const FREE_LEARNING_TASK_LIMIT = 4;

export type CourseAccessDecision =
  | { allowed: true; taskNumber: number; courseId: string; lessonId: string }
  | { allowed: false; code: "COURSE_LOCKED"; message: string; taskNumber?: number; courseId?: string; lessonId?: string };

type AccessProfile = Pick<Profile, "selected_role" | "sql_level"> | null;

export async function requireLearningChallengeAccess(supabase: SupabaseClient, user: User, challengeId: number): Promise<CourseAccessDecision> {
  const [{ data: profile, error: profileError }, { data: progressRows, error: progressError }] = await Promise.all([
    supabase.from("profiles").select("selected_role,sql_level,onboarding_completed").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("user_progress").select("user_id,challenge_id,status,attempt_count,first_started_at,completed_at,updated_at").eq("user_id", user.id),
  ]);

  if (profileError) throw profileError;
  if (progressError) throw progressError;

  return canAccessLearningChallenge(profile as AccessProfile, (progressRows ?? []) as ProgressRow[], challengeId);
}

export function canAccessLearningChallenge(profile: AccessProfile, _progressRows: ProgressRow[], challengeId: number): CourseAccessDecision {
  const course = getCourseForProfile(profile);
  if (!course) {
    return {
      allowed: false,
      code: "COURSE_LOCKED",
      message: "This learning path is not available yet.",
    };
  }

  const position = findChallengeTaskPosition(course, challengeId);
  if (!position) {
    return {
      allowed: false,
      code: "COURSE_LOCKED",
      message: "This task is not part of your current learning path.",
      courseId: course.id,
    };
  }

  if (position.taskNumber <= FREE_LEARNING_TASK_LIMIT) {
    return {
      allowed: true,
      taskNumber: position.taskNumber,
      courseId: course.id,
      lessonId: position.lessonId,
    };
  }

  return {
    allowed: false,
    code: "COURSE_LOCKED",
    message: "This task is locked on the free plan.",
    taskNumber: position.taskNumber,
    courseId: course.id,
    lessonId: position.lessonId,
  };
}

export function findChallengeTaskPosition(course: CourseDefinition, challengeId: number) {
  let taskNumber = 0;
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      for (const stage of getLessonStages(lesson)) {
        if (!stage.challengeId) continue;
        taskNumber += 1;
        if (stage.challengeId === challengeId) {
          return { taskNumber, courseId: course.id, moduleId: module.id, lessonId: lesson.id, stageId: stage.id };
        }
      }
    }
  }
  return null;
}

export function firstAccessibleChallengeIds(course = allSqlCourses()[0], limit = FREE_LEARNING_TASK_LIMIT) {
  const ids: number[] = [];
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      for (const stage of getLessonStages(lesson)) {
        if (!stage.challengeId) continue;
        ids.push(stage.challengeId);
        if (ids.length === limit) return ids;
      }
    }
  }
  return ids;
}
