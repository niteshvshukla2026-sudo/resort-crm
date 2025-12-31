export const hasPermission = (user, module, action) => {
  if (!user) return false;

  // 🔥 SUPER ADMIN = ALL ACCESS
  if (
    user.role === "SUPER_ADMIN" ||
    user.role?.name === "SUPER_ADMIN" ||
    user.role?.key === "SUPER_ADMIN"
  ) {
    return true;
  }

  const permissions =
    user.permissions ||
    user.role?.permissions ||
    [];

  return permissions.some(
    (p) =>
      p.module === module &&
      (p.actions?.includes(action) ||
        p.actions?.includes("all"))
  );
};
