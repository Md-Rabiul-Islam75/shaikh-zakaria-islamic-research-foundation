import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/auth";

export type ActivityAction =
  | "CREATE_CLASS"
  | "UPDATE_CLASS"
  | "DELETE_CLASS"
  | "CREATE_STUDENT"
  | "UPDATE_STUDENT"
  | "DELETE_STUDENT"
  | "PROMOTE_STUDENTS"
  | "CREATE_TEACHER"
  | "UPDATE_TEACHER"
  | "DELETE_TEACHER"
  | "CREATE_EDITOR";

export type ActivityTargetType = "student" | "teacher" | "class";

// Per-user activity limits — oldest entries are pruned
const LIMIT_BY_ROLE: Record<UserRole, number> = {
  student: 100,
  teacher: 30,
  editor: 100,
  admin: 100,
};

interface LogActivityArgs {
  userId: string;
  userRole: UserRole;
  userName: string;
  action: ActivityAction;
  targetType: ActivityTargetType;
  targetId?: string | null;
  targetName?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(args: LogActivityArgs): Promise<void> {
  const {
    userId,
    userRole,
    userName,
    action,
    targetType,
    targetId,
    targetName,
    metadata,
  } = args;

  try {
    await prisma.activityLog.create({
      data: {
        userId,
        userRole,
        userName,
        action,
        targetType,
        targetId: targetId ?? null,
        targetName: targetName ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Auto-cleanup: keep only the newest N entries per user
    const limit = LIMIT_BY_ROLE[userRole] ?? 50;
    const total = await prisma.activityLog.count({ where: { userId } });
    if (total > limit) {
      const excess = total - limit;
      const oldest = await prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        take: excess,
        select: { id: true },
      });
      if (oldest.length > 0) {
        await prisma.activityLog.deleteMany({
          where: { id: { in: oldest.map((o) => o.id) } },
        });
      }
    }
  } catch (err) {
    // Never break the main action because of logging failure
    console.error("Failed to log activity:", err);
  }
}
