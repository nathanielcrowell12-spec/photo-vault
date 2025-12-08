'use client'

import React, { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PeopleTagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
}

export function PeopleTagInput({
  value = [],
  onChange,
  placeholder = 'Add a name...',
  className,
  maxTags = 20
}: PeopleTagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const addTag = (tag: string) => {
    if (!tag) return
    if (value.includes(tag)) return
    if (value.length >= maxTags) return

    onChange([...value, tag])
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div
      className={cn(
        'flex min-h-[42px] w-full flex-wrap gap-2 rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-sm',
        'focus-within:ring-2 focus-within:ring-amber-500/50 focus-within:ring-offset-2 focus-within:ring-offset-neutral-900',
        className
      )}
    >
      {value.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-1 rounded-full hover:bg-amber-500/40 p-0.5 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {value.length < maxTags && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0"
        />
      )}
    </div>
  )
}
