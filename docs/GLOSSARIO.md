# Glossário

Termos que aparecem em code review e entrevista de senior. A definição curta é a
que você precisa conseguir dar de improviso, sem consultar nada.

**AHA (Avoid Hasty Abstractions)** — prefira duplicação a uma abstração errada. A
abstração prematura custa mais para desfazer do que a duplicação custa para manter.

**Anticorruption layer** — camada que traduz um modelo externo (API legada,
fornecedor) para o modelo do seu domínio, impedindo que o formato deles vaze pela
aplicação inteira.

**Barrel file** — `index.ts` que reexporta o conteúdo de uma pasta. Conveniente e
perigoso: quebra tree-shaking e cria ciclos de import quando cresce.

**Branded type** — tipo primitivo marcado para não ser intercambiável
(`type UserId = string & { readonly __brand: 'UserId' }`). Impede passar um id de
pedido onde se espera um id de usuário.

**CLS (Cumulative Layout Shift)** — quanto o layout pula durante o carregamento.

**Colocation** — manter o arquivo o mais perto possível de quem o usa. O oposto de
pastas globais `utils/`, `components/`, `hooks/` na raiz.

**Commit atômico** — commit que contém **uma** mudança lógica completa, compila e
passa nos testes sozinho, e pode ser revertido isoladamente sem quebrar nada.

**Compound component** — conjunto de componentes que compartilham estado implícito
via contexto (`Tabs` + `Tabs.List` + `Tabs.Panel`). Resolve OCP sem explosão de props.

**CSP (Content Security Policy)** — header que declara de onde scripts e estilos
podem vir. Principal defesa em profundidade contra XSS.

**Discriminated union** — união de tipos com um campo literal em comum que permite
ao TypeScript estreitar o tipo. A forma correta de modelar estado assíncrono.

**DIP (Dependency Inversion)** — módulos de alto nível dependem de abstrações, não
de implementações. Na prática: a UI depende de uma interface, não do `axios`.

**Estado derivado** — valor calculável a partir de outro estado. Não deve ser
armazenado nem sincronizado por efeito; deve ser calculado durante o render.

**FSD (Feature-Sliced Design)** — arquitetura de camadas para front
(`app → pages → widgets → features → entities → shared`) com dependência
estritamente unidirecional entre camadas.

**Headless component** — componente que entrega comportamento e acessibilidade sem
estilo, deixando a aparência para quem consome. Ex.: Radix, React Aria.

**Hydration mismatch** — o HTML do servidor difere do primeiro render do cliente.
Causa clássica: ler `localStorage`, `Date.now()` ou `window` durante o render.

**INP (Interaction to Next Paint)** — Core Web Vital que substituiu o FID. Mede a
latência real de resposta a interações. É o mais sensível a excesso de JS no cliente.

**ISR (Incremental Static Regeneration)** — página estática que se regenera por
tempo ou sob demanda, sem rebuild completo do site.

**LCP (Largest Contentful Paint)** — quando o maior elemento visível termina de pintar.

**Optimistic update** — aplicar o resultado esperado na UI antes da confirmação do
servidor, com rollback em caso de erro.

**Prop drilling** — passar uma prop por níveis que não a usam, apenas para repassar.

**Regra de três** — abstraia na terceira ocorrência, não na segunda. Só com três
exemplos você enxerga qual é o eixo real de variação.

**RSC (React Server Component)** — componente que executa apenas no servidor; seu
código **não** vai para o bundle do cliente.

**RUM (Real User Monitoring)** — métricas coletadas de usuários reais, por oposição
a *lab data* (Lighthouse local), que mede uma máquina idealizada em rede idealizada.

**Server Action** — função marcada com `'use server'`, invocável a partir do
cliente. É um **endpoint HTTP público**: exige autenticação, autorização e
validação próprias, independentemente de qual botão a chama.

**Strangler pattern** — estratégia de migração em que o sistema novo envolve o
antigo e o substitui rota a rota, sem big bang.

**Testing Trophy** — modelo de distribuição de testes (estático → unitário →
**integração, a maior fatia** → E2E), mais adequado a front que a pirâmide clássica.

**Waterfall (de requisições)** — requisições sequenciais que poderiam ser paralelas.
Principal causa de LCP ruim em aplicação com dados.

**YAGNI (You Aren't Gonna Need It)** — não construa o que a demanda atual não pede.
O custo não é escrever, é manter e ter que entender depois.
