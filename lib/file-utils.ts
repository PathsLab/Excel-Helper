import * as XLSX from "xlsx"

// Read file as text (for CSV files)
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error("Failed to read file"))
      }
    }
    reader.onerror = () => reject(new Error("Error reading file"))
    reader.readAsText(file)
  })
}

// Parse Excel file to CSV
export const parseExcelToCSV = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error("Failed to read file")
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to CSV
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        resolve(csv)
      } catch (error) {
        reject(error || new Error("Error processing Excel file"))
      }
    }
    reader.onerror = () => reject(new Error("Error reading file"))
    reader.readAsArrayBuffer(file)
  })
}

// Parse CSV string to array of objects
export const parseCSV = (csvString: string): any[] => {
  // Simple CSV parser
  const lines = csvString.split("\n")
  const headers = lines[0].split(",").map((header) => header.trim())

  const result = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue

    const obj: Record<string, string> = {}
    const currentLine = lines[i].split(",")

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j]?.trim() || ""
    }

    result.push(obj)
  }

  return result
}

// Download data as CSV
export const downloadCSV = (data: any[], fileName = "download") => {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(","),
    ...data.map((row) => headers.map((header) => JSON.stringify(row[header] || "")).join(",")),
  ]

  const csvString = csvRows.join("\n")
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })

  // Create download link
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${fileName}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Download data as XLSX
export const downloadXLSX = (data: any[], fileName = "download") => {
  if (!data.length) return

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}
