import React from "react";
import { useAuth } from "../context/AuthContext";
import { useResort } from "../context/ResortContext";

const Header = () => {
  const { user, logout } = useAuth();
  const { selectedResort, setSelectedResort, allowedResorts } = useResort();

  return (
    <header
      style={{
        padding: 12,
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div>
        Resort:&nbsp;
        <select
          value={selectedResort}
          onChange={(e) => setSelectedResort(e.target.value)}
        >
          <option value="ALL">ALL</option>
          {allowedResorts.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        {user?.name}
        &nbsp;
        <button onClick={logout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
