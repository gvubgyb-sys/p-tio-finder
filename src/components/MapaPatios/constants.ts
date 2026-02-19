// ─── Dados dos Pátios de Apreensão ─────────────────────────────────────────
// Substitua pelos dados reais dos pátios antes de publicar.

export interface Patio {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  horario: string;
  lat: number;
  lng: number;
  /** Distância calculada dinamicamente após busca do usuário (em km) */
  distancia?: number;
}

export const PATIOS: Patio[] = [
  {
    id: 1,
    nome: "Pátio Central – Zona Sul",
    endereco: "Rua das Acácias, 123 – Zona Sul, São Paulo – SP",
    telefone: "(11) 3333-1111",
    horario: "Seg a Sex: 8h às 18h | Sáb: 8h às 12h",
    lat: -23.5505,
    lng: -46.6333,
  },
  {
    id: 2,
    nome: "Pátio Norte – Vila Esperança",
    endereco: "Av. das Flores, 456 – Zona Norte, São Paulo – SP",
    telefone: "(11) 3333-2222",
    horario: "Seg a Sáb: 7h às 19h",
    lat: -23.49,
    lng: -46.62,
  },
  {
    id: 3,
    nome: "Pátio Leste – Jardim Aurora",
    endereco: "Rua do Progresso, 789 – Zona Leste, São Paulo – SP",
    telefone: "(11) 3333-3333",
    horario: "Seg a Sex: 8h às 17h",
    lat: -23.56,
    lng: -46.55,
  },
  {
    id: 4,
    nome: "Pátio Oeste – Bairro Industrial",
    endereco: "Rua das Máquinas, 321 – Zona Oeste, São Paulo – SP",
    telefone: "(11) 3333-4444",
    horario: "Seg a Sex: 7h às 18h | Sáb: 8h às 13h",
    lat: -23.535,
    lng: -46.72,
  },
  {
    id: 5,
    nome: "Pátio Centro – Bela Vista",
    endereco: "Av. Paulista, 999 – Bela Vista, São Paulo – SP",
    telefone: "(11) 3333-5555",
    horario: "Seg a Sex: 8h às 20h | Sáb: 8h às 14h",
    lat: -23.5616,
    lng: -46.6559,
  },
];

// ─── Configurações do Mapa ──────────────────────────────────────────────────

export const MAP_CENTER_DEFAULT = {
  lat: -23.5505,
  lng: -46.6333,
};

export const MAP_ZOOM_DEFAULT = 12;

// Chave da API — use variável de ambiente VITE_GOOGLE_MAPS_API_KEY
// Crie um arquivo .env na raiz do projeto com:
// VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
