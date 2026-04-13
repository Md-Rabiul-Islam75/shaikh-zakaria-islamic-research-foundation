import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const history = await prisma.classHistory.findMany({
    where: { studentId: id },
    orderBy: { session: "asc" },
  });

  return NextResponse.json(history);
}
