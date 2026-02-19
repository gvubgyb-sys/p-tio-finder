/**
 * MapaPatios — Mapa interativo de pátios de apreensão
 * - Geolocalização nativa do dispositivo (1 clique → rota automática)
 * - Busca por CEP / endereço com Geocoding API
 * - Lista de pátios por proximidade (Haversine)
 * - Rota real via Directions API
 * - Layout mobile-first totalmente responsivo
 */

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  Search,
  X,
  AlertCircle,
  Loader2,
  MapPin,
  Navigation,
  Clock,
  Phone,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  Route,
} from "lucide-react";
import {
  PATIOS,
  MAP_CENTER_DEFAULT,
  MAP_ZOOM_DEFAULT,
  GOOGLE_MAPS_API_KEY,
  Patio,
} from "./constants";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface LatLng {
  lat: number;
  lng: number;
}

// ─── Haversine ───────────────────────────────────────────────────────────────

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const c =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      s2 *
      s2;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

// ─── Configs do mapa ─────────────────────────────────────────────────────────

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const MAP_OPTIONS: google.maps.MapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

// ─── Ícones ───────────────────────────────────────────────────────────────────

const patioIcon = (): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  scale: 11,
  fillColor: "#1e3a5f",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2.5,
});

const patioIconSelected = (): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  scale: 13,
  fillColor: "#f97316",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2.5,
});

const userIcon = (): google.maps.Symbol => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#f97316",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 1.5,
  scale: 1.6,
  anchor: new google.maps.Point(12, 22),
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center map-skeleton rounded-xl">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
      <p className="text-muted-foreground text-sm font-medium">Carregando mapa…</p>
    </div>
  );
}

// ─── Card mobile de pátio ─────────────────────────────────────────────────────

interface MobilePatioCardProps {
  patio: Patio;
  index: number;
  isSelected: boolean;
  isNearest: boolean;
  userLocation: LatLng | null;
  onVerNoMapa: (p: Patio) => void;
  onVerRota: (p: Patio) => void;
}

function MobilePatioCard({
  patio,
  index,
  isSelected,
  isNearest,
  userLocation,
  onVerNoMapa,
  onVerRota,
}: MobilePatioCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? "border-accent bg-accent/5 shadow-md"
          : isNearest
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      {/* Header sempre visível */}
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => {
          setExpanded((v) => !v);
          onVerNoMapa(patio);
        }}
      >
        {/* Badge número */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isNearest
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-foreground truncate">{patio.nome}</p>
            {isNearest && (
              <span className="flex-shrink-0 text-[10px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
                MAIS PRÓXIMO
              </span>
            )}
          </div>
          {patio.distancia !== undefined && (
            <p className="text-xs text-accent font-medium mt-0.5 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {patio.distancia.toFixed(1)} km
            </p>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Detalhes expansíveis */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
            <span>{patio.endereco}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
            <a href={`tel:${patio.telefone.replace(/\D/g, "")}`} className="underline">
              {patio.telefone}
            </a>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
            <span>{patio.horario}</span>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
              onClick={() => onVerNoMapa(patio)}
            >
              <MapPin className="w-3.5 h-3.5" />
              Ver no Mapa
            </button>
            {userLocation && (
              <button
                className="btn-accent flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
                onClick={() => onVerRota(patio)}
              >
                <Route className="w-3.5 h-3.5" />
                Ver Rota
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const MapaPatios: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places", "geometry"],
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  // localização
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);

  // busca por texto
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // erro geral
  const [error, setError] = useState<string | null>(null);

  // seleção
  const [selectedPatio, setSelectedPatio] = useState<Patio | null>(null);

  // rota
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    duracao: string;
    distancia: string;
    nome: string;
  } | null>(null);

  // aba mobile: "mapa" | "lista"
  const [mobileTab, setMobileTab] = useState<"mapa" | "lista">("mapa");

  // pátios com distância calculada e ordenados
  const patiosOrdenados = useMemo<Patio[]>(() => {
    if (!userLocation) return PATIOS;
    return [...PATIOS]
      .map((p) => ({
        ...p,
        distancia: haversineKm(userLocation, { lat: p.lat, lng: p.lng }),
      }))
      .sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
  }, [userLocation]);

  const patioMaisProximo = patiosOrdenados[0];

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const panTo = useCallback((coords: LatLng, zoom = 14) => {
    if (mapRef.current) {
      mapRef.current.panTo(coords);
      mapRef.current.setZoom(zoom);
    }
  }, []);

  // ─── Calcular rota ───────────────────────────────────────────────────────────

  const calcularRota = useCallback(
    async (origem: LatLng, patio: Patio) => {
      setIsRouting(true);
      setDirections(null);
      setRouteInfo(null);
      setSelectedPatio(null);
      setError(null);

      try {
        const svc = new google.maps.DirectionsService();
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          svc.route(
            {
              origin: origem,
              destination: { lat: patio.lat, lng: patio.lng },
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (r, s) => (s === "OK" && r ? resolve(r) : reject())
          );
        });

        setDirections(result);
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          duracao: leg.duration?.text ?? "–",
          distancia: leg.distance?.text ?? "–",
          nome: patio.nome,
        });

        if (mapRef.current && result.routes[0].bounds) {
          mapRef.current.fitBounds(result.routes[0].bounds, 40);
        }
        // muda para aba mapa no mobile
        setMobileTab("mapa");
      } catch {
        setError("Não foi possível calcular a rota. Tente novamente.");
      } finally {
        setIsRouting(false);
      }
    },
    []
  );

  // ─── Geolocalização nativa ────────────────────────────────────────────────────

  const handleMinhaLocalizacao = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Seu navegador não suporta geolocalização.");
      return;
    }
    setIsGeolocating(true);
    setError(null);
    setDirections(null);
    setRouteInfo(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        panTo(coords, 13);

        // calcula automaticamente rota para o pátio mais próximo
        const nearest = [...PATIOS]
          .map((p) => ({ ...p, d: haversineKm(coords, { lat: p.lat, lng: p.lng }) }))
          .sort((a, b) => a.d - b.d)[0];

        setIsGeolocating(false);
        calcularRota(coords, nearest);
      },
      (err) => {
        setIsGeolocating(false);
        if (err.code === 1) {
          setError(
            "Permissão de localização negada. Permita o acesso nas configurações do navegador."
          );
        } else {
          setError("Não foi possível obter sua localização. Tente buscar pelo CEP.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [calcularRota, panTo]);

  // ─── Busca por CEP / endereço ─────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setError(null);
    setDirections(null);
    setRouteInfo(null);

    try {
      const geocoder = new google.maps.Geocoder();
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: searchInput }, (r, s) =>
          s === "OK" && r?.length ? resolve(r) : reject()
        );
      });

      const loc = results[0].geometry.location;
      const coords: LatLng = { lat: loc.lat(), lng: loc.lng() };
      setUserLocation(coords);
      panTo(coords, 13);
    } catch {
      setError("Endereço não encontrado. Tente um CEP ou endereço completo.");
    } finally {
      setIsSearching(false);
    }
  }, [searchInput, panTo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  // ─── Ver no mapa ──────────────────────────────────────────────────────────────

  const handleVerNoMapa = useCallback(
    (patio: Patio) => {
      setSelectedPatio(patio);
      panTo({ lat: patio.lat, lng: patio.lng }, 15);
      setMobileTab("mapa");
    },
    [panTo]
  );

  // ─── Limpar tudo ──────────────────────────────────────────────────────────────

  const handleLimpar = useCallback(() => {
    setSearchInput("");
    setUserLocation(null);
    setDirections(null);
    setRouteInfo(null);
    setError(null);
    setSelectedPatio(null);
    if (mapRef.current) {
      mapRef.current.panTo(MAP_CENTER_DEFAULT);
      mapRef.current.setZoom(MAP_ZOOM_DEFAULT);
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-destructive text-sm">Erro ao carregar Google Maps</p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> no
            arquivo <code className="bg-muted px-1 rounded">.env</code> e habilite as APIs no
            Google Cloud Console.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ══ BARRA DE AÇÕES ══════════════════════════════════════════════════ */}
      <div className="bg-card rounded-2xl border border-border p-3 shadow-sm space-y-3">

        {/* Botão destaque — Usar minha localização */}
        <button
          onClick={handleMinhaLocalizacao}
          disabled={isGeolocating || isRouting}
          className="
            w-full flex items-center justify-center gap-2.5 py-3.5 px-4
            rounded-xl font-bold text-sm transition-all duration-150
            disabled:opacity-60 disabled:cursor-not-allowed
            active:scale-95
          "
          style={{
            background: "linear-gradient(135deg, hsl(var(--navy-deep)), hsl(var(--navy-mid)))",
            color: "hsl(var(--primary-foreground))",
            boxShadow: "0 4px 14px -4px hsl(var(--navy-deep) / 0.5)",
          }}
        >
          {isGeolocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LocateFixed className="w-5 h-5" />
          )}
          {isGeolocating
            ? "Obtendo localização…"
            : "Usar minha localização → Rota automática"}
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">ou busque pelo endereço</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Campo de busca */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              inputMode="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="CEP ou endereço completo…"
              className="
                w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background
                text-sm text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring transition-shadow
              "
            />
            {(searchInput || userLocation) && (
              <button
                onClick={handleLimpar}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
            className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSearching ? "Buscando…" : "Buscar"}</span>
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Info da rota */}
        {routeInfo && (
          <div
            className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1"
            style={{ background: "hsl(var(--navy-deep) / 0.06)" }}
          >
            <div className="flex items-center gap-1.5 text-sm">
              <Route className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
                {routeInfo.nome}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm ml-auto">
              <span className="text-muted-foreground">
                🚗 <strong className="text-foreground">{routeInfo.distancia}</strong>
              </span>
              <span className="text-muted-foreground">
                ⏱ <strong className="text-foreground">{routeInfo.duracao}</strong>
              </span>
              <button
                onClick={() => { setDirections(null); setRouteInfo(null); }}
                className="text-xs underline text-muted-foreground hover:text-foreground"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ ABAS MOBILE ═══════════════════════════════════════════════════════ */}
      <div className="flex lg:hidden rounded-xl overflow-hidden border border-border">
        <button
          onClick={() => setMobileTab("mapa")}
          className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "mapa"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Mapa
        </button>
        <button
          onClick={() => setMobileTab("lista")}
          className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "lista"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground"
          }`}
        >
          <Navigation className="w-4 h-4" />
          Pátios {userLocation && `(${patiosOrdenados.length})`}
        </button>
      </div>

      {/* ══ LAYOUT PRINCIPAL ══════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-3">

        {/* ── MAPA ── */}
        <div
          className={`flex-1 relative rounded-2xl overflow-hidden border border-border shadow-sm ${
            mobileTab === "lista" ? "hidden lg:block" : "block"
          }`}
          style={{ minHeight: "360px", height: "clamp(360px, 55vw, 560px)" }}
        >
          {!isLoaded ? (
            <MapSkeleton />
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={MAP_CENTER_DEFAULT}
              zoom={MAP_ZOOM_DEFAULT}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {/* Marcadores dos pátios */}
              {PATIOS.map((p) => (
                <Marker
                  key={p.id}
                  position={{ lat: p.lat, lng: p.lng }}
                  icon={selectedPatio?.id === p.id ? patioIconSelected() : patioIcon()}
                  title={p.nome}
                  onClick={() => setSelectedPatio(p)}
                />
              ))}

              {/* Marcador do usuário */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={userIcon()}
                  title="Sua localização"
                />
              )}

              {/* InfoWindow */}
              {selectedPatio && !directions && (
                <InfoWindow
                  position={{ lat: selectedPatio.lat, lng: selectedPatio.lng }}
                  onCloseClick={() => setSelectedPatio(null)}
                >
                  <div style={{ padding: "4px", maxWidth: "220px" }}>
                    <p style={{ fontWeight: 700, fontSize: "13px", color: "#1e3a5f", marginBottom: "6px" }}>
                      {selectedPatio.nome}
                    </p>
                    <p style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>
                      📍 {selectedPatio.endereco}
                    </p>
                    <p style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>
                      📞 {selectedPatio.telefone}
                    </p>
                    <p style={{ fontSize: "11px", color: "#555", marginBottom: "10px" }}>
                      🕐 {selectedPatio.horario}
                    </p>
                    {userLocation && (
                      <button
                        onClick={() => { setSelectedPatio(null); calcularRota(userLocation, selectedPatio); }}
                        style={{
                          width: "100%", background: "#f97316", color: "#fff",
                          border: "none", borderRadius: "8px", padding: "7px 0",
                          fontSize: "12px", fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        🚗 Calcular Rota
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Rota */}
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: false,
                    polylineOptions: {
                      strokeColor: "#1e3a5f",
                      strokeWeight: 5,
                      strokeOpacity: 0.9,
                    },
                  }}
                />
              )}
            </GoogleMap>
          )}

          {/* Overlay calculando rota */}
          {(isRouting || isGeolocating) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="bg-card rounded-2xl shadow-xl border border-border px-5 py-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm font-semibold text-foreground">
                  {isGeolocating ? "Obtendo localização…" : "Calculando rota…"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── LISTA ── */}
        <div
          className={`lg:w-80 xl:w-96 flex flex-col gap-2 ${
            mobileTab === "mapa" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Cabeçalho lista */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground">
              {userLocation ? "📍 Pátios por proximidade" : "📋 Pátios disponíveis"}
            </h2>
            {!userLocation && (
              <span className="text-xs text-muted-foreground">
                Permita localização para ordenar
              </span>
            )}
          </div>

          {/* Dica quando não tem localização */}
          {!userLocation && (
            <button
              onClick={handleMinhaLocalizacao}
              className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/8 border border-primary/20 rounded-xl px-3 py-2.5 hover:bg-primary/12 transition-colors active:scale-95"
            >
              <LocateFixed className="w-4 h-4 flex-shrink-0" />
              Toque aqui para usar sua localização e ver o pátio mais próximo
            </button>
          )}

          {/* Cards */}
          <div
            className="flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: "clamp(300px, 55vw, 500px)" }}
          >
            {patiosOrdenados.map((patio, index) => (
              <MobilePatioCard
                key={patio.id}
                patio={patio}
                index={index}
                isSelected={selectedPatio?.id === patio.id}
                isNearest={userLocation ? index === 0 : false}
                userLocation={userLocation}
                onVerNoMapa={handleVerNoMapa}
                onVerRota={(p) => userLocation && calcularRota(userLocation, p)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaPatios;
