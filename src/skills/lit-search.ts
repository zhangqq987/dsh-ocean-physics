import type { Context } from '@deepseek-ai/cordis'

export const name = 'lit-search'

const SKILL_CONTENT = `# Literature Search Skill (OpenAlex / Crossref)

When the user asks to find papers, search literature, or cite references, use this skill.

## Tool to use
Call ctx.shell to run python -c with the requests library. Do NOT fabricate DOIs or titles.

## OpenAlex (primary, free, no API key)
python -c 'import requests, json; r=requests.get("https://api.openalex.org/works?search=YOUR_QUERY&per_page=5", timeout=20).json(); print(json.dumps([{"doi": w.get("doi"), "title": w["title"], "year": w["publication_year"], "journal": w["host_venue"]["display_name"] if w.get("host_venue") else ""} for w in r["results"]], ensure_ascii=False, indent=2))'

## Crossref (fallback)
python -c 'import requests, json; r=requests.get("https://api.crossref.org/works?query=YOUR_QUERY&rows=5", timeout=20).json(); print(json.dumps([{"doi": i["DOI"], "title": i["title"][0] if i.get("title") else "", "year": i.get("issued",{}).get("date-parts",[[None]])[0][0]} for i in r["message"]["items"]], ensure_ascii=False, indent=2))'

## Rules
- Always show DOI, title, year. If DOI is null, say "no DOI".
- If OpenAlex fails (timeout/network), try Crossref.
- Never invent citations. If both fail, tell the user.
`

export function apply(ctx: Context) {
  ctx.skills?.register({
    name: 'lit-search',
    description: 'Search academic literature via OpenAlex or Crossref APIs. Returns DOI, title, year.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}