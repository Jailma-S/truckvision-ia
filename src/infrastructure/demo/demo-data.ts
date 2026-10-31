import type { Company, Signal, SignalType, Source } from "@/domain/entities";

/**
 * Dados FICTÍCIOS para o modo demonstração (sem Supabase).
 * Nenhuma empresa ou notícia abaixo é real.
 */

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export const demoSources: Source[] = [
  { id: "src-dioe", source_name: "Diário Oficial do Estado do Maranhão", source_url: "https://www.diariooficial.ma.gov.br", feed_url: null, reliability_score: 90, active: true },
  { id: "src-pncp", source_name: "Portal Nacional de Contratações Públicas (PNCP)", source_url: "https://pncp.gov.br", feed_url: null, reliability_score: 90, active: true },
  { id: "src-imprensa", source_name: "Imprensa regional", source_url: null, feed_url: null, reliability_score: 60, active: true },
  { id: "src-site", source_name: "Redes sociais / site da empresa", source_url: null, feed_url: null, reliability_score: 50, active: true },
  { id: "src-vendedor", source_name: "Indicação de vendedor", source_url: null, feed_url: null, reliability_score: 70, active: true },
];

const c = (id: string, company_name: string, segment: string, city: string): Company => ({
  id,
  company_name,
  cnpj: null,
  segment,
  city,
  state: "MA",
  website: null,
  notes: "Empresa fictícia — modo demonstração.",
  created_at: new Date(Date.now() - 200 * 86_400_000).toISOString(),
});

export const demoCompanies: Company[] = [
  c("co-1", "Transportes Rio Tocantins (demo)", "Transporte rodoviário de cargas", "Imperatriz"),
  c("co-2", "Agro Cerrado Sul Grãos (demo)", "Agronegócio — grãos", "Balsas"),
  c("co-3", "Construtora Ilha Nova (demo)", "Construção civil", "São Luís"),
  c("co-4", "Logística Porto Itaqui Express (demo)", "Logística portuária", "São Luís"),
  c("co-5", "Mineração Serra Verde (demo)", "Mineração", "Açailândia"),
  c("co-6", "Distribuidora Vale do Mearim (demo)", "Distribuição de alimentos", "Bacabal"),
  c("co-7", "Cimentos Itapecuru (demo)", "Indústria — materiais de construção", "Caxias"),
  c("co-8", "Florestal Pindaré (demo)", "Florestal / celulose", "Santa Inês"),
  c("co-9", "Combustíveis Timon Norte (demo)", "Distribuição de combustíveis", "Timon"),
  c("co-10", "Laticínios Chapadinha (demo)", "Indústria de alimentos", "Chapadinha"),
];

let n = 0;
const s = (
  company_id: string,
  source_id: string,
  signal_type: SignalType,
  title: string,
  summary: string,
  age: number,
  relevance: Signal["relevance"] = "alta",
): Signal => ({
  id: `sig-${++n}`,
  company_id,
  source_id,
  signal_type,
  title,
  content: summary,
  url: null,
  summary,
  evidence: [title],
  signal_date: daysAgo(age),
  relevance,
  relevance_score: relevance === "alta" ? 85 : relevance === "media" ? 60 : 30,
  created_by: "manual",
  created_at: new Date(Date.now() - age * 86_400_000).toISOString(),
});

export const demoSignals: Signal[] = [
  s("co-1", "src-pncp", "contract", "Homologação de contrato de transporte de insumos por 36 meses", "Contrato público de transporte de insumos com volume mensal relevante, início em 60 dias.", 8),
  s("co-1", "src-imprensa", "expansion", "Abertura de nova base operacional em Açailândia", "Empresa anunciou nova filial para atender o corredor da BR-010.", 15),
  s("co-1", "src-site", "investment", "Anúncio de investimento em pátio e oficina", "Publicação nas redes sobre ampliação do pátio e oficina própria.", 22, "media"),
  s("co-2", "src-imprensa", "expansion", "Ampliação de área plantada para a safra 2026/27", "Grupo amplia área de soja e milho; aumento de escoamento previsto.", 12),
  s("co-2", "src-dioe", "investment", "Licença de instalação de armazém graneleiro", "Licença ambiental para armazém de grande porte publicada no Diário Oficial.", 25),
  s("co-3", "src-dioe", "contract", "Resultado de licitação de obras de pavimentação urbana", "Vencedora de lote de pavimentação na Grande São Luís.", 5),
  s("co-3", "src-vendedor", "fleet", "Frota de basculantes com idade média elevada", "Vendedor relata frota antiga e manutenção crescente.", 40, "media"),
  s("co-4", "src-imprensa", "logistics", "Novo contrato de movimentação de granéis no porto", "Operador logístico anuncia aumento de volume movimentado.", 18),
  s("co-4", "src-pncp", "contract", "Contrato de transporte de cargas para órgão federal", "Contrato de 24 meses publicado no PNCP.", 70, "media"),
  s("co-5", "src-dioe", "investment", "Licença prévia para expansão de lavra", "Licença ambiental prévia para nova frente de lavra.", 35),
  s("co-6", "src-site", "expansion", "Inauguração de centro de distribuição", "Novo CD anunciado nas redes sociais da empresa.", 50, "media"),
  s("co-7", "src-imprensa", "industry", "Nova linha de produção de cimento", "Fábrica anuncia nova linha com aumento de capacidade.", 95, "media"),
  s("co-8", "src-imprensa", "expansion", "Expansão de área de plantio de eucalipto", "Expansão de área florestal na região do Pindaré.", 130, "media"),
  s("co-9", "src-site", "logistics", "Abertura de nova base de distribuição", "Nova base de distribuição anunciada.", 160, "baixa"),
];
