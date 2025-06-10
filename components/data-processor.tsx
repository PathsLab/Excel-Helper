"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { FileUploader } from "@/components/file-uploader"
import { PromptInput } from "@/components/prompt-input"
import { ResultDisplay } from "@/components/result-display"
import { processData } from "@/lib/data-processing"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DataProcessor() {
  const [inputMethod, setInputMethod] = useState<"upload" | "paste">("upload")
  const [fileData, setFileData] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<"csv" | "xlsx" | null>(null)
  const [pastedData, setPastedData] = useState("")
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState<any | null>(null)
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
          <PromptInput value={prompt} onChange={setPrompt} onSubmit={handleSubmit} isLoading={loading} />
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
          <span className="sr-only">Processing data...</span>
        </div>
      )}

      {result && <ResultDisplay result={result} />}
    </div>
  )
}
