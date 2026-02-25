export type Role = "CREATOR" | "ADMIN" | "VIEWER" | "DIRECTOR";

export const ROLE_LABEL: Record<Role, string> = {
  CREATOR: "Creador",
  ADMIN: "Administrador",
  VIEWER: "Visor",
  DIRECTOR: "Director",
};

export type Permission =
  | "DOC_CREATE"
  | "DOC_VIEW_ALL"
  | "DOC_EDIT_ALL"
  | "DOC_VALIDATE"
  | "USERS_MANAGE";

export function hasPermission(role: Role, perm: Permission): boolean {
  switch (role) {
    case "ADMIN":
      return true;
    case "DIRECTOR":
      return perm === "DOC_VALIDATE" || perm === "DOC_EDIT_ALL" || perm === "DOC_VIEW_ALL";
    case "CREATOR":
      return perm === "DOC_CREATE";
    case "VIEWER":
      return false;
  }
}
