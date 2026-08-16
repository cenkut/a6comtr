import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  action: string;
  actorUserId?: string | null;
  organizationId?: string | null;
  companyId?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      organizationId: input.organizationId ?? null,
      companyId: input.companyId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function listAuditLogs(limit = 50) {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
    include: {
      actor: { select: { id: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
  });
}
