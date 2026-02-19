import React from "react";
import { MapPin, Phone, Clock, Navigation, Map } from "lucide-react";
import { Patio } from "./constants";

interface LatLng {
  lat: number;
  lng: number;
}

interface PatioCardProps {
  patio: Patio;
  index: number;
  isSelected: boolean;
  onVerNoMapa: (patio: Patio) => void;
  onVerRota: (patio: Patio) => void;
  userLocation: LatLng | null;
}

const PatioCard: React.FC<PatioCardProps> = ({
  patio,
  index,
  isSelected,
  onVerNoMapa,
  onVerRota,
  userLocation,
}) => {
  return (
    <div
      className={`
        patio-card-hover rounded-xl border p-4 cursor-pointer transition-all duration-200
        ${isSelected
          ? "border-accent bg-accent/5 shadow-md"
          : "border-border bg-card hover:border-primary/40"
        }
      `}
      onClick={() => onVerNoMapa(patio)}
    >
      {/* Header: número + nome */}
      <div className="flex items-start gap-3">
        {/* Badge de ranking por proximidade */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${index === 0
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground"
            }
          `}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight">
            {patio.nome}
          </h3>

          {/* Distância — só exibe quando calculada */}
          {patio.distancia !== undefined && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-accent">
              <Navigation className="w-3 h-3" />
              {patio.distancia.toFixed(1)} km de distância
            </span>
          )}
        </div>
      </div>

      {/* Detalhes */}
      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
          <span className="leading-snug">{patio.endereco}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
          <span>{patio.telefone}</span>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
          <span className="leading-snug">{patio.horario}</span>
        </div>
      </div>

      {/* Ações */}
      <div className="mt-4 flex gap-2">
        <button
          className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
          onClick={(e) => {
            e.stopPropagation();
            onVerNoMapa(patio);
          }}
        >
          <Map className="w-3.5 h-3.5" />
          Ver no Mapa
        </button>

        {/* Rota só disponível se usuário buscou localização */}
        {userLocation && (
          <button
            className="btn-accent flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
            onClick={(e) => {
              e.stopPropagation();
              onVerRota(patio);
            }}
          >
            <Navigation className="w-3.5 h-3.5" />
            Ver Rota
          </button>
        )}
      </div>
    </div>
  );
};

export default PatioCard;
