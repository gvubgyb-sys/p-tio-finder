import MapaPatios from "@/components/MapaPatios";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-navy-deep text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight leading-none">
                Pátios de Apreensão
              </h1>
              <p className="text-xs text-primary-foreground/70 mt-0.5">
                Localize o pátio mais próximo de você
              </p>
            </div>
          </div>

          {/* Badge de pátios disponíveis */}
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-orange inline-block animate-pulse" />
            5 pátios disponíveis
          </div>
        </div>
      </header>

      {/* ── Hero / Intro ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-navy/5 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
            Encontre o Pátio{" "}
            <span className="text-accent">mais próximo</span> de você
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Digite seu CEP ou endereço para localizar pátios de apreensão, ver distâncias e
            calcular a rota com um clique.
          </p>
        </div>
      </div>

      {/* ── Mapa principal ──────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-6">
        <MapaPatios />
      </main>

      {/* ── Aviso sobre API Key ─────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 pb-6">
        <div className="rounded-xl border border-orange/30 bg-orange/5 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-foreground">Configure sua Chave da Google Maps API</p>
            <p className="text-muted-foreground mt-1">
              Crie um arquivo <code className="bg-muted px-1 py-0.5 rounded text-xs">.env</code> na raiz do projeto e adicione:{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui</code>.
              Ative no Google Cloud Console: <strong>Maps JS API</strong>, <strong>Geocoding API</strong> e <strong>Directions API</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card mt-4">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pátios de Apreensão — Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};

export default Index;
