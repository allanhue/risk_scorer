"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
}

export default function Autocomplete({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered =
    value.trim() === ""
      ? suggestions
      : suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 hover:border-gray-400"
      />

      {suggestions.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-700">
          <Sparkles className="h-3 w-3" />
          {filtered.length > 0 ? "Suggestions available" : "No matching suggestions — your entry is fine"}
        </div>
      )}

      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
              className="px-3.5 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 cursor-pointer transition"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}