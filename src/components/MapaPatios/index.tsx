/**
 * MapaPatios — Componente de mapa interativo para pátios de apreensão
 *
 * APIs Google necessárias:
 *  - Maps JavaScript API
 *  - Geocoding API
 *  - Directions API
 *  - Places API
 *
 * Configure a chave em .env: VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
 */

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Search, X, AlertCircle, Loader2, MapPin } from "lucide-react";
import PatioCard from "./PatioCard";
import { PATIOS, MAP_CENTER_DEFAULT, MAP_ZOOM_DEFAULT, GOOGLE_MAPS_API_KEY, Patio } from "./constants";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface LatLng {
  lat: number;
  lng: number;
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

/**
 * Fórmula de Haversine — calcula distância em km entre dois pontos geográficos
 */
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

// ─── Configurações do mapa ───────────────────────────────────────────────────

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

// ─── Ícones SVG dos marcadores ───────────────────────────────────────────────

function makePatioIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#1e3a5f",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

function makeUserIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#f97316",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

// ─── Skeleton de carregamento ────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center map-skeleton rounded-xl">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
      <p className="text-muted-foreground text-sm font-medium">Carregando o mapa…</p>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

const MapaPatios: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places", "geometry"],
  });

  // Estado do mapa
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(MAP_CENTER_DEFAULT);
  const [mapZoom, setMapZoom] = useState(MAP_ZOOM_DEFAULT);

  // Estado de busca do usuário
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Estado de seleção / InfoWindow
  const [selectedPatio, setSelectedPatio] = useState<Patio | null>(null);

  // Estado de rota
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ duracao: string; distancia: string } | null>(null);

  // Pátios enriquecidos com distância calculada
  const patiosComDistancia = useMemo<Patio[]>(() => {
    if (!userLocation) return PATIOS;
    return [...PATIOS]
      .map((p) => ({ ...p, distancia: haversineKm(userLocation, { lat: p.lat, lng: p.lng }) }))
      .sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
  }, [userLocation]);

  // ─── Callbacks ─────────────────────────────────────────────────────────────

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  /** Geocodifica o endereço digitado e posiciona marcador do usuário */
  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setDirections(null);
    setRouteInfo(null);

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: searchInput }, (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error("Endereço não encontrado. Tente um CEP ou endereço completo."));
          }
        });
      });

      const loc = result[0].geometry.location;
      const coords: LatLng = { lat: loc.lat(), lng: loc.lng() };
      setUserLocation(coords);
      setMapCenter(coords);
      setMapZoom(13);

      if (mapRef.current) {
        mapRef.current.panTo(coords);
        mapRef.current.setZoom(13);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erro ao buscar endereço.");
    } finally {
      setIsSearching(false);
    }
  }, [searchInput]);

  /** Centraliza o mapa no pátio e abre seu InfoWindow */
  const handleVerNoMapa = useCallback((patio: Patio) => {
    const coords: LatLng = { lat: patio.lat, lng: patio.lng };
    setSelectedPatio(patio);
    setMapCenter(coords);
    setMapZoom(15);
    if (mapRef.current) {
      mapRef.current.panTo(coords);
      mapRef.current.setZoom(15);
    }
  }, []);

  /** Calcula e renderiza a rota da localização do usuário até o pátio */
  const handleVerRota = useCallback(
    async (patio: Patio) => {
      if (!userLocation) {
        setSearchError("Busque seu endereço primeiro para calcular a rota.");
        return;
      }
      setIsRouting(true);
      setDirections(null);
      setRouteInfo(null);
      setSelectedPatio(null);

      try {
        const directionsService = new google.maps.DirectionsService();
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: userLocation,
              destination: { lat: patio.lat, lng: patio.lng },
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK" && result) resolve(result);
              else reject(new Error("Não foi possível calcular a rota."));
            }
          );
        });

        setDirections(result);
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          duracao: leg.duration?.text ?? "–",
          distancia: leg.distance?.text ?? "–",
        });

        // Ajusta o mapa para mostrar toda a rota
        if (mapRef.current && result.routes[0].bounds) {
          mapRef.current.fitBounds(result.routes[0].bounds);
        }
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Erro ao calcular rota.");
      } finally {
        setIsRouting(false);
      }
    },
    [userLocation]
  );

  /** Limpa a rota atual */
  const handleLimparRota = useCallback(() => {
    setDirections(null);
    setRouteInfo(null);
  }, []);

  /** Limpa a busca por completo */
  const handleLimparBusca = useCallback(() => {
    setSearchInput("");
    setUserLocation(null);
    setDirections(null);
    setRouteInfo(null);
    setSearchError(null);
    setSelectedPatio(null);
    setMapCenter(MAP_CENTER_DEFAULT);
    setMapZoom(MAP_ZOOM_DEFAULT);
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
        <div>
          <p className="font-semibold text-destructive">Erro ao carregar o Google Maps</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique se a chave da API está configurada corretamente em{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> e se as APIs
            necessárias estão habilitadas no Google Cloud Console.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Barra de busca ─────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Digite seu CEP ou endereço completo…"
              className="
                w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background
                text-sm text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring transition-shadow
              "
            />
            {(searchInput || userLocation) && (
              <button
                onClick={handleLimparBusca}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isSearching ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {/* Mensagem de erro de geocodificação */}
        {searchError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {searchError}
          </div>
        )}

        {/* Info da rota calculada */}
        {routeInfo && (
          <div className="mt-3 flex flex-wrap items-center gap-3 bg-primary/5 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Distância:</span>
              <span className="font-semibold text-foreground">{routeInfo.distancia}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Tempo estimado:</span>
              <span className="font-semibold text-foreground">{routeInfo.duracao}</span>
            </div>
            <button
              onClick={handleLimparRota}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Limpar Rota
            </button>
          </div>
        )}
      </div>

      {/* ── Layout principal: mapa + lista ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Mapa */}
        <div
          className="flex-1 rounded-xl overflow-hidden border border-border shadow-sm"
          style={{ minHeight: "450px" }}
        >
          {!isLoaded ? (
            <MapSkeleton />
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={mapCenter}
              zoom={mapZoom}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {/* Marcadores dos pátios */}
              {PATIOS.map((patio) => (
                <Marker
                  key={patio.id}
                  position={{ lat: patio.lat, lng: patio.lng }}
                  icon={makePatioIcon()}
                  title={patio.nome}
                  onClick={() => setSelectedPatio(patio)}
                />
              ))}

              {/* Marcador do usuário */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={makeUserIcon()}
                  title="Sua localização"
                />
              )}

              {/* InfoWindow do pátio selecionado */}
              {selectedPatio && (
                <InfoWindow
                  position={{ lat: selectedPatio.lat, lng: selectedPatio.lng }}
                  onCloseClick={() => setSelectedPatio(null)}
                >
                  <div className="p-1 max-w-[240px]">
                    <p className="font-bold text-sm text-gray-900 mb-1">{selectedPatio.nome}</p>
                    <p className="text-xs text-gray-600 mb-1">{selectedPatio.endereco}</p>
                    <p className="text-xs text-gray-600 mb-1">📞 {selectedPatio.telefone}</p>
                    <p className="text-xs text-gray-600 mb-3">🕐 {selectedPatio.horario}</p>
                    {userLocation && (
                      <button
                        onClick={() => {
                          setSelectedPatio(null);
                          handleVerRota(selectedPatio);
                        }}
                        style={{
                          background: "#f97316",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        🚗 Ver Rota
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Renderer da rota */}
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: false,
                    polylineOptions: {
                      strokeColor: "#1e3a5f",
                      strokeWeight: 5,
                      strokeOpacity: 0.85,
                    },
                  }}
                />
              )}
            </GoogleMap>
          )}

          {/* Overlay de carregamento da rota */}
          {isRouting && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 bg-card px-4 py-3 rounded-xl shadow-lg border border-border">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm font-medium text-foreground">Calculando rota…</span>
              </div>
            </div>
          )}
        </div>

        {/* Lista de pátios */}
        <div className="lg:w-80 xl:w-96 flex flex-col gap-3">
          {/* Cabeçalho da lista */}
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-foreground">
              {userLocation ? "📍 Pátios mais próximos" : "📋 Todos os Pátios"}
            </h2>
            <span className="text-xs text-muted-foreground">
              ({patiosComDistancia.length})
            </span>
          </div>

          {!userLocation && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              🔍 Busque seu endereço para ver os pátios ordenados por proximidade.
            </p>
          )}

          {/* Cards dos pátios */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] pr-1">
            {patiosComDistancia.map((patio, index) => (
              <PatioCard
                key={patio.id}
                patio={patio}
                index={index}
                isSelected={selectedPatio?.id === patio.id}
                onVerNoMapa={handleVerNoMapa}
                onVerRota={handleVerRota}
                userLocation={userLocation}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaPatios;
