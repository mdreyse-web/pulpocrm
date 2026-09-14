import { useState, useRef } from 'react';
import { X, Plus, Tag } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChange, placeholder = 'Agregar etiqueta...', maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-[#9CA3AF]">
        <Tag size={14} />
        Etiquetas
      </label>
      <div
        className="min-h-[42px] px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg flex flex-wrap gap-2 cursor-text transition-colors hover:border-[#3A3D4A]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4A824]/15 text-[#D4A824] text-xs rounded-md border border-[#D4A824]/20"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-[#F0F2F5] transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) addTag(inputValue);
            }}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="bg-transparent text-sm text-[#F0F2F5] placeholder-[#4B5563] outline-none min-w-[100px] flex-1"
          />
        )}
      </div>
      <p className="text-[10px] text-[#4B5563]">{tags.length}/{maxTags} etiquetas. Presiona Enter para agregar.</p>
    </div>
  );
}

export function TagBadge({ tag, onClick }: { tag: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 bg-[#2A2D3A] text-[#9CA3AF] text-[11px] rounded-md border border-[#3A3D4A] ${onClick ? 'cursor-pointer hover:bg-[#D4A824]/15 hover:text-[#D4A824] hover:border-[#D4A824]/20 transition-colors' : ''}`}
    >
      {tag}
    </span>
  );
}

export function TagList({ tags, onTagClick }: { tags: string[]; onTagClick?: (tag: string) => void }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <TagBadge key={tag} tag={tag} onClick={onTagClick ? () => onTagClick(tag) : undefined} />
      ))}
    </div>
  );
}
