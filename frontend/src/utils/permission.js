export const hasPermission = (user, module, action) => {
  if (!user) return false;

  // role.permissions preferred
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
