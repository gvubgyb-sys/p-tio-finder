import MapaPatios from "@/components/MapaPatios";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: "hsl(var(--navy-deep))" }} className="shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--orange))" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">
                Pátios de Apreensão
              </h1>
              <p className="text-[10px] sm:text-xs text-white/60 mt-0.5">
                Localize o pátio mais próximo
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/90"
            style={{ background: "hsl(var(--orange) / 0.2)", border: "1px solid hsl(var(--orange) / 0.3)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "hsl(var(--orange))" }}
            />
            5 pátios ativos
          </div>
        </div>
      </header>

      {/* ── Hero compacto ─────────────────────────────────────────────────── */}
      <div
        className="py-5 px-4 text-center"
        style={{
          background: "linear-gradient(180deg, hsl(var(--navy-deep) / 0.06) 0%, transparent 100%)",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
          Encontre o Pátio{" "}
          <span style={{ color: "hsl(var(--orange))" }}>mais próximo</span>
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-sm mx-auto">
          Permita sua localização e veja a rota até o pátio em 1 clique.
        </p>
      </div>

      {/* ── Mapa ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4">
        <MapaPatios />
      </main>

      {/* ── Aviso API ─────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-3 sm:px-4 pb-4">
        <div
          className="rounded-xl p-3 flex items-start gap-2.5 text-xs"
          style={{
            background: "hsl(var(--orange) / 0.06)",
            border: "1px solid hsl(var(--orange) / 0.25)",
          }}
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--orange))" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Configure a API Key:</strong> crie{" "}
            <code className="bg-muted px-1 rounded">.env</code> com{" "}
            <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_API_KEY=sua_chave</code>
            {" "}e ative Maps JS, Geocoding e Directions no Google Cloud Console.
          </span>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pátios de Apreensão
        </div>
      </footer>
    </div>
  );
};

export default Index;
