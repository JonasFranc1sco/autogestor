import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconCar,
  IconClipboardList,
  IconTool,
  IconPackage,
  IconCash,
  IconChartBar,
  IconCalendar,
  IconUsers,
  IconArrowRight,
  IconChevronDown,
  IconSparkles,
  IconClock,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { accessToken } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const PILLARS = [
    {
      tag: "Operação & Diagnóstico",
      title: "Ordens de Serviço em segundos, sem papel",
      image: "/images/marketing/ordem-servico-diagnostico.jpg",
      icon: IconClipboardList,
      description:
        "Diga adeus às fichas amassadas e notas de mão esquecidas na bancada. Registre o diagnóstico, adicione peças e serviços e gere o checklist completo do veículo.",
      details: [
        "Acompanhamento de status em tempo real (Aguardando, Em Andamento, Concluída)",
        "Impressão formatada para entrega ao cliente em 1 clique",
        "Atribuição de mecânicos responsáveis por cada serviço",
      ],
    },
    {
      tag: "Fidelização & Confiança",
      title: "Histórico completo do veículo pela placa",
      image: "/images/marketing/veiculo-elevador.jpg",
      icon: IconCar,
      description:
        "Quando o cliente retornar, saiba na hora tudo o que já foi feito, quilometragem anterior, peças trocadas e quando foi a última revisão.",
      details: [
        "Busca instantânea por placa, modelo ou CPF do cliente",
        "Vínculo automático de múltiplos veículos por cliente",
        "Transparência total que gera credibilidade e retorno garantido",
      ],
    },
    {
      tag: "Controle & Lucro",
      title: "Estoque sincronizado e caixa fechado",
      image: "/images/marketing/ferramentas-estoque.jpg",
      icon: IconCash,
      description:
        "Peças baixadas automaticamente do estoque assim que a OS é aprovada. Saiba exatamente a margem de lucro de cada serviço e comissão dos mecânicos.",
      details: [
        "Avisos automáticos de peças com estoque no nível crítico",
        "Fluxo de caixa diário com entradas, saídas e formas de pagamento",
        "Relatórios consolidados de faturamento sem necessidade de planilhas",
      ],
    },
  ];

  const FEATURES = [
    {
      icon: IconClipboardList,
      title: "Gestão Ágil de OS",
      description: "Fluxo completo desde o orçamento até a entrega técnica das chaves.",
    },
    {
      icon: IconCar,
      title: "Cadastro de Veículos",
      description: "Marca, modelo, ano, placa, chassi e histórico de intervenções.",
    },
    {
      icon: IconPackage,
      title: "Controle de Peças",
      description: "Catálogo de produtos com preço de custo, venda e controle de estoque mínimo.",
    },
    {
      icon: IconTool,
      title: "Tabela de Serviços",
      description: "Padronização de mão de obra com valores e tempos estimados de execução.",
    },
    {
      icon: IconCalendar,
      title: "Agenda de Atendimentos",
      description: "Evite sobrecarga no pátio e organize a rotina dos elevadores e boxes.",
    },
    {
      icon: IconCash,
      title: "Frente de Caixa",
      description: "Abertura, fechamento diário, controle de sangrias e formas de pagamento.",
    },
    {
      icon: IconUsers,
      title: "Equipe & Mecânicos",
      description: "Perfis com permissões específicas de acesso e acompanhamento de tarefas.",
    },
    {
      icon: IconChartBar,
      title: "Relatórios Estratégicos",
      description: "Visão analítica de ticket médio, serviços mais lucrativos e faturamento.",
    },
  ];

  const FAQS = [
    {
      question: "O Autogestor funciona em celulares e tablets na oficina?",
      answer:
        "Sim! O sistema foi desenvolvido com design responsivo moderno. Os mecânicos podem atualizar o status da OS direto pelo celular ou tablet na bancada, sem precisar ir ao computador do balcão.",
    },
    {
      question: "Os dados da minha oficina ficam seguros e separados de outras?",
      answer:
        "Totalmente. O Autogestor opera com arquitetura multi-tenant com isolamento estrito a nível de banco de dados. Seus clientes, preços, veículos e faturamento são 100% privados e confidenciais.",
    },
    {
      question: "Consigo imprimir a Ordem de Serviço para o cliente assinar?",
      answer:
        "Sim. Cada OS possui layout de impressão otimizado contendo os dados da oficina, do cliente, do veículo, lista de peças, serviços, valores e campo para assinatura.",
    },
    {
      question: "Preciso instalar algum programa pesado nos computadores?",
      answer:
        "Nenhum. O Autogestor roda 100% na nuvem pelo navegador de qualquer computador, tablet ou smartphone. Basta entrar com login e senha e começar a trabalhar.",
    },
    {
      question: "Como funciona o período de teste?",
      answer:
        "Você tem acesso imediato para cadastrar sua oficina, equipe, produtos e realizar suas primeiras ordens de serviço sem custo de adesão e sem fidelidade.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 selection:bg-orange-500/30 selection:text-orange-200 antialiased">
      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#08090c]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-black tracking-tight text-white group">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-900/30 transition-transform group-hover:scale-105">
              <IconCar size={20} stroke={2.2} />
            </span>
            <span className="tracking-wider">
              AUTO<span className="text-orange-500">GESTOR</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-400">
            <a href="#pilares" className="transition hover:text-white">Pilares</a>
            <a href="#funcionalidades" className="transition hover:text-white">Recursos</a>
            <a href="#como-funciona" className="transition hover:text-white">Como Funciona</a>
            <a href="#planos" className="transition hover:text-white">Planos</a>
            <a href="#faq" className="transition hover:text-white">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-3">
            {accessToken ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-900/30 transition hover:bg-orange-500 active:scale-[0.98]"
              >
                <span>Ir para o Painel</span>
                <IconArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800/70 hover:text-white"
                >
                  Entrar
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-900/40 transition hover:bg-orange-500 active:scale-[0.98]"
                >
                  Criar Oficina
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="space-y-28 pb-24">
        {/* HERO SECTION COM GLOW ATMOSFÉRICO E BACKGROUND CINEMÁTICO */}
        <section className="relative isolate overflow-hidden pt-12 sm:pt-20">
          {/* Imagem de Fundo Fotográfica com Vignette & Gradient Mesh */}
          <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
            <img
              src="/images/marketing/hero-motor-detalhe.jpg"
              alt="Motor moderno de alta precisão em oficina mecânica"
              className="size-full object-cover object-center opacity-25 filter grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#08090c]/50 via-[#08090c]/85 to-[#08090c]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_15%,rgba(249,115,22,0.18),transparent)]" />
          </div>

          {/* Aura luminosa animada de fundo */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[110px] animate-ambient-glow" />

          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge Minimalista com Micro-interação */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-300 shadow-sm backdrop-blur-md animate-float">
                <IconSparkles size={14} className="text-orange-400" />
                <span className="tracking-wide">Plataforma Especializada para Oficinas & Autocenters</span>
              </div>

              {/* Headline Principal de Alto Impacto */}
              <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.14]">
                Sua oficina sem pranchetas. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  Toda a sua operação no piloto automático.
                </span>
              </h1>

              {/* Subheadline Persuasiva */}
              <p className="mt-5 text-sm leading-relaxed text-zinc-300 sm:text-base sm:leading-relaxed">
                O <strong>Autogestor</strong> centraliza ordens de serviço com checklist, histórico veicular pela placa,
                baixa automática no estoque de peças e fechamento de caixa sem surpresas. Mais velocidade na bancada e mais lucro no final do mês.
              </p>

              {/* CTAs de Ação com Efeito Glow */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <Link
                  to={accessToken ? "/dashboard" : "/login"}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-950/50 transition-all duration-200 hover:bg-orange-500 hover:shadow-orange-800/40 active:scale-[0.98] sm:w-auto"
                >
                  <span>{accessToken ? "Acessar Sistema" : "Começar Agora Gratuitamente"}</span>
                  <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#pilares"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-6 py-3.5 text-sm font-medium text-zinc-200 shadow-sm backdrop-blur-sm transition hover:border-zinc-700 hover:bg-zinc-800 sm:w-auto"
                >
                  Conhecer Recursos
                </a>
              </div>

              {/* Micro-benefícios de Confiança */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Sem taxa de adesão
                </span>
                <span className="hidden text-zinc-700 sm:inline">&middot;</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Isolamento total multi-oficina
                </span>
                <span className="hidden text-zinc-700 sm:inline">&middot;</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Pronto para celular e desktop
                </span>
              </div>
            </div>

            {/* PREVIEW DO SISTEMA (MOCKUP VISUAL INTERATIVO) */}
            <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl border border-zinc-800/90 bg-zinc-900/90 p-2 sm:p-3 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-500/80" />
                    <span className="size-2.5 rounded-full bg-yellow-500/80" />
                    <span className="size-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-zinc-500">painel.autogestor.com.br</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                    Ao Vivo
                  </span>
                </div>
              </div>

              {/* Grid de Métricas Simuladas do Dashboard */}
              <div className="grid gap-3 p-4 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-[#0e1015] p-3">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Ordens em Aberto</span>
                    <IconClipboardList size={16} className="text-orange-400" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">14 <span className="text-xs font-normal text-zinc-400">veículos</span></p>
                  <p className="mt-1 text-[11px] text-emerald-400 font-medium">↑ 3 finalizadas hoje</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#0e1015] p-3">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Faturamento do Mês</span>
                    <IconTrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">R$ 28.450</p>
                  <p className="mt-1 text-[11px] text-zinc-400 font-medium">Ticket médio R$ 420</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#0e1015] p-3">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Peças em Baixa</span>
                    <IconPackage size={16} className="text-amber-400" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">4 <span className="text-xs font-normal text-zinc-400">itens</span></p>
                  <p className="mt-1 text-[11px] text-amber-400 font-medium">Aviso de reposição ativo</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#0e1015] p-3">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Tempo Médio / OS</span>
                    <IconClock size={16} className="text-blue-400" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">1h 45m</p>
                  <p className="mt-1 text-[11px] text-emerald-400 font-medium">-22% de tempo ocioso</p>
                </div>
              </div>

              {/* Tabela Resumo Mockup */}
              <div className="px-4 pb-4">
                <div className="overflow-hidden rounded-xl border border-zinc-800/90 bg-[#0b0d12]">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-300">
                    <span>Últimas Ordens de Serviço</span>
                    <span className="text-[11px] text-zinc-500">Atualizado agora</span>
                  </div>
                  <div className="divide-y divide-zinc-800/60 text-xs">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-orange-400">#OS-1048</span>
                        <div>
                          <p className="font-semibold text-white">Toyota Corolla 2.0 (2022)</p>
                          <p className="text-[11px] text-zinc-400">Placa: BRA2E19 &middot; Troca de pastilhas e fluído</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                        Em Execução
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-orange-400">#OS-1047</span>
                        <div>
                          <p className="font-semibold text-white">Volkswagen Gol 1.6 MSI</p>
                          <p className="text-[11px] text-zinc-400">Placa: RIO4X90 &middot; Revisão preventiva 60.000 km</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                        Pronto p/ Entrega
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILARES DE VALOR (ESTILO CARDS DO CORTIVA) */}
        <section id="pilares" className="mx-auto max-w-6xl px-4 sm:px-6 scroll-mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Pilares do Sistema</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Tudo o que sua oficina precisa para rodar sem atrito
            </h2>
            <p className="mt-2.5 text-sm text-zinc-400">
              Projetado com base nas dores reais do pátio: agilidade no balcão, rastreabilidade na bancada e precisão no fechamento.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PILLARS.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/90 bg-[#0f1117] shadow-xl transition-all duration-300 hover:border-orange-500/40 hover:bg-[#131620]"
                >
                  {pillar.image && (
                    <div className="relative h-48 w-full overflow-hidden border-b border-zinc-800/80">
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105 filter grayscale contrast-115"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/35 to-transparent" />
                    </div>
                  )}

                  <div className="p-7">
                    <div className="flex items-center justify-between">
                      <span className="inline-block rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-xs font-semibold text-orange-300">
                        {pillar.tag}
                      </span>
                      <span className="rounded-xl bg-zinc-800/70 p-2.5 text-orange-400">
                        <PillarIcon size={20} stroke={2} />
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold tracking-tight text-white leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
                      {pillar.description}
                    </p>

                    <ul className="mt-6 space-y-2.5 border-t border-zinc-800/80 pt-5 text-xs text-zinc-300">
                      {pillar.details.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className="font-bold text-orange-400 shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* COMPARATIVO: MÉTODO ANTIGO VS AUTOGESTOR */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-[#11131a] to-[#0b0c10] p-6 sm:p-10">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">A Diferença na Prática</span>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white">
                O fim da prancheta e das anotações perdidas
              </h3>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {/* O jeito antigo */}
              <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-5">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Sem o Autogestor (Antigo)</p>
                <ul className="mt-4 space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold shrink-0">✕</span>
                    <span>Ordem de serviço em papel molhado ou com letra ilegível.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold shrink-0">✕</span>
                    <span>Cliente liga perguntando o status e ninguém no balcão sabe informar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold shrink-0">✕</span>
                    <span>Peça instalada no carro sem lançamento, gerando prejuízo no estoque.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold shrink-0">✕</span>
                    <span>Horas perdidas no fim do mês somando notas para pagar comissão.</span>
                  </li>
                </ul>
              </div>

              {/* Com o Autogestor */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Com o Autogestor (Moderno)</p>
                <ul className="mt-4 space-y-2.5 text-xs text-zinc-200">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>OS digital completa com dados de peças, mão de obra e fotos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Status atualizado no sistema visível por qualquer funcionário da oficina.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Baixa automática de inventário no momento da aprovação do serviço.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Relatórios prontos em 1 clique com comissões calculadas com exatidão.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* GRID DE MÓDULOS E FUNCIONALIDADES */}
        <section id="funcionalidades" className="mx-auto max-w-6xl px-4 sm:px-6 scroll-mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Recursos Completos</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Projetado para toda a rotina da sua oficina
            </h2>
            <p className="mt-2.5 text-sm text-zinc-400">
              Cada módulo foi desenvolvido para reduzir etapas burocráticas e dar velocidade à sua equipe.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feat) => {
              const FeatIcon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-zinc-800/80 bg-[#0d0f14] p-5 transition hover:border-zinc-700 hover:bg-[#12151d]"
                >
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <FeatIcon size={20} stroke={2} />
                  </div>
                  <h4 className="mt-3.5 text-sm font-bold text-white">{feat.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* COMO FUNCIONA (3 PASSOS) */}
        <section id="como-funciona" className="mx-auto max-w-5xl px-4 sm:px-6 scroll-mt-24">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Simples e Direto</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Como funciona o Autogestor na prática
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="relative rounded-2xl border border-zinc-800 bg-[#0e1016] p-6 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-orange-500/20 text-sm font-black text-orange-400">
                1
              </span>
              <h4 className="mt-4 text-base font-bold text-white">Cadastre sua Oficina</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Configure os dados da oficina, convide os mecânicos e cadastre seus principais serviços e peças de estoque.
              </p>
            </div>

            <div className="relative rounded-2xl border border-zinc-800 bg-[#0e1016] p-6 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-orange-500/20 text-sm font-black text-orange-400">
                2
              </span>
              <h4 className="mt-4 text-base font-bold text-white">Abra a Ordem de Serviço</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Insira a placa do carro, associe o cliente, selecione os serviços necessários e imprima a via de entrada.
              </p>
            </div>

            <div className="relative rounded-2xl border border-zinc-800 bg-[#0e1016] p-6 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-orange-500/20 text-sm font-black text-orange-400">
                3
              </span>
              <h4 className="mt-4 text-base font-bold text-white">Finalize e Lucre</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Feche a OS com a forma de pagamento combinada, baixe as peças e veja o faturamento refletir no caixa.
              </p>
            </div>
          </div>
        </section>

        {/* PLANO TRANSPARENTE (ESTILO CORTIVA) */}
        <section id="planos" className="mx-auto max-w-4xl px-4 sm:px-6 scroll-mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-[#0e1017] p-8 text-center shadow-2xl sm:p-12">
            {/* Glows decorativos */}
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-lg">
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-300">
                Plano Oficina Completa
              </span>

              <p className="mt-6 flex items-baseline justify-center gap-1.5 text-white">
                <span className="tnum text-4xl font-extrabold sm:text-5xl">R$ 79,90</span>
                <span className="text-sm font-medium text-zinc-400">/mês</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-400">
                1º mês gratuito para você testar na sua oficina sem compromisso
              </p>

              <ul className="mt-8 space-y-3 text-left text-xs text-zinc-300 sm:text-sm">
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">✓</span>
                  <span>Ordens de Serviço e orçamentos ilimitados</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">✓</span>
                  <span>Histórico completo de veículos por placa e cliente</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">✓</span>
                  <span>Controle de peças com aviso de estoque mínimo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">✓</span>
                  <span>Fechamento financeiro de caixa e comissões da equipe</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">✓</span>
                  <span>Acessos para administradores e mecânicos</span>
                </li>
              </ul>

              <Link
                to={accessToken ? "/dashboard" : "/login"}
                className="mt-8 block rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/60 transition hover:bg-orange-500 active:scale-[0.98]"
              >
                {accessToken ? "Ir para o Painel" : "Começar Meu Teste Grátis"}
              </Link>
              <p className="mt-3 text-xs text-zinc-500">Sem contrato de fidelidade. Cancele quando quiser.</p>
            </div>
          </div>
        </section>

        {/* FAQ - DÚVIDAS FREQUENTES */}
        <section id="faq" className="mx-auto max-w-3xl px-4 sm:px-6 scroll-mt-24">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Dúvidas Frequentes</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Perguntas e Respostas
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {FAQS.map((faq, index) => (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0f14] transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-white hover:text-orange-400 transition"
                >
                  <span>{faq.question}</span>
                  <IconChevronDown
                    size={18}
                    className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180 text-orange-400" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-zinc-800/80 px-4 pb-5 pt-3 sm:px-5 text-xs leading-relaxed text-zinc-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800/80 bg-[#07080a]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-orange-600 text-[11px] font-black text-white">
              A
            </span>
            <span className="font-bold text-zinc-200">Autogestor</span>
            <span>&middot;</span>
            <span>Sistema Integrado de Gestão para Oficinas Mecânicas</span>
          </div>

          <nav className="flex flex-wrap gap-5">
            <a href="#pilares" className="hover:text-zinc-300 hover:underline">Pilares</a>
            <a href="#funcionalidades" className="hover:text-zinc-300 hover:underline">Recursos</a>
            <a href="#planos" className="hover:text-zinc-300 hover:underline">Planos</a>
            <Link to="/login" className="text-orange-400 hover:underline font-semibold">Acessar Sistema</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
