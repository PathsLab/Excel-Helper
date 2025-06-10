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

    // Use a simple, reliable model for text generation
    const model = "gpt2"

    // Create a simple prompt
    const simplePrompt = `Data analysis task: ${prompt}\nData sample: ${JSON.stringify(data.slice(0, 3))}\nAnalysis:`

    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: simplePrompt,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            return_full_text: false,
          },
          options: {
            wait_for_model: true,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const analysis = Array.isArray(result) ? result[0]?.generated_text || "" : result.generated_text || ""

        // Return processed data with AI insight
        return NextResponse.json({
          data: processDataBasedOnPrompt(data, prompt),
          summary: `AI Insight: ${analysis.slice(0, 200)}`,
        })
      }
    } catch (error) {
      console.log("AI model failed, using local processing")
    }

    // Fallback to local processing
    return NextResponse.json({
      data: processDataBasedOnPrompt(data, prompt),
      summary: "Data processed using local analysis (AI unavailable)",
    })
  } catch (error: any) {
    console.error("Error in analyze-simple route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function processDataBasedOnPrompt(data: any[], prompt: string) {
  const promptLower = prompt.toLowerCase()

  // Summarize/Group by first column
  if (promptLower.includes("summarize") || promptLower.includes("group")) {
    const firstKey = Object.keys(data[0])[0]
    const counts: Record<string, number> = {}

    data.forEach((item) => {
      const key = item[firstKey] || "Unknown"
      counts[key] = (counts[key] || 0) + 1
    })

    return Object.entries(counts).map(([key, count]) => ({
      [firstKey]: key,
      count: count,
    }))
  }

  // Top N
  if (promptLower.includes("top")) {
    const match = promptLower.match(/top\s+(\d+)/)
    const limit = match ? Number.parseInt(match[1]) : 5
    return data.slice(0, limit)
  }

  // Sort by first numeric column
  if (promptLower.includes("sort")) {
    const numericKey = Object.keys(data[0]).find((key) => !isNaN(Number(data[0][key])))

    if (numericKey) {
      return [...data].sort((a, b) => Number(b[numericKey]) - Number(a[numericKey]))
    }
  }

  // Default: return first 20 rows
  return data.slice(0, 20)
}
