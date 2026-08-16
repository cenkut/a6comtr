import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify, withUniqueSuffix } from "@/lib/slug";
import { randomBytes } from "node:crypto";

export async function listOrganizationsForUser(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: { select: { companies: true, memberships: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
    companyCount: m.organization._count.companies,
    memberCount: m.organization._count.memberships,
    createdAt: m.organization.createdAt,
  }));
}

export async function createOrganization(input: {
  userId: string;
  name: string;
}): Promise<{
  id: string;
  name: string;
  slug: string;
  role: "OWNER";
}> {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) {
    throw new AppError(
      "VALIDATION",
      "Organizasyon adı 2–120 karakter olmalıdır.",
      400,
    );
  }

  const slug = await uniqueOrgSlug(name);

  const org = await db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name, slug },
    });
    await tx.membership.create({
      data: {
        userId: input.userId,
        organizationId: organization.id,
        role: "OWNER",
      },
    });
    return organization;
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    role: "OWNER",
  };
}

async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name) || "org";
  let candidate = base;
  for (let i = 0; i < 8; i += 1) {
    const exists = await db.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    candidate = withUniqueSuffix(base, randomBytes(3).toString("hex"));
  }
  return withUniqueSuffix(base, randomBytes(4).toString("hex"));
}
