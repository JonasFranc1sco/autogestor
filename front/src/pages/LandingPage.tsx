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
      title: "Ordens de Serviço e Orçamentos em segundos, sem papel",
      description:
        "Diga adeus às fichas amassadas e notas de mão esquecidas na bancada. Registre o diagnóstico, adicione peças e serviços e gere o checklist completo do veículo.",
      details: [
        "Acompanhamento de status em tempo real (Aguardando, Em Andamento, Concluída)",
        "PDF ou impressão formatada para entrega ao cliente em 1 clique",
        "Atribuição de mecânicos responsáveis por cada serviço",
      ],
    },
    {
      title: "Histórico completo do veículo pela placa",
      description:
        "Quando o cliente retornar, saiba na hora tudo o que já foi feito, quilometragem anterior, peças trocadas e quando foi a última revisão.",
      details: [
        "Busca instantânea por placa, modelo ou CPF do cliente",
        "Vínculo automático de múltiplos veículos por cliente",
        "Transparência total que gera credibilidade e retorno garantido",
      ],
    },
    {
      title: "Controle de estoque sincronizado a cada serviço",
      description:
        "Peças baixadas automaticamente do inventário assim que a OS é aprovada. Evite rupturas na bancada e saiba o custo e a margem de cada item utilizado.",
      details: [
        "Avisos automáticos de peças com estoque no nível crítico",
        "Catálogo completo com preço de custo, venda e margem de lucro",
        "Histórico de movimentações vinculado diretamente às ordens de serviço",
      ],
    },
    {
      title: "Caixa fechado, comissões e relatórios em 1 clique",
      description:
        "Tenha visão exata do que entra e sai da oficina todos os dias. Calcule comissões de mecânicos sem planilhas manuais e acompanhe a evolução do faturamento.",
      details: [
        "Fluxo de caixa diário com entradas, saídas, sangrias e formas de pagamento",
        "Cálculo preciso de comissões por mecânico e por serviço executado",
        "Relatórios consolidados de faturamento e ticket médio da oficina",
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
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-orange-500/20 selection:text-orange-900 antialiased">
      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-black tracking-tight text-zinc-900 group">
            <span className="tracking-wider">
              AUTO<span className="text-orange-600">GESTOR</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-600">
            <a href="#pilares" className="transition hover:text-zinc-900">Pilares</a>
            <a href="#funcionalidades" className="transition hover:text-zinc-900">Recursos</a>
            <a href="#como-funciona" className="transition hover:text-zinc-900">Como Funciona</a>
            <a href="#planos" className="transition hover:text-zinc-900">Planos</a>
            <a href="#faq" className="transition hover:text-zinc-900">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-3">
            {accessToken ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-500 active:scale-[0.98]"
              >
                <span>Ir para o Painel</span>
                <IconArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Sobre nós
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="space-y-28 pb-24">
        {/* HERO SECTION COM HEADLINE À ESQUERDA E IMAGEM À DIREITA */}
        <section className="relative isolate overflow-hidden pt-12 sm:pt-20">
          {/* Imagem de Fundo Fotográfica com Vignette & Gradient Mesh Claro */}
          <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
            <img
              src="/images/marketing/garage.jpg"
              alt="Oficina mecânica moderna"
              className="size-full object-cover object-center opacity-15 filter grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/90 to-white" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_15%,rgba(249,115,22,0.12),transparent)]" />
          </div>

          {/* Aura luminosa animada de fundo */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[110px] animate-ambient-glow" />

          <div className="mx-auto max-w-[90rem] px-6 sm:px-10 lg:px-16">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-24">
              {/* Coluna da Esquerda: Headline & CTAs */}
              <div className="text-center lg:col-span-5 lg:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl lg:leading-[1.12]">
                  Sua oficina sem papelada.{" "}
                  <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    Todo o controle na palma da sua mão.
                  </span>
                </h1>

                <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg sm:leading-relaxed">
                  O Autogestor centraliza e agrupa ordens de serviço, histórico veicular pela placa,
                  baixa automática no estoque de peças, fechamento de caixa e outros. Mais velocidade na bancada e mais lucro no final do mês.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start">
                  <Link
                    to={accessToken ? "/dashboard" : "/login"}
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:bg-orange-500 hover:shadow-orange-500/35 active:scale-[0.98] sm:w-auto"
                  >
                    <span>{accessToken ? "Acessar Sistema" : "Entrar em contato"}</span>
                    <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>

                  <a
                    href="#pilares"
                    className="w-full rounded-xl border border-zinc-300 bg-white/90 px-6 py-3.5 text-center text-sm font-medium text-zinc-700 shadow-sm backdrop-blur-sm transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto"
                  >
                    Conhecer Recursos
                  </a>
                </div>
              </div>

              {/* Coluna da Direita: Imagem do Sistema em Proporção 16:9 de Monitor */}
              <div className="lg:col-span-7">
                <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/10">
                  <img
                    src="/images/marketing/demonstracao.png"
                    alt="Painel do sistema Autogestor"
                    className="size-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEMA E PROPOSTA DE VALOR */}
        <section id="proposta-valor" className="mx-auto max-w-6xl px-4 sm:px-6 scroll-mt-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Qual o valor do tempo dentro da sua oficina?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              O ambiente de trabalho nos seus dias mais agitados tende a ter um curto período de tempo disponível, tempo esse que é importante para anotar serviços, peças, o que saiu e o que entrou.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Card 1: O Problema (Cinza / Preto e Branco) */}
            <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-zinc-100/80 p-8 sm:p-10 shadow-sm">
              <div>
                <span className="inline-block rounded-lg py-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Gestão no Papel e Improviso
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-zinc-800 leading-snug sm:text-2xl">
                  A falta de integridade e segurança dos dados
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  Sem um sistema dedicado, informações importantes se perdem entre a recepção e os elevadores.
                </p>
              </div>

              <ul className="mt-7 space-y-3.5 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-zinc-400 shrink-0">✕</span>
                  <span>Ordens de serviço em papel rasgado, manchado de graxa ou com letra ilegível.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-zinc-400 shrink-0">✕</span>
                  <span>Cliente liga perguntando o andamento do veículo e ninguém sabe responder rápido.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-zinc-400 shrink-0">✕</span>
                  <span>Peças aplicadas nos carros sem registro na nota, causando prejuízo invisível no estoque.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-zinc-400 shrink-0">✕</span>
                  <span>Horas perdidas no fim do mês somando comissões e tentando fechar o caixa no caderno.</span>
                </li>
              </ul>
            </div>

            {/* Card 2: A Proposta de Valor (Detalhes na Cor do Sistema) */}
            <div className="flex flex-col justify-between rounded-3xl border border-orange-500/40 bg-white p-8 sm:p-10 shadow-xl shadow-orange-500/10">
              <div>
                <span className="inline-block rounded-lg py-1 text-xs font-bold uppercase tracking-wider text-orange-600">
                  Autogestor
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-zinc-900 leading-snug sm:text-2xl">
                  Padronização, agilidade no atendimento e margem protegida
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  Toda a operação conectada em uma única plataforma rápida, clara e feita para a rotina da oficina.
                </p>
              </div>

              <ul className="mt-7 space-y-3.5 border-t border-orange-500/20 pt-6 text-sm text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-orange-600 shrink-0">✓</span>
                  <span>Orçamentos e OS digitais padronizadas, prontas para imprimir ou enviar digitalmente em segundos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-orange-600 shrink-0">✓</span>
                  <span>Status em tempo real e histórico completo do veículo acessível apenas pela placa.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-orange-600 shrink-0">✓</span>
                  <span>Baixa automática de peças no momento da aprovação da OS com alertas de reposição.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-orange-600 shrink-0">✓</span>
                  <span>Caixa diário integrado e relatórios de faturamento e comissões gerados em 1 clique.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* PILARES DE VALOR */}
        <section id="pilares" className="mx-auto max-w-6xl px-4 sm:px-6 scroll-mt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Tudo o que sua oficina precisa para rodar sem atrito
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Projetado com base nas dores reais do pátio: agilidade no balcão, rastreabilidade na bancada e precisão no fechamento.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.title}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg shadow-zinc-900/5 transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl"
              >
                <div className="flex flex-1 flex-col justify-between p-8 sm:p-10">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 leading-snug sm:text-2xl">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                      {pillar.description}
                    </p>
                  </div>

                  <ul className="mt-7 space-y-3 border-t border-zinc-200/80 pt-6 text-sm text-zinc-700">
                    {pillar.details.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="font-bold text-orange-600 shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* GRID DE MÓDULOS E FUNCIONALIDADES */}
        <section id="funcionalidades" className="mx-auto max-w-6xl px-4 sm:px-6 scroll-mt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Projetado para toda a rotina da sua oficina
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Cada módulo foi desenvolvido para reduzir etapas burocráticas e dar velocidade à sua equipe.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feat) => {
              const FeatIcon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 transition hover:border-orange-500/30 hover:bg-white hover:shadow-md"
                >
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                    <FeatIcon size={20} stroke={2} />
                  </div>
                  <h4 className="mt-3.5 text-sm font-bold text-zinc-900">{feat.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* COMO FUNCIONA (3 PASSOS) */}
        <section id="como-funciona" className="mx-auto max-w-5xl px-4 sm:px-6 scroll-mt-24">
          <div className="text-center">
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Como funciona o Autogestor na prática
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-orange-500/15 text-sm font-black text-orange-600">
                1
              </span>
              <h4 className="mt-4 text-base font-bold text-zinc-900">Cadastre sua Oficina</h4>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                Configure os dados da oficina, convide os mecânicos e cadastre seus principais serviços e peças de estoque.
                Cadastre os funcionários, 
              </p>
            </div>

            <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-orange-500/15 text-sm font-black text-orange-600">
                2
              </span>
              <h4 className="mt-4 text-base font-bold text-zinc-900">Abra a Ordem de Serviço</h4>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                Insira a placa do carro, associe o cliente, selecione os serviços necessários e imprima a via de entrada.
              </p>
            </div>

            <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-orange-500/15 text-sm font-black text-orange-600">
                3
              </span>
              <h4 className="mt-4 text-base font-bold text-zinc-900">Finalize e Lucre</h4>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                Feche a OS com a forma de pagamento combinada, baixe as peças e veja o faturamento refletir no caixa.
              </p>
            </div>
          </div>
        </section>

        {/* PLANO TRANSPARENTE */}
        <section id="planos" className="mx-auto max-w-4xl px-4 sm:px-6 scroll-mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-b from-orange-50/50 to-white p-8 text-center shadow-xl shadow-orange-500/5 sm:p-12">
            {/* Glows decorativos */}
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-lg">
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-700">
                Plano Oficina Completa
              </span>

              <p className="mt-6 flex items-baseline justify-center gap-1.5 text-zinc-900">
                <span className="tnum text-4xl font-extrabold sm:text-5xl">R$ 79,90</span>
                <span className="text-sm font-medium text-zinc-500">/mês</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-600">
                1º mês gratuito para você testar na sua oficina sem compromisso
              </p>

              <ul className="mt-8 space-y-3 text-left text-xs text-zinc-700 sm:text-sm">
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">✓</span>
                  <span>Ordens de Serviço e orçamentos ilimitados</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">✓</span>
                  <span>Histórico completo de veículos por placa e cliente</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">✓</span>
                  <span>Controle de peças com aviso de estoque mínimo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">✓</span>
                  <span>Fechamento financeiro de caixa e comissões da equipe</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">✓</span>
                  <span>Acessos para administradores e mecânicos</span>
                </li>
              </ul>

              <Link
                to={accessToken ? "/dashboard" : "/login"}
                className="mt-8 block rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-500 active:scale-[0.98]"
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
            <span className="text-sm font-bold uppercase tracking-widest text-orange-600">Dúvidas Frequentes</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Perguntas e Respostas
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {FAQS.map((faq, index) => (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/70 transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-zinc-900 hover:text-orange-600 transition"
                >
                  <span>{faq.question}</span>
                  <IconChevronDown
                    size={18}
                    className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180 text-orange-600" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-zinc-200 bg-white px-4 pb-5 pt-3 sm:px-5 text-xs leading-relaxed text-zinc-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-orange-600 text-[11px] font-black text-white">
              A
            </span>
            <span className="font-bold text-zinc-900">Autogestor</span>
            <span>&middot;</span>
            <span>Sistema Integrado de Gestão para Oficinas Mecânicas</span>
          </div>

          <nav className="flex flex-wrap gap-5">
            <a href="#pilares" className="hover:text-zinc-900 hover:underline">Pilares</a>
            <a href="#funcionalidades" className="hover:text-zinc-900 hover:underline">Recursos</a>
            <a href="#planos" className="hover:text-zinc-900 hover:underline">Planos</a>
            <Link to="/login" className="text-orange-600 hover:underline font-semibold">Acessar Sistema</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
