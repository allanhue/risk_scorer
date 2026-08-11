"use client";

import { ChevronDown } from "lucide-react";

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export default function Select({ label, value, onChange, options, placeholder, required }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <select
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 bg-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 hover:border-gray-400"
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}