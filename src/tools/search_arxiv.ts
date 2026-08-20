import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"

export function registerSearchArxivTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "search_arxiv",
    description: "Search arXiv for recent preprints matching a query. Returns titles, authors, and abstracts.",
    parameters: {
      query: { type: "string", required: true, description: "Search query, e.g. mixed layer depth Yellow Sea" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      try {
        const url = "http://export.arxiv.org/api/query?search_query=all:" + encodeURIComponent(args.query) + "&max_results=5&sortBy=submittedDate&sortOrder=descending"
        const res = await fetch(url)
        const xml = await res.text()
        const titles = [...xml.matchAll(/<title>(.*?)<\/title>/g)].slice(1).map(m => m[1].trim())
        const ids = [...xml.matchAll(/<id>(.*?)<\/id>/g)].map(m => m[1].trim())
        const summaries = [...xml.matchAll(/<summary>(.*?)<\/summary>/g)].map(m => m[1].trim().slice(0, 120))
        if (titles.length === 0) return "No results found."
        let out = "# arXiv Results\n\n"
        for (let i = 0; i < titles.length; i++) {
          out += `## ${i + 1}. ${titles[i]}\n**ID:** ${ids[i]}\n${summaries[i]}...\n\n`
        }
        return out
      } catch (e: any) { return "Error: " + e.message }
    },
  }))
}