"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileIcon, UploadIcon } from "lucide-react"
import { readFileAsText, parseExcelToCSV } from "@/lib/file-utils"

interface FileUploaderProps {
  onFileLoaded: (data: string, name: string, type: "csv" | "xlsx") => void
}

export function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0])
    }
  }

  const processFile = async (file: File) => {
    try {
      const fileName = file.name
      const fileExtension = fileName.split(".").pop()?.toLowerCase()

      if (fileExtension === "csv") {
        const csvData = await readFileAsText(file)
        onFileLoaded(csvData, fileName, "csv")
      } else if (fileExtension === "xlsx") {
        const csvData = await parseExcelToCSV(file)
        onFileLoaded(csvData, fileName, "xlsx")
      } else {
        throw new Error("Unsupported file format. Please upload a CSV or Excel (.xlsx) file.")
      }
    } catch (error: any) {
      console.error("Error processing file:", error)
      alert(error.message || "Error processing file")
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-primary/10 p-3">
          <UploadIcon className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Upload your data file</h3>
          <p className="text-sm text-muted-foreground">Drag and drop your CSV or Excel file here, or click to browse</p>
        </div>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
          <FileIcon className="h-4 w-4" />
          Browse Files
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.xlsx" className="hidden" />
        <p className="text-xs text-muted-foreground">Supported formats: CSV, Excel (.xlsx)</p>
      </div>
    </div>
  )
}
