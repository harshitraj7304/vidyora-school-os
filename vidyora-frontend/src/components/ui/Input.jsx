import { forwardRef } from "react";

/**
 * Unified Input component.
 *
 * @param {string}  label       — Field label shown above
 * @param {string}  error       — Error string shown below (turns border red)
 * @param {string}  helper      — Helper/hint text shown below
 * @param {React.ComponentType} iconLeft  — Lucide icon on the left inside input
 * @param {React.ComponentType} iconRight — Lucide icon on the right inside input
 * @param {React.ReactNode}     suffix    — Node rendered after input (e.g. copy button)
 * @param {string}  id          — HTML id (also used for label htmlFor)
 * @param {boolean} required    — Shows asterisk on label
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helper,
    iconLeft: IconLeft,
    iconRight: IconRight,
    suffix,
    id,
    required,
    disabled,
    className = "",
    containerClassName = "",
    ...rest
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-300"
        >
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {IconLeft && (
          <IconLeft
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none shrink-0"
          />
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={[
            "input-base",
            IconLeft ? "!pl-10" : "!pl-3.5",
            IconRight || suffix ? "!pr-10" : "!pr-3.5",
            error ? "input-error" : "",
            disabled ? "opacity-50 cursor-not-allowed" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />

        {(IconRight || suffix) && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-500">
            {IconRight && <IconRight size={15} />}
            {suffix}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-xs text-slate-500 mt-1">{helper}</p>
      )}
    </div>
  );
});

export default Input;
