// Simple formula parser and evaluator for spreadsheet-like formulas
export function applyFormulaToData(data: any[], formula: string, targetColumn: string): any[] {
  // Check if we're creating a new column or updating an existing one
  const isNewColumn = !data[0].hasOwnProperty(targetColumn)

  // Process the formula to make it JavaScript-friendly
  const jsFormula = convertToJsFormula(formula)

  // Create a new array with the formula applied
  return data.map((row, index) => {
    // Create a copy of the row
    const newRow = { ...row }

    try {
      // Create a context for formula evaluation
      const context = createEvaluationContext(row, data, index)

      // Evaluate the formula
      const result = evaluateFormula(jsFormula, context)

      // Update the row with the result
      if (isNewColumn) {
        newRow[targetColumn] = result
      } else {
        newRow[targetColumn] = result
      }
    } catch (error) {
      // If there's an error, set the result to an error message
      newRow[targetColumn] = "#ERROR"
      console.error(`Error applying formula to row ${index}:`, error)
    }

    return newRow
  })
}

// Convert Excel-like formula to JavaScript
function convertToJsFormula(formula: string): string {
  // Remove the leading equals sign if present
  let jsFormula = formula.startsWith("=") ? formula.substring(1) : formula

  // Replace Excel functions with JavaScript equivalents
  jsFormula = jsFormula
    .replace(/SUM\(/gi, "sum(")
    .replace(/AVERAGE\(/gi, "average(")
    .replace(/COUNT\(/gi, "count(")
    .replace(/IF\(/gi, "ifFunc(")
    .replace(/AND\(/gi, "and(")
    .replace(/OR\(/gi, "or(")
    .replace(/NOT\(/gi, "not(")
    .replace(/CONCATENATE\(/gi, "concatenate(")
    .replace(/VLOOKUP\(/gi, "vlookup(")
    .replace(/ABS\(/gi, "Math.abs(")
    .replace(/ROUND\(/gi, "Math.round(")
    .replace(/STDEV\(/gi, "stdev(")
    .replace(/COUNTIF\(/gi, "countif(")

  // Replace cell references (e.g., A1, B2) with context references
  jsFormula = jsFormula.replace(/([A-Z]+)(\d+)/g, (match, column, row) => {
    return `getCellValue("${column}", ${row})`
  })

  // Replace column references (e.g., A:A) with context references
  jsFormula = jsFormula.replace(/([A-Z]+):([A-Z]+)/g, (match, startCol, endCol) => {
    return `getColumnRange("${startCol}", "${endCol}")`
  })

  return jsFormula
}

// Create a context with functions and data for formula evaluation
function createEvaluationContext(row: any, data: any[], rowIndex: number) {
  return {
    // Helper function to get a cell value
    getCellValue: (column: string, rowNum: number) => {
      const colIndex = columnLetterToIndex(column)
      const targetRow = data[rowNum - 1] // Convert 1-based to 0-based
      if (!targetRow) return null

      const colName = Object.keys(targetRow)[colIndex]
      return targetRow[colName]
    },

    // Helper function to get a column range
    getColumnRange: (startCol: string, endCol: string) => {
      const startColIndex = columnLetterToIndex(startCol)
      const endColIndex = columnLetterToIndex(endCol)

      const result = []
      for (let i = 0; i < data.length; i++) {
        const rowData = data[i]
        const keys = Object.keys(rowData)

        for (let j = startColIndex; j <= endColIndex; j++) {
          if (j < keys.length) {
            result.push(rowData[keys[j]])
          }
        }
      }

      return result
    },

    // Excel-like functions
    sum: (values: any[]) => {
      if (!Array.isArray(values)) values = [values]
      return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
    },

    average: (values: any[]) => {
      if (!Array.isArray(values)) values = [values]
      const validValues = values.filter((v) => !isNaN(Number(v)))
      return validValues.reduce((sum, val) => sum + Number(val), 0) / (validValues.length || 1)
    },

    count: (values: any[]) => {
      if (!Array.isArray(values)) values = [values]
      return values.length
    },

    ifFunc: (condition: boolean, trueValue: any, falseValue: any) => {
      return condition ? trueValue : falseValue
    },

    and: (...args: boolean[]) => {
      return args.every(Boolean)
    },

    or: (...args: boolean[]) => {
      return args.some(Boolean)
    },

    not: (value: boolean) => {
      return !value
    },

    concatenate: (...args: any[]) => {
      return args.join("")
    },

    vlookup: (lookupValue: any, tableArray: any[][], colIndex: number, exactMatch = false) => {
      for (const row of tableArray) {
        if (
          (exactMatch && row[0] === lookupValue) ||
          (!exactMatch && String(row[0]).toLowerCase().includes(String(lookupValue).toLowerCase()))
        ) {
          return row[colIndex - 1]
        }
      }
      return null
    },

    stdev: (values: any[]) => {
      if (!Array.isArray(values)) values = [values]
      const validValues = values.filter((v) => !isNaN(Number(v))).map(Number)
      const n = validValues.length
      if (n <= 1) return 0

      const mean = validValues.reduce((sum, val) => sum + val, 0) / n
      const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
      return Math.sqrt(variance)
    },

    countif: (range: any[], criteria: any) => {
      if (!Array.isArray(range)) range = [range]

      if (typeof criteria === "string" && criteria.includes("*")) {
        // Handle wildcard matching
        const pattern = new RegExp("^" + criteria.replace(/\*/g, ".*") + "$")
        return range.filter((cell) => pattern.test(String(cell))).length
      } else {
        // Handle exact matching
        return range.filter((cell) => cell === criteria).length
      }
    },

    // Access to current row data
    ...row,

    // Access to Math functions
    Math,
  }
}

// Evaluate the formula using the provided context
function evaluateFormula(formula: string, context: any): any {
  try {
    // Create a function that evaluates the formula in the given context
    const evaluator = new Function(...Object.keys(context), `return ${formula}`)

    // Call the function with the context values
    return evaluator(...Object.values(context))
  } catch (error) {
    console.error("Formula evaluation error:", error)
    throw new Error(`Invalid formula: ${formula}`)
  }
}

// Convert column letter to index (e.g., A -> 0, B -> 1, AA -> 26)
function columnLetterToIndex(column: string): number {
  let result = 0
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64)
  }
  return result - 1 // Convert to 0-based index
}
