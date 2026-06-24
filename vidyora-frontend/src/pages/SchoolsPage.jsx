import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

function SchoolsPage() {
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    const { data, error } = await supabase
      .from("schools")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setSchools(data);
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Schools
      </h1>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
          Registered Schools
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3">School Name</th>
              <th className="text-left py-3">Code</th>
              <th className="text-left py-3">Email</th>
              <th className="text-left py-3">Phone</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {schools.map((school) => (
              <tr
                key={school.id}
                className="border-b border-slate-700"
              >
                <td className="py-3">{school.school_name}</td>
                <td>{school.school_code}</td>
                <td>{school.email}</td>
                <td>{school.phone}</td>
                <td>{school.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SchoolsPage;