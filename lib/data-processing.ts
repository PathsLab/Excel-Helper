"use client"

import { parseCSV } from "./file-utils"

interface ProcessDataParams {
  data: string
  prompt: string
  inputType: "csv" | "xlsx" | null
  fileName: string
}

export async function processData({ data, prompt, inputType, fileName }: ProcessDataParams) {
  try {
    // Parse the data to JSON
    const parsedData = parseCSV(data)

    if (!parsedData.length) {
      throw new Error("No data found or invalid data format")
    }

    console.log("Processing data locally with AI-enhanced analysis...")

    // Prepare the payload
    const payload = {
      data: parsedData,
      prompt: prompt,
      originalFileName: fileName,
    }

    // Call our enhanced API
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()
    console.log("Analysis complete:", result)

    if (!response.ok) {
      throw new Error(result.error || `Server error: ${response.status}`)
    }

    // Return the processed data with enhanced summary
    return {
      data: result.data || [],
      summary: result.summary || "Analysis completed successfully with smart local processing",
      fileName: `${fileName.split(".")[0]}_analyzed`,
    }
  } catch (error: any) {
    console.error("Error processing data:", error)
    throw new Error(error.message || "Failed to process data. Please try again.")
  }
}
