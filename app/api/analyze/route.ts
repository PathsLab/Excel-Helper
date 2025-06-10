import { type NextRequest, NextResponse } from "next/server"

interface AnalyzeRequest {
  data: any[]
  prompt: string
  originalFileName: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = "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"

    const body: AnalyzeRequest = await request.json()
    const { data, prompt, originalFileName } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Valid data array is required" }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // First, try to use Hugging Face's serverless inference
    try {
      const result = await callHuggingFaceAPI(data, prompt, apiKey)
      if (result) {
        return NextResponse.json(result)
      }
    } catch (error) {
      console.log("Hugging Face API failed, using enhanced local processing")
    }

    // Enhanced local processing with AI-like intelligence
    return NextResponse.json(await enhancedLocalProcessing(data, prompt))
  } catch (error: any) {
    console.error("Error in analyze route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function callHuggingFaceAPI(data: any[], prompt: string, apiKey: string) {
  // Use a simple but reliable model
  const model = "microsoft/DialoGPT-medium"

  const sampleData = data.slice(0, 5)
  const headers = Object.keys(data[0])

  const contextPrompt = `Analyze this data and ${prompt}. 
Data columns: ${headers.join(", ")}
Sample: ${JSON.stringify(sampleData)}
Provide analysis:`

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: contextPrompt,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          do_sample: true,
        },
        options: {
          wait_for_model: true,
        },
      }),
    })

    if (response.ok) {
      const result = await response.json()
      const analysis = Array.isArray(result) ? result[0]?.generated_text : result.generated_text

      if (analysis) {
        return {
          data: smartProcessData(data, prompt),
          summary: `AI Analysis: ${analysis.replace(contextPrompt, "").trim().slice(0, 300)}`,
        }
      }
    }
  } catch (error) {
    console.log("HF API call failed:", error)
  }

  return null
}

async function enhancedLocalProcessing(data: any[], prompt: string) {
  const processedResult = smartProcessData(data, prompt)
  const insights = generateInsights(data, prompt)

  return {
    data: processedResult.data,
    summary: `Smart Analysis: ${processedResult.summary} ${insights}`,
  }
}

function smartProcessData(data: any[], prompt: string) {
  const promptLower = prompt.toLowerCase()
  const headers = Object.keys(data[0])

  // Advanced pattern matching for different analysis types

  // 1. Summarization and Grouping
  if (promptLower.match(/(summarize|group|aggregate|count)/)) {
    const groupField = findBestGroupingField(headers, promptLower)
    const grouped = groupByField(data, groupField)

    return {
      data: Object.entries(grouped).map(([key, items]: [string, any]) => ({
        [groupField]: key,
        count: items.length,
        percentage: ((items.length / data.length) * 100).toFixed(1) + "%",
        ...calculateNumericAggregates(items, headers),
      })),
      summary: `Grouped ${data.length} records by ${groupField} into ${Object.keys(grouped).length} categories.`,
    }
  }

  // 2. Top/Bottom N analysis
  const topMatch = promptLower.match(/(top|bottom|highest|lowest|best|worst)\s*(\d+)?/)
  if (topMatch) {
    const isTop = ["top", "highest", "best"].includes(topMatch[1])
    const limit = Number.parseInt(topMatch[2]) || 5
    const sortField = findBestSortField(headers, promptLower)

    const sorted = [...data].sort((a, b) => {
      const valueA = Number.parseFloat(a[sortField]) || 0
      const valueB = Number.parseFloat(b[sortField]) || 0
      return isTop ? valueB - valueA : valueA - valueB
    })

    return {
      data: sorted.slice(0, limit),
      summary: `Showing ${isTop ? "top" : "bottom"} ${limit} records sorted by ${sortField}.`,
    }
  }

  // 3. Statistical analysis
  if (promptLower.match(/(average|mean|median|sum|total|statistics)/)) {
    const numericFields = findNumericFields(data, headers)
    const stats = calculateStatistics(data, numericFields)

    return {
      data: [stats],
      summary: `Statistical analysis of ${numericFields.length} numeric fields across ${data.length} records.`,
    }
  }

  // 4. Filtering and search
  if (promptLower.match(/(filter|where|find|search|contains)/)) {
    const filtered = intelligentFilter(data, promptLower)
    return {
      data: filtered,
      summary: `Filtered data based on criteria, showing ${filtered.length} of ${data.length} records.`,
    }
  }

  // 5. Comparison analysis
  if (promptLower.match(/(compare|vs|versus|difference)/)) {
    const comparison = createComparison(data, headers)
    return {
      data: comparison,
      summary: `Comparative analysis showing key differences and patterns.`,
    }
  }

  // Default: Smart sample with insights
  return {
    data: data.slice(0, 20),
    summary: `Showing sample of ${Math.min(20, data.length)} records from ${data.length} total records.`,
  }
}

function findBestGroupingField(headers: string[], prompt: string): string {
  // Look for field names mentioned in the prompt
  for (const header of headers) {
    if (prompt.includes(header.toLowerCase())) {
      return header
    }
  }

  // Prefer categorical fields (non-numeric)
  const categoricalFields = headers.filter((h) =>
    h.toLowerCase().match(/(category|type|status|region|country|department|group)/),
  )

  if (categoricalFields.length > 0) {
    return categoricalFields[0]
  }

  return headers[0]
}

function findBestSortField(headers: string[], prompt: string): string {
  // Look for numeric fields mentioned in prompt
  const numericKeywords = ["price", "cost", "amount", "value", "revenue", "sales", "quantity", "score", "rating"]

  for (const keyword of numericKeywords) {
    if (prompt.includes(keyword)) {
      const field = headers.find((h) => h.toLowerCase().includes(keyword))
      if (field) return field
    }
  }

  // Find first numeric field
  const numericField = headers.find((h) =>
    h.toLowerCase().match(/(price|cost|amount|value|revenue|sales|quantity|score|rating|number|count)/),
  )
  if (numericField) return numericField

  return headers[0]
}

function findNumericFields(data: any[], headers: string[]): string[] {
  return headers.filter((header) => {
    const sample = data.slice(0, 10)
    const numericCount = sample.filter((row) => !isNaN(Number.parseFloat(row[header]))).length
    return numericCount > sample.length * 0.7 // 70% numeric values
  })
}

function groupByField(data: any[], field: string): Record<string, any[]> {
  return data.reduce((acc, item) => {
    const key = item[field] || "Unknown"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

function calculateNumericAggregates(items: any[], headers: string[]): Record<string, any> {
  const numericFields = findNumericFields(items, headers)
  const aggregates: Record<string, any> = {}

  numericFields.forEach((field) => {
    const values = items.map((item) => Number.parseFloat(item[field])).filter((v) => !isNaN(v))
    if (values.length > 0) {
      aggregates[`avg_${field}`] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      aggregates[`sum_${field}`] = values.reduce((a, b) => a + b, 0).toFixed(2)
      aggregates[`max_${field}`] = Math.max(...values)
      aggregates[`min_${field}`] = Math.min(...values)
    }
  })

  return aggregates
}

function calculateStatistics(data: any[], numericFields: string[]): Record<string, any> {
  const stats: Record<string, any> = { metric: "Statistics" }

  numericFields.forEach((field) => {
    const values = data.map((item) => Number.parseFloat(item[field])).filter((v) => !isNaN(v))
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / values.length
      const sortedValues = values.sort((a, b) => a - b)
      const median = sortedValues[Math.floor(sortedValues.length / 2)]

      stats[`${field}_count`] = values.length
      stats[`${field}_sum`] = sum.toFixed(2)
      stats[`${field}_average`] = mean.toFixed(2)
      stats[`${field}_median`] = median
      stats[`${field}_min`] = Math.min(...values)
      stats[`${field}_max`] = Math.max(...values)
    }
  })

  return stats
}

function intelligentFilter(data: any[], prompt: string): any[] {
  // Extract potential filter criteria from prompt
  const words = prompt.toLowerCase().split(/\s+/)

  return data
    .filter((item) => {
      return Object.values(item).some((value) => {
        const valueStr = String(value).toLowerCase()
        return words.some((word) => word.length > 3 && valueStr.includes(word))
      })
    })
    .slice(0, 50) // Limit results
}

function createComparison(data: any[], headers: string[]): any[] {
  const numericFields = findNumericFields(data, headers)
  const categoricalField = headers.find((h) => !numericFields.includes(h)) || headers[0]

  const groups = groupByField(data, categoricalField)

  return Object.entries(groups).map(([key, items]: [string, any]) => {
    const result: Record<string, any> = { [categoricalField]: key, count: items.length }

    numericFields.forEach((field) => {
      const values = items.map((item) => Number.parseFloat(item[field])).filter((v) => !isNaN(v))
      if (values.length > 0) {
        result[`avg_${field}`] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      }
    })

    return result
  })
}

function generateInsights(data: any[], prompt: string): string {
  const insights = []
  const headers = Object.keys(data[0])
  const numericFields = findNumericFields(data, headers)

  // Data size insights
  if (data.length > 1000) {
    insights.push(`Large dataset with ${data.length} records.`)
  }

  // Field insights
  if (numericFields.length > 0) {
    insights.push(`Found ${numericFields.length} numeric fields for analysis.`)
  }

  // Pattern insights
  const uniqueValues = headers.map((h) => new Set(data.map((item) => item[h])).size)
  const mostDiverse = headers[uniqueValues.indexOf(Math.max(...uniqueValues))]
  insights.push(`Most diverse field: ${mostDiverse}.`)

  return insights.join(" ")
}
