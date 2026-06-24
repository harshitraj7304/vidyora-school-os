import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setUsers(data);
  }

  return (
    <div>
      <h1>Vidyora School OS</h1>

      {users.map((user) => (
        <div key={user.id}>
          <h3>{user.full_name}</h3>
          <p>{user.user_code}</p>
          <p>{user.role}</p>
        </div>
      ))}
    </div>
  );
}

export default App;