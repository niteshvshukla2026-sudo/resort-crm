import { hasPermission } from "../utils/permission";
import { useAuth } from "../context/AuthContext";

const PermissionGate = ({ module, action, children }) => {
  const { user } = useAuth();

  if (!hasPermission(user, module, action)) return null;

  return children;
};

export default PermissionGate;
