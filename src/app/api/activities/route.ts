import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only admins can see the full activity log
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can view the activity log" },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role"); // student | teacher | admin
  const action = searchParams.get("action"); // CREATE_STUDENT, etc.
  const targetType = searchParams.get("targetType"); // student | teacher | class
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: Record<string, unknown> = {};
  if (role) where.userRole = role;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (userId) where.userId = userId;

  const [activities, counts] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            imageUrl: true,
          },
        },
      },
    }),
    prisma.activityLog.groupBy({
      by: ["userRole"],
      _count: true,
    }),
  ]);

  const countByRole: Record<string, number> = {};
  for (const c of counts) {
    countByRole[c.userRole] = c._count;
  }

  return NextResponse.json({
    activities,
    countByRole,
    total: Object.values(countByRole).reduce((a, b) => a + b, 0),
  });
}
