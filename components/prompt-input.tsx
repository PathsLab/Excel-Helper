"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, ActivityIcon as Function } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onGenerateFormula: () => void
  isLoading: boolean
}

export function PromptInput({ value, onChange, onSubmit, onGenerateFormula, isLoading }: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const analysisPrompts = [
    "Summarize sales by region",
    "Calculate average revenue by product category",
    "Create a pivot table of customers by country",
    "Find the top 5 performing products",
  ]

  const formulaPrompts = [
    "Calculate profit margin from revenue and cost columns",
    "Create a formula to categorize values as 'High', 'Medium', or 'Low'",
    "Generate a VLOOKUP formula to match data from another table",
    "Create a conditional formula that highlights outliers",
  ]

  return (
    <div className="space-y-4">
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Data Analysis</TabsTrigger>
          <TabsTrigger value="formulas">Formula Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4 pt-4">
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
                Analyze
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Try these analysis examples:</p>
            <div className="flex flex-wrap gap-2">
              {analysisPrompts.map((prompt) => (
                <Button key={prompt} variant="outline" size="sm" onClick={() => onChange(prompt)} className="text-xs">
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="formulas" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="formula-prompt">Describe the formula you need</Label>
            <div className="flex gap-2">
              <Input
                id="formula-prompt"
                placeholder="e.g., Calculate profit margin from revenue and cost"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    onGenerateFormula()
                  }
                }}
                className="flex-1"
              />
              <Button onClick={onGenerateFormula} disabled={isLoading}>
                <Function className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Try these formula examples:</p>
            <div className="flex flex-wrap gap-2">
              {formulaPrompts.map((prompt) => (
                <Button key={prompt} variant="outline" size="sm" onClick={() => onChange(prompt)} className="text-xs">
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
