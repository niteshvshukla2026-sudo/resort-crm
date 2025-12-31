export const hasPermission = (user, module, action = "READ") => {
  if (!user) return false;

  // 🔥 SUPER ADMIN = FULL ACCESS
  if (
    user.role === "SUPER_ADMIN" ||
    user.role?.name === "SUPER_ADMIN"
  ) {
    return true;
  }

  return (user.permissions || []).some(
    (p) =>
      p.module === module &&
      p.actions.includes(action)
  );
};
