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
  const role = searchParams.get("role");
  const action = searchParams.get("action");
  const targetType = searchParams.get("targetType");
  const userId = searchParams.get("userId");

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20"))
  );

  const where: Record<string, unknown> = {};
  if (role) where.userRole = role;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (userId) where.userId = userId;

  const [activities, total, counts] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    prisma.activityLog.count({ where }),
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
    totalOverall: Object.values(countByRole).reduce((a, b) => a + b, 0),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
