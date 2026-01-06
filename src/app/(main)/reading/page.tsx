import { getPassages } from "@/actions/reading"
import { PassageCard } from "@/components/reading/PassageCard"

export default async function ReadingPage() {
  const passages = await getPassages()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">長文読解問題</h1>

      {passages.length === 0 ? (
        <p className="text-muted-foreground">問題がありません</p>
      ) : (
        <div className="grid gap-4">
          {passages.map((passage) => (
            <PassageCard key={passage.id} passage={passage} />
          ))}
        </div>
      )}
    </div>
  )
}
