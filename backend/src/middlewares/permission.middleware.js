/**
 * 🔑 PERMISSION CHECK MIDDLEWARE
 *
 * Usage:
 * checkPermission("REQUISITIONS", "CREATE")
 */
export const checkPermission = (module, action) => {
  return (req, res, next) => {
    try {
      const role = req.user?.role;

      if (!role) {
        return res.status(403).json({
          message: "Role not found in request",
        });
      }

      // ✅ SUPER_ADMIN bypass
      if (role.key === "SUPER_ADMIN" || role.type === "SYSTEM") {
        return next();
      }

      const permissions = role.permissions || [];

      const modulePerm = permissions.find(
        (p) => p.module === module
      );

      if (!modulePerm) {
        return res.status(403).json({
          message: `No access to module ${module}`,
        });
      }

      if (!modulePerm.actions.includes(action)) {
        return res.status(403).json({
          message: `Action ${action} not allowed on ${module}`,
        });
      }

      next();
    } catch (err) {
      console.error("PERMISSION ERROR ❌", err);
      return res.status(403).json({
        message: "Permission check failed",
      });
    }
  };
};
