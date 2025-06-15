"use client";
import React, { useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { IOSTag } from "./tag";

interface IOSTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  maxTags?: number;
  readOnly?: boolean;
}

export const IOSTagInput = React.forwardRef<HTMLDivElement, IOSTagInputProps>(
  ({ tags, onChange, placeholder = "Add tags...", label, className, maxTags, readOnly = false }, ref) => {
    const [input, setInput] = useState("");

    const handleAddTag = () => {
      if (input.trim() && !tags.includes(input.trim())) {
        if (maxTags && tags.length >= maxTags) return;
        onChange([...tags, input.trim()]);
        setInput("");
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    };

    const handleRemoveTag = (tagToRemove: string) => {
      onChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
      <div ref={ref} className={cn("w-full space-y-2", className)}>
        {label && (
          <label className="block text-sm font-semibold text-blue-900 mb-1 select-none">
            {label}
          </label>
        )}
        <div className={cn(
          "flex flex-wrap gap-2 p-2 min-h-[48px] bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200",
          readOnly ? "bg-gray-50/50" : "focus-within:ring-2 focus-within:ring-blue-500/20"
        )}>
          {tags.map((tag) => (
            <IOSTag
              key={tag}
              label={tag}
              onRemove={readOnly ? undefined : () => handleRemoveTag(tag)}
            />
          ))}
          {!readOnly && (
            <>
              <div className="flex-1 flex items-center min-w-[120px]">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tags.length === 0 ? placeholder : ""}
                  className="w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
                />
              </div>
              {input.trim() && !tags.includes(input.trim()) && (
                <button
                  onClick={handleAddTag}
                  className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                  disabled={maxTags ? tags.length >= maxTags : false}
                >
                  <Plus className="h-4 w-4 text-blue-600" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);
IOSTagInput.displayName = "IOSTagInput"; 