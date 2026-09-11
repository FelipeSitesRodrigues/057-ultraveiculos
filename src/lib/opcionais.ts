/** Lista fixa de opcionais, na ordem da referencia do painel da Belloni. */
export const OPCIONAIS = [
  'Ar condicionado',
  'Ar digital',
  'Direção elétrica',
  'Direção hidráulica',
  'Vidros elétricos',
  'Travas elétricas',
  'Retrovisores elétricos',
  'Câmera de ré',
  'Sensor de estacionamento',
  'Sensor de chuva',
  'Central multimídia',
  'Bluetooth',
  'GPS / Navegador',
  'Banco de couro',
  'Bancos aquecidos',
  'Teto solar',
  'Teto panorâmico',
  'Rodas de liga leve',
  'Airbag duplo',
  'Airbag lateral',
  'ABS',
  'Controle de tração',
  'Controle de estabilidade',
  'Piloto automático',
  'Freio a disco nas 4 rodas',
  'Volante multifuncional',
  'Keyless Entry / Start',
  'Computador de bordo',
  'Start/Stop automático',
  'Carregador wireless',
  'Apple CarPlay / Android Auto',
  'Kit multimídia original',
  '4x4 / AWD / Tração integral',
  'Blindagem',
  'GNV instalado',
] as const

/**
 * Ordem alfabetica, pra achar a marca correndo o olho em vez de varrer a lista
 * inteira. "Outra" fica fora da ordem, no fim: e a saida, nao uma marca.
 */
export const MARCAS = [
  'Audi',
  'BMW',
  'BYD',
  'Caoa Chery',
  'Chery',
  'Chevrolet',
  'Citroën',
  'Dodge',
  'Fiat',
  'Ford',
  'GWM',
  'Honda',
  'Hyundai',
  'Jeep',
  'Kia',
  'Land Rover',
  'Mercedes-Benz',
  'Mitsubishi',
  'Nissan',
  'Peugeot',
  'Ram',
  'Renault',
  'Subaru',
  'Suzuki',
  'Toyota',
  'Volkswagen',
  'Volvo',
  'Outra',
] as const

export const CARROCERIAS = [
  'Hatch', 'Sedã', 'SUV', 'SUV médio', 'Picape', 'Minivan', 'Utilitário', 'Cupê',
  'Conversível', 'Perua', 'Moto',
] as const

export const CAMBIOS = ['Manual', 'Automático', 'Automatizado', 'CVT'] as const

export const COMBUSTIVEIS = [
  'Flex', 'Gasolina', 'Etanol', 'Diesel', 'GNV', 'Híbrido', 'Elétrico',
] as const

export const CORES = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde',
  'Marrom', 'Bege', 'Dourado', 'Amarelo', 'Laranja', 'Vinho',
] as const

/**
 * O banco guarda quatro situações, mas o formulário mostra UMA decisão:
 * está no site ou não. "Vendido" e "arquivado" viram botões na página do
 * carro, porque são coisas que acontecem depois, não no cadastro.
 * ("preparacao" continua aceito pelo banco por compatibilidade, mas nenhuma
 * tela cria carro nesse estado.)
 */
export const STATUS_ROTULO: Record<string, { rotulo: string; ajuda: string }> = {
  rascunho: { rotulo: 'Fora do site', ajuda: 'Só a equipe vê.' },
  preparacao: { rotulo: 'Em preparação', ajuda: 'Ainda não aparece no site.' },
  publicado: { rotulo: 'No site', ajuda: 'Publicado, qualquer um vê.' },
  vendido: { rotulo: 'Vendido', ajuda: 'Saiu do site, fica no histórico.' },
  arquivado: { rotulo: 'Arquivado', ajuda: 'Fora do site e fora da lista.' },
}
