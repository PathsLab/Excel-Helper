import { type NextRequest, NextResponse } from "next/server"

// This is a fallback route that processes data locally when the AI model fails
// It implements some basic data analysis functions

export async function POST(request: NextRequest) {
  try {
    const { data, prompt, originalFileName } = await request.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Valid data array is required" }, { status: 400 })
    }

    // Extract keywords from the prompt to determine what operation to perform
    const promptLower = prompt.toLowerCase()

    // Basic operations we can handle without AI
    let processedData = [...data]
    let summary = "Data processed successfully."

    // Simple summarization by grouping
    if (promptLower.includes("summarize") || promptLower.includes("group by")) {
      const groupByField = extractGroupByField(promptLower, Object.keys(data[0]))

      if (groupByField) {
        const grouped = groupBy(data, groupByField)
        processedData = Object.entries(grouped).map(([key, values]) => ({
          [groupByField]: key,
          count: values.length,
          // Add some basic aggregations if there are numeric fields
          ...calculateAggregations(values),
        }))

        summary = `Data summarized by ${groupByField}. ${processedData.length} groups found.`
      }
    }

    // Sort data
    else if (promptLower.includes("sort") || promptLower.includes("order")) {
      const sortField = extractSortField(promptLower, Object.keys(data[0]))

      if (sortField) {
        const isDesc = promptLower.includes("desc") || promptLower.includes("high to low")
        processedData = sortData(data, sortField, isDesc)
        summary = `Data sorted by ${sortField} in ${isDesc ? "descending" : "ascending"} order.`
      }
    }

    // Find top/bottom N
    else if (promptLower.match(/top\s+\d+/) || promptLower.match(/bottom\s+\d+/)) {
      const isTop = promptLower.includes("top")
      const match = promptLower.match(/(?:top|bottom)\s+(\d+)/)
      const limit = match ? Number.parseInt(match[1]) : 5

      const sortField = extractSortField(promptLower, Object.keys(data[0]))

      if (sortField) {
        processedData = sortData(data, sortField, !isTop).slice(0, limit)
        summary = `Showing ${isTop ? "top" : "bottom"} ${limit} records by ${sortField}.`
      }
    }

    // Return the processed data
    return NextResponse.json({
      data: processedData,
      summary,
    })
  } catch (error: any) {
    console.error("Error in analyze-fallback route:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

// Helper functions for data processing

function extractGroupByField(prompt: string, availableFields: string[]): string | null {
  // Try to find "by [field]" pattern
  const byMatch = prompt.match(/by\s+(\w+)/i)
  if (byMatch) {
    const field = byMatch[1].toLowerCase()
    return findClosestField(field, availableFields)
  }

  // If no match, return the first field as default
  return availableFields[0]
}

function extractSortField(prompt: string, availableFields: string[]): string | null {
  // Try to find "by [field]" pattern
  const byMatch = prompt.match(/by\s+(\w+)/i)
  if (byMatch) {
    const field = byMatch[1].toLowerCase()
    return findClosestField(field, availableFields)
  }

  // Look for any field mentioned in the prompt
  for (const field of availableFields) {
    if (prompt.toLowerCase().includes(field.toLowerCase())) {
      return field
    }
  }

  // If no match, return the first field as default
  return availableFields[0]
}

function findClosestField(searchTerm: string, availableFields: string[]): string {
  // Find the field that most closely matches the search term
  let bestMatch = availableFields[0]
  let bestScore = 0

  for (const field of availableFields) {
    const fieldLower = field.toLowerCase()
    if (fieldLower === searchTerm) {
      return field // Exact match
    }

    if (fieldLower.includes(searchTerm) || searchTerm.includes(fieldLower)) {
      const score = Math.min(fieldLower.length, searchTerm.length)
      if (score > bestScore) {
        bestScore = score
        bestMatch = field
      }
    }
  }

  return bestMatch
}

function groupBy(data: any[], field: string): Record<string, any[]> {
  return data.reduce((acc, item) => {
    const key = item[field] || "Unknown"
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {})
}

function calculateAggregations(data: any[]): Record<string, number> {
  const result: Record<string, number> = {}

  if (data.length === 0) return result

  // Find numeric fields
  const numericFields = Object.keys(data[0]).filter((key) => {
    return !isNaN(Number(data[0][key]))
  })

  // Calculate sum and average for each numeric field
  for (const field of numericFields) {
    const sum = data.reduce((acc, item) => {
      return acc + Number(item[field] || 0)
    }, 0)

    result[`sum_${field}`] = sum
    result[`avg_${field}`] = sum / data.length
  }

  return result
}

function sortData(data: any[], field: string, isDesc = false): any[] {
  return [...data].sort((a, b) => {
    const valueA = a[field]
    const valueB = b[field]

    // Check if values are numeric
    const numA = Number(valueA)
    const numB = Number(valueB)

    if (!isNaN(numA) && !isNaN(numB)) {
      return isDesc ? numB - numA : numA - numB
    }

    // String comparison
    const strA = String(valueA).toLowerCase()
    const strB = String(valueB).toLowerCase()

    if (isDesc) {
      return strB.localeCompare(strA)
    } else {
      return strA.localeCompare(strB)
    }
  })
}
