import { type NextRequest, NextResponse } from "next/server"

interface FormulaRequest {
  data: any[]
  prompt: string
  headers: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: FormulaRequest = await request.json()
    const { data, prompt, headers } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Valid data array is required" }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Generate formula based on the prompt and data
    const result = generateSpreadsheetFormula(prompt, data, headers)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error generating formula:", error)
    return NextResponse.json({ error: error.message || "Failed to generate formula" }, { status: 500 })
  }
}

function generateSpreadsheetFormula(prompt: string, data: any[], headers: string[]) {
  // Analyze the prompt to determine what kind of formula is needed
  const promptLower = prompt.toLowerCase()

  // Check for common formula patterns
  if (promptLower.includes("profit margin") || promptLower.includes("margin")) {
    // Find revenue and cost columns
    const revenueColumn = findColumn(headers, ["revenue", "sales", "income", "price", "amount"])
    const costColumn = findColumn(headers, ["cost", "expense", "cogs", "spending"])

    if (revenueColumn && costColumn) {
      return {
        formula: `=(${revenueColumn} - ${costColumn}) / ${revenueColumn}`,
        explanation: `This formula calculates the profit margin by subtracting the cost (${costColumn}) from revenue (${revenueColumn}), then dividing by revenue. The result is the profit margin as a decimal, which you can format as a percentage in your spreadsheet.`,
      }
    }
  }

  if (promptLower.includes("categorize") || promptLower.includes("category")) {
    // Find a numeric column to categorize
    const valueColumn = findNumericColumn(data, headers)

    if (valueColumn) {
      return {
        formula: `=IF(${valueColumn} > 1000, "High", IF(${valueColumn} > 500, "Medium", "Low"))`,
        explanation: `This formula categorizes values in the ${valueColumn} column as "High" if greater than 1000, "Medium" if greater than 500, and "Low" otherwise. You can adjust the thresholds as needed.`,
      }
    }
  }

  if (promptLower.includes("vlookup") || promptLower.includes("lookup")) {
    return {
      formula: `=VLOOKUP(A2, Table2!A:B, 2, FALSE)`,
      explanation: `This VLOOKUP formula searches for the value in cell A2 within the first column of the range Table2!A:B, and returns the corresponding value from the second column. The FALSE parameter requires an exact match. You'll need to adjust the table reference and columns to match your data.`,
    }
  }

  if (promptLower.includes("outlier") || promptLower.includes("highlight")) {
    // Find a numeric column to analyze
    const valueColumn = findNumericColumn(data, headers)

    if (valueColumn) {
      return {
        formula: `=IF(ABS(${valueColumn} - AVERAGE(${valueColumn}:${valueColumn})) > 2*STDEV(${valueColumn}:${valueColumn}), "Outlier", "Normal")`,
        explanation: `This formula identifies outliers by checking if a value deviates from the average by more than 2 standard deviations. You may need to adjust the range references and threshold based on your data.`,
      }
    }
  }

  if (promptLower.includes("sum") || promptLower.includes("total")) {
    // Find a numeric column to sum
    const valueColumn = findNumericColumn(data, headers)

    if (valueColumn) {
      return {
        formula: `=SUM(${valueColumn}:${valueColumn})`,
        explanation: `This formula calculates the sum of all values in the ${valueColumn} column. You'll need to adjust the range to match your data.`,
      }
    }
  }

  if (promptLower.includes("average") || promptLower.includes("mean")) {
    // Find a numeric column to average
    const valueColumn = findNumericColumn(data, headers)

    if (valueColumn) {
      return {
        formula: `=AVERAGE(${valueColumn}:${valueColumn})`,
        explanation: `This formula calculates the average of all values in the ${valueColumn} column. You'll need to adjust the range to match your data.`,
      }
    }
  }

  if (promptLower.includes("count") || promptLower.includes("frequency")) {
    // Find a column to count
    const column = headers[0] || "A"

    return {
      formula: `=COUNTIF(${column}:${column}, "criteria")`,
      explanation: `This formula counts cells in the ${column} column that match the specified criteria. Replace "criteria" with your specific value or pattern.`,
    }
  }

  if (promptLower.includes("if") || promptLower.includes("condition")) {
    return {
      formula: `=IF(A2>100, "Over Budget", "Within Budget")`,
      explanation: `This IF formula evaluates a condition (A2>100) and returns "Over Budget" if true, or "Within Budget" if false. Adjust the condition and return values based on your needs.`,
    }
  }

  // Default formula if no specific pattern is matched
  return {
    formula: `=IF(A2>B2, A2-B2, "N/A")`,
    explanation: `This is a general formula that compares values in columns A and B, returning the difference if A is greater than B, or "N/A" otherwise. You'll need to customize this formula for your specific needs.`,
  }
}

function findColumn(headers: string[], keywords: string[]): string | null {
  for (const keyword of keywords) {
    const match = headers.find((h) => h.toLowerCase().includes(keyword))
    if (match) {
      // Convert column name to spreadsheet reference (e.g., "revenue" to "A")
      const index = headers.indexOf(match)
      return columnIndexToLetter(index)
    }
  }
  return null
}

function findNumericColumn(data: any[], headers: string[]): string | null {
  for (const header of headers) {
    const hasNumericValues = data.some((row) => !isNaN(Number.parseFloat(row[header])))
    if (hasNumericValues) {
      const index = headers.indexOf(header)
      return columnIndexToLetter(index)
    }
  }
  return "A" // Default to first column if no numeric column found
}

function columnIndexToLetter(index: number): string {
  let letter = ""
  index += 1 // 1-based indexing for Excel columns

  while (index > 0) {
    const remainder = (index - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    index = Math.floor((index - 1) / 26)
  }

  return letter
}
