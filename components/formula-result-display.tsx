"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Code, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FormulaResultDisplayProps {
  formula: string
  explanation: string
  headers: string[]
  onApplyFormula: (formula: string, column: string) => void
}

export function FormulaResultDisplay({ formula, explanation, headers, onApplyFormula }: FormulaResultDisplayProps) {
  const [targetColumn, setTargetColumn] = useState("")
  const [newColumnName, setNewColumnName] = useState("")
  const [applied, setApplied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formula)
  }

  const handleApplyFormula = () => {
    const columnToUse = targetColumn === "__new_column__" ? newColumnName : targetColumn
    if (formula && columnToUse) {
      onApplyFormula(formula, columnToUse)
      setApplied(true)
      setTimeout(() => setApplied(false), 2000) // Reset after 2 seconds
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Generated Formula</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="formula">
          <TabsList>
            <TabsTrigger value="formula">Formula</TabsTrigger>
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
          </TabsList>
          <TabsContent value="formula" className="space-y-4">
            <div className="relative">
              <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto border">{formula}</div>
              <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy formula</span>
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="explanation">
            <div className="bg-muted rounded-md p-4 text-sm border">
              <p>{explanation}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-3 border-t pt-4">
          <Label htmlFor="target-column">Apply formula to column</Label>
          <div className="space-y-3">
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

            {targetColumn === "__new_column__" && (
              <div>
                <Label htmlFor="new-column-name">New column name</Label>
                <Input
                  id="new-column-name"
                  placeholder="e.g., profit_margin"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <Button
              onClick={handleApplyFormula}
              disabled={!formula || !targetColumn || (targetColumn === "__new_column__" && !newColumnName)}
              className="w-full"
            >
              {applied ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Applied!
                </>
              ) : (
                <>
                  <Code className="mr-2 h-4 w-4" />
                  Apply Formula
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
