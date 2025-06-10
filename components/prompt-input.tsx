"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function PromptInput({ value, onChange, onSubmit, isLoading }: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const examplePrompts = [
    "Summarize sales by region",
    "Calculate average revenue by product category",
    "Create a pivot table of customers by country",
    "Find the top 5 performing products",
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">What would you like to do with this data?</Label>
        <div className="flex gap-2">
          <Input
            id="prompt"
            placeholder="e.g., Summarize sales by region"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={onSubmit} disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <Button key={prompt} variant="outline" size="sm" onClick={() => onChange(prompt)} className="text-xs">
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
