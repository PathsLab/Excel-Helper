"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Code, Copy, ActivityIcon as Function, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FormulaGeneratorProps {
  data: any[]
  onApplyFormula: (formula: string, column: string) => void
}

export function FormulaGenerator({ data, onApplyFormula }: FormulaGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formula, setFormula] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [targetColumn, setTargetColumn] = useState("")

  const headers = data.length > 0 ? Object.keys(data[0]) : []

  const handleGenerateFormula = async () => {
    try {
      setLoading(true)
      setError(null)
      setFormula(null)
      setExplanation(null)

      if (!prompt) {
        throw new Error("Please enter a description of the formula you need")
      }

      const response = await fetch("/api/generate-formula", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: data.slice(0, 5), // Send sample data for context
          prompt,
          headers,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate formula")
      }

      setFormula(result.formula)
      setExplanation(result.explanation)

      // Set a default target column if none is selected
      if (!targetColumn && headers.length > 0) {
        setTargetColumn(headers[0])
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the formula")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (formula) {
      navigator.clipboard.writeText(formula)
    }
  }

  const handleApplyFormula = () => {
    if (formula && targetColumn) {
      onApplyFormula(formula, targetColumn)
    }
  }

  const examplePrompts = [
    "Calculate profit margin from revenue and cost columns",
    "Create a formula to categorize values as 'High', 'Medium', or 'Low'",
    "Generate a VLOOKUP formula to match data from another table",
    "Create a conditional formula that highlights outliers",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Function className="h-5 w-5" />
          Formula Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="formula-prompt">Describe the formula you need</Label>
          <div className="flex gap-2">
            <Input
              id="formula-prompt"
              placeholder="e.g., Calculate profit margin from revenue and cost"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleGenerateFormula} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((examplePrompt) => (
              <Button
                key={examplePrompt}
                variant="outline"
                size="sm"
                onClick={() => setPrompt(examplePrompt)}
                className="text-xs"
              >
                {examplePrompt}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {formula && (
          <div className="space-y-4">
            <Tabs defaultValue="formula">
              <TabsList>
                <TabsTrigger value="formula">Formula</TabsTrigger>
                <TabsTrigger value="explanation">Explanation</TabsTrigger>
              </TabsList>
              <TabsContent value="formula" className="space-y-4">
                <div className="relative">
                  <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">{formula}</div>
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy formula</span>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="explanation">
                <div className="bg-muted rounded-md p-4 text-sm">
                  <p>{explanation}</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="target-column">Apply formula to column</Label>
              <div className="flex gap-2">
                <select
                  id="target-column"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                >
                  <option value="">Select a column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                  <option value="__new_column__">Create new column</option>
                </select>
                <Button onClick={handleApplyFormula} disabled={!formula || !targetColumn}>
                  <Code className="mr-2 h-4 w-4" />
                  Apply
                </Button>
              </div>
              {targetColumn === "__new_column__" && (
                <div className="mt-2">
                  <Label htmlFor="new-column-name">New column name</Label>
                  <Input
                    id="new-column-name"
                    placeholder="e.g., profit_margin"
                    onChange={(e) => setTargetColumn(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
