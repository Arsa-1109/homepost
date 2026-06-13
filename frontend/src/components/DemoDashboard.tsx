export function DemoDashboard() {
  return (
    <div className="w-full max-w-5xl mx-auto aspect-video rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-none ring-1 ring-border/50 glass-panel">
      {/* Top Navigation */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-muted/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm bg-primary/80"></div>
          </div>
          <div className="w-32 h-4 rounded-full bg-muted-foreground/40"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted-foreground/30"></div>
          <div className="w-8 h-8 rounded-full bg-muted-foreground/30"></div>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30"></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border p-4 flex flex-col gap-4 bg-muted/20 hidden md:flex">
          <div className="w-full h-8 rounded-md bg-muted-foreground/20 mb-4"></div>
          <div className="w-3/4 h-6 rounded-md bg-primary/10 border border-primary/20"></div>
          <div className="w-full h-6 rounded-md bg-muted-foreground/20"></div>
          <div className="w-5/6 h-6 rounded-md bg-muted-foreground/20"></div>
          <div className="w-full h-6 rounded-md bg-muted-foreground/20"></div>
          <div className="mt-auto w-full h-10 rounded-md bg-muted-foreground/20"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 bg-background">
          <div className="flex items-center justify-between">
            <div className="w-48 h-8 rounded-md bg-foreground/20"></div>
            <div className="w-32 h-10 rounded-md bg-primary/20 border border-primary/30"></div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 rounded-lg border border-border bg-card p-5 flex flex-col justify-between shadow-sm">
              <div className="w-24 h-4 rounded-full bg-muted-foreground/40"></div>
              <div className="w-32 h-8 rounded-md bg-foreground/30"></div>
            </div>
            <div className="h-32 rounded-lg border border-border bg-card p-5 flex flex-col justify-between shadow-sm">
              <div className="w-20 h-4 rounded-full bg-muted-foreground/40"></div>
              <div className="w-24 h-8 rounded-md bg-foreground/30"></div>
            </div>
            <div className="h-32 rounded-lg border border-border bg-card p-5 flex flex-col justify-between shadow-sm">
              <div className="w-28 h-4 rounded-full bg-muted-foreground/40"></div>
              <div className="w-16 h-8 rounded-md bg-foreground/30"></div>
            </div>
          </div>

          {/* Main Chart/Table Area */}
          <div className="flex-1 rounded-lg border border-border bg-card p-5 flex flex-col gap-4 shadow-sm">
            <div className="w-40 h-5 rounded-full bg-muted-foreground/40"></div>
            <div className="flex-1 rounded-md border border-border bg-muted/30 flex flex-col justify-between p-4">
              <div className="w-full h-px bg-border/80"></div>
              <div className="w-full h-px bg-border/80"></div>
              <div className="w-full h-px bg-border/80"></div>
              <div className="w-full h-px bg-border/80"></div>
              <div className="w-full h-px bg-border/80"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
