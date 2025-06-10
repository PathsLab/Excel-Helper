"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { FileUploader } from "@/components/file-uploader"
import { PromptInput } from "@/components/prompt-input"
import { ResultDisplay } from "@/components/result-display"
import { FormulaResultDisplay } from "@/components/formula-result-display"
import { processData } from "@/lib/data-processing"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { applyFormulaToData } from "@/lib/formula-utils"
import { parseCSV } from "@/lib/file-utils"

export function DataProcessor() {
  const [inputMethod, setInputMethod] = useState<"upload" | "paste">("upload")
  const [fileData, setFileData] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<"csv" | "xlsx" | null>(null)
  const [pastedData, setPastedData] = useState("")
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState<any | null>(null)
  const [formulaResult, setFormulaResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileData = (data: string, name: string, type: "csv" | "xlsx") => {
    setFileData(data)
    setFileName(name)
    setFileType(type)
    setError(null)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      setFormulaResult(null)

      const dataToProcess = inputMethod === "upload" ? fileData : pastedData

      if (!dataToProcess) {
        throw new Error("Please upload a file or paste data first")
      }

      if (!prompt) {
        throw new Error("Please enter a prompt describing what you want")
      }

      const processedResult = await processData({
        data: dataToProcess,
        prompt,
        inputType: inputMethod === "upload" ? fileType : "csv",
        fileName: fileName || "data",
      })

      setResult(processedResult)
    } catch (err: any) {
      setError(err.message || "An error occurred while processing your data")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFormula = async () => {
    try {
      setLoading(true)
      setError(null)
      setFormulaResult(null)

      const dataToProcess = inputMethod === "upload" ? fileData : pastedData

      if (!dataToProcess) {
        throw new Error("Please upload a file or paste data first")
      }

      if (!prompt) {
        throw new Error("Please enter a description of the formula you need")
      }

      // Parse the data to get headers and sample data
      const parsedData = parseCSV(dataToProcess)
      const headers = parsedData.length > 0 ? Object.keys(parsedData[0]) : []

      const response = await fetch("/api/generate-formula", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: parsedData.slice(0, 5), // Send sample data for context
          prompt,
          headers,
        }),
      })

      const formulaResponse = await response.json()

      if (!response.ok) {
        throw new Error(formulaResponse.error || "Failed to generate formula")
      }

      setFormulaResult({
        formula: formulaResponse.formula,
        explanation: formulaResponse.explanation,
        headers,
        data: parsedData,
      })
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the formula")
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFormula = (formula: string, column: string) => {
    if (!formulaResult || !formulaResult.data || formulaResult.data.length === 0) {
      setError("No data available to apply formula")
      return
    }

    try {
      // Apply the formula to the data
      const updatedData = applyFormulaToData(formulaResult.data, formula, column)

      // Create a result object similar to analysis results
      const processedResult = {
        data: updatedData,
        summary: `Formula applied to column: ${column}. ${formulaResult.explanation}`,
        fileName: `${fileName?.split(".")[0] || "data"}_with_formula`,
      }

      setResult(processedResult)
      setFormulaResult(null) // Clear formula result after applying
    } catch (err: any) {
      setError(`Error applying formula: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" onValueChange={(v) => setInputMethod(v as "upload" | "paste")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="paste">Paste Data</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 pt-4">
          <FileUploader onFileLoaded={handleFileData} />
          {fileName && (
            <p className="text-sm text-muted-foreground">
              File loaded: <span className="font-medium">{fileName}</span>
            </p>
          )}
        </TabsContent>

        <TabsContent value="paste" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="data">Paste your CSV or tabular data</Label>
            <Textarea
              id="data"
              placeholder="Paste your data here (CSV format preferred)"
              className="min-h-[200px] font-mono text-sm"
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            onGenerateFormula={handleGenerateFormula}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="sr-only">Processing...</span>
        </div>
      )}

      {formulaResult && (
        <FormulaResultDisplay
          formula={formulaResult.formula}
          explanation={formulaResult.explanation}
          headers={formulaResult.headers}
          onApplyFormula={handleApplyFormula}
        />
      )}

      {result && <ResultDisplay result={result} />}
    </div>
  )
}
