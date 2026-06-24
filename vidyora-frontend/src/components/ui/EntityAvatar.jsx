import { useState, useEffect } from "react";

export default function EntityAvatar({ name, imageUrl, size = "md" }) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the image URL changes
  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  const initials = name
    ? name.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  let sizeClasses = "w-9 h-9 rounded-xl text-xs font-bold text-cyan-400 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-slate-700/40";
  if (size === "sm") {
    sizeClasses = "w-8 h-8 rounded-lg text-xs font-semibold text-cyan-400 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-slate-700/40";
  } else if (size === "lg") {
    sizeClasses = "w-20 h-20 rounded-2xl text-3xl font-extrabold text-slate-950 bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20";
  }

  if (imageUrl && !hasError) {
    return (
      <img
        src={imageUrl}
        alt={name || "Avatar"}
        className={`object-cover shrink-0 ${sizeClasses}`}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center shrink-0 ${sizeClasses}`}>
      {initials}
    </div>
  );
}

