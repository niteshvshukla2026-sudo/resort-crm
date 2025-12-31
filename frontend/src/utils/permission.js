// utils/permission.js

export function hasPermission(user, module, action) {
  if (!user) return false;

  // SUPER ADMIN — always allow
  if (
    user.role === "SUPER_ADMIN" ||
    user.role?.key === "SUPER_ADMIN"
  ) {
    return true;
  }

  const permissions =
    user.permissions ||
    user.role?.permissions ||
    [];

  if (!Array.isArray(permissions)) return false;

  const mod = module.toUpperCase();
  const act = action.toUpperCase();

  return permissions.some(
    (p) =>
      p.module === mod &&
      Array.isArray(p.actions) &&
      p.actions.includes(act)
  );
}
