import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export function EmptyPropertyState() {
  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 border-dashed border-slate-300 dark:border-slate-700">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <Home className="h-16 w-16 mb-4 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
        
        <h3 className="text-xl font-bold tracking-tight mb-2">
          Let's set up your first property
        </h3>
        
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Add a property to start tracking units, inviting tenants, and managing maintenance requests.
        </p>
        
        <Button className="bg-amber-600 hover:bg-amber-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
          Add Property
        </Button>
      </CardContent>
    </Card>
  )
}
