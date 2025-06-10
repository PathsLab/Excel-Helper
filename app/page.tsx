import { DataProcessor } from "@/components/data-processor"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Data Analyzer</h1>
          <p className="text-muted-foreground">
            Upload your data, ask a question in plain English, and get a downloadable spreadsheet
          </p>
        </div>

        <DataProcessor />
      </div>
    </main>
  )
}
