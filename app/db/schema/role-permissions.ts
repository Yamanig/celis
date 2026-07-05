import { pgTable, uuid, text, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { permissions } from "./permissions";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    role: text("role").notNull(),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueRolePermission: uniqueIndex("idx_role_permissions_unique").on(
      table.role,
      table.permissionId
    ),
  })
);
