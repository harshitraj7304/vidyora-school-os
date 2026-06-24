export default function DataTable({ columns, data, rowKey = 'id' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-white/[0.08] bg-slate-900/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              className="group hover:bg-white/[0.02] border-b border-white/[0.04] last:border-b-0 transition-all duration-200"
            >
              {columns.map((col) => (
                <td key={col.key} className={`py-4 px-4 text-slate-300 font-medium ${col.className || ""}`}>
                  {col.render ? col.render(row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
