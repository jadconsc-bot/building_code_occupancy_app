import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { projects } from "../../drizzle/schema";
import { getDb, getProjectMember } from "../db";

type AuthorizationUser = { id: number; role: string };

async function getProjectOwner(projectId: number) {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const [project] = await database
    .select({ userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  }

  return project.userId;
}

export async function assertProjectRoleManager(user: AuthorizationUser, projectId: number) {
  if (user.role === "admin") return;

  const ownerId = await getProjectOwner(projectId);
  if (ownerId === user.id) return;

  const membership = await getProjectMember(projectId, user.id);
  if (membership?.role === "owner") return;

  throw new TRPCError({ code: "FORBIDDEN", message: "Project owner access required" });
}

export async function assertProjectMemberAccess(user: AuthorizationUser, projectId: number) {
  if (user.role === "admin") return;

  const ownerId = await getProjectOwner(projectId);
  if (ownerId === user.id) return;

  const membership = await getProjectMember(projectId, user.id);
  if (membership) return;

  throw new TRPCError({ code: "FORBIDDEN", message: "Project membership required" });
}
