import SearchInput from "./SearchInput";

export default function TableToolbar({
  icon: Icon,
  count,
  noun = "item",
  loading,
  search,
  onSearch,
  searchPlaceholder = "Search...",
  actions,
}) {
  const showSearch = onSearch !== undefined;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-800/60">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} className="text-cyan-400 shrink-0" />}
        <span className="font-semibold text-white text-sm">
          {loading
            ? "Loading..."
            : `${count} ${noun}${count !== 1 ? "s" : ""}${search ? " found" : ""}`}
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {showSearch && (
          <SearchInput
            value={search}
            onChange={onSearch}
            placeholder={searchPlaceholder}
          />
        )}
        {actions && <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}
