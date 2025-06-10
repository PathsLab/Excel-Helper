"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileSpreadsheet } from "lucide-react"
import { downloadCSV, downloadXLSX } from "@/lib/file-utils"

interface ResultDisplayProps {
  result: {
    data: any[]
    summary?: string
    fileName: string
  }
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  const [downloadFormat, setDownloadFormat] = useState<"csv" | "xlsx">("csv")

  const handleDownload = () => {
    if (downloadFormat === "csv") {
      downloadCSV(result.data, result.fileName)
    } else {
      downloadXLSX(result.data, result.fileName)
    }
  }

  // Get headers from the first row of data
  const headers = result.data.length > 0 ? Object.keys(result.data[0]) : []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Results</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button
              variant={downloadFormat === "csv" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setDownloadFormat("csv")}
            >
              CSV
            </Button>
            <Button
              variant={downloadFormat === "xlsx" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setDownloadFormat("xlsx")}
            >
              Excel
            </Button>
          </div>
          <Button onClick={handleDownload} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result.summary && (
          <div className="mb-4 p-4 bg-muted rounded-md">
            <p className="text-sm">{result.summary}</p>
          </div>
        )}

        <div className="rounded-md border overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {headers.map((header) => (
                      <TableCell key={`${rowIndex}-${header}`}>{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          <FileSpreadsheet className="inline h-3 w-3 mr-1" />
          {result.data.length} rows processed
        </p>
      </CardContent>
    </Card>
  )
}
