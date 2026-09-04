# Segurança em Server Actions

> **Stack:** Next.js 15 (App Router) + Zod
> **Conceito:** o cliente é território do atacante — e Server Action é endpoint
> HTTP público

---

## O problema que este projeto ataca

Esta é a falha de segurança mais comum em aplicações App Router hoje, e ela
nasce de um mal-entendido específico:

> "O botão de excluir só aparece para admin, então a ação está protegida."

Não está. Cada função marcada com `'use server'` recebe um id e é exposta como
uma rota HTTP. Qualquer pessoa pode invocá-la com `curl`, com o payload que
quiser, **sem passar pela sua interface**.

Esconder o botão, usar `disabled`, renderizar condicionalmente — tudo isso é
cliente. E o cliente é território do atacante.

O projeto tem uma demonstração interativa: você copia a requisição como cURL do
próprio DevTools, troca de papel, e vê a ação insegura executar mesmo assim.

---

## Rodando

```bash
npm install
npm run dev
```

Vá para `/acoes` e siga o roteiro de exploração no fim da página.

---

## As quatro verificações obrigatórias

Toda Server Action **mutadora** precisa disto, nesta ordem:

```ts
export async function criarPost(formData: FormData) {
  const sessao = await exigirPapel('membro', 'criar post')   // 1 e 2
  const limite = checarLimite(`criarPost:${sessao.userId}`)  // 4
  const parsed = schema.safeParse({ ... })                   // 3
  // só então: efeito
}
```

1. **Autenticação** — quem é?
2. **Autorização** — pode fazer isto?
3. **Validação** — o payload faz sentido? (Zod, no servidor)
4. **Rate limit** — não está abusando?

E a regra que atravessa todas: **a identidade vem da sessão, nunca do payload.**
Aceitar `autorId` do formulário permite a qualquer pessoa publicar em nome de
outra — a vulnerabilidade que mais aparece em auditoria de código.

---

## O que ler, em ordem

1. **`src/app/actions.ts`** — o anti-exemplo e a versão correta lado a lado.
   Leia o bloco no topo.

2. **`src/lib/auth.ts`** — as quatro flags de um cookie de sessão, e por que
   `exigirPapel` **lança** em vez de retornar booleano (*fail closed*).

3. **`src/lib/rateLimit.ts`** — inclui a limitação honesta: rate limit em memória
   **não serve para produção** em ambiente com múltiplas instâncias, e o motivo é
   contraintuitivo.

4. **`src/middleware.ts`** — CSP com nonce, os cabeçalhos de segurança, e o custo
   documentado: nonce por requisição torna a resposta dinâmica.

5. **`src/app/page.tsx`** — a tabela das armadilhas menores: open redirect, SSRF,
   IDOR, XSS por `href`.

---

## Checklist de revisão de segurança

Use isto como template de PR em projeto Next:

- [ ] Toda Server Action mutadora verifica sessão **e** permissão na primeira linha
- [ ] Nenhuma ação lê identidade do `FormData`
- [ ] Todo input externo é validado com Zod **no servidor**
- [ ] Ações sensíveis (login, cadastro, envio de email) têm rate limit
- [ ] Sessão em cookie `httpOnly` + `secure` + `sameSite`
- [ ] Nenhum segredo com prefixo `NEXT_PUBLIC_`
- [ ] Nenhum `dangerouslySetInnerHTML` sem sanitização
- [ ] Redirecionamento com destino dinâmico valida contra lista permitida
- [ ] Consultas por id filtram pelo dono (`where: { id, userId: sessao.userId }`)
- [ ] `console.log` não recebe payload bruto de formulário nem token
- [ ] Headers de segurança configurados
- [ ] `npm audit` sem vulnerabilidade alta no CI

Busca rápida por segredo exposto:

```bash
grep -rn "NEXT_PUBLIC_.*\(KEY\|SECRET\|TOKEN\|PASSWORD\)" .
```

---

## Decisões documentadas

- [ADR-001 — Autorização na camada de dados, não na de UI](./docs/ADR-001-autorizacao-na-camada-de-dados.md)
- [ADR-002 — CSP com nonce apenas nas rotas dinâmicas](./docs/ADR-002-csp-com-nonce-onde-vale.md)

---

## Exercícios

1. **Explore a falha.** Siga o roteiro em `/acoes`: copie a requisição como cURL,
   troque de papel, execute. A ação insegura funciona; a segura recusa. **Faça
   isso de verdade** — ver acontecendo muda a forma como você revisa código.

2. **Prove que validar no cliente não protege.** Adicione `required` e
   `minLength` ao formulário. Depois envie um payload inválido por cURL. Passa
   direto pelo HTML e é barrado pelo Zod, no servidor.

3. **IDOR.** Adicione uma ação `apagarPost(id)` que verifica sessão mas **não**
   verifica se o post é do usuário. Crie posts com dois papéis diferentes e apague
   o do outro. Depois corrija filtrando pelo dono.

4. **Rate limit distribuído.** Rode duas instâncias em portas diferentes
   (`PORT=3000` e `PORT=3001`). Confirme que o limite de 5/min vira 10/min. É a
   demonstração de por que rate limit em memória não serve em serverless.

5. **CSP na prática.** Adicione `<script>alert(1)</script>` via
   `dangerouslySetInnerHTML` numa página. Com CSP ativa, o navegador recusa
   executar e loga a violação no console. Depois remova o CSP do middleware e
   veja executar.

6. **Open redirect.** Crie uma rota `/login` que faz
   `redirect(searchParams.next)`. Acesse `/login?next=https://exemplo-malicioso.com`.
   Corrija aceitando apenas caminhos que comecem com `/`.

7. **O exercício de tech lead.** Rode o checklist acima no repositório onde você
   trabalha. Para cada item que falhar, escreva uma issue com o impacto descrito
   em termos de negócio ("um usuário comum consegue apagar dados de outro"), não
   em termos técnicos. É assim que trabalho de segurança consegue prioridade.

---

## A frase para levar

> **Se está no cliente, está no controle do atacante.**

Validação, ocultação, `disabled` e renderização condicional são **experiência do
usuário**. Segurança acontece exclusivamente no servidor — e a pergunta de
revisão é sempre a mesma: *o que acontece se alguém chamar isto direto?*


---

## Faz parte de uma série

16 projetos independentes, um por conceito, sobre o que separa um dev pleno de um
senior/tech lead em React e Next.js. Cada um tem README, ADRs documentando as
decisões, e exercícios.

| Projeto | Conceito |
|---|---|
| [react-solid-na-pratica](https://github.com/vmarins2005/react-solid-na-pratica) | Os 5 principios SOLID traduzidos para componentes React, com anti-exemplo e versao boa lado a lado |
| [react-quando-abstrair](https://github.com/vmarins2005/react-quando-abstrair) | A mesma feature em 3 versoes: duplicada, abstraida cedo demais, e abstraida na hora certa |
| [react-padroes-de-componentes](https://github.com/vmarins2005/react-padroes-de-componentes) | Compound, headless, slots, state reducer e estado controlavel: como absorver variacao sem explodir em props |
| [react-arquitetura-por-feature](https://github.com/vmarins2005/react-arquitetura-por-feature) | Organizacao por feature em Next.js, com fronteiras garantidas por ESLint em vez de disciplina |
| [react-regra-de-negocio-no-front](https://github.com/vmarins2005/react-regra-de-negocio-no-front) | Clean Architecture no front: dominio puro, portas e adaptadores, sem uma linha de React no nucleo |
| [react-onde-mora-o-estado](https://github.com/vmarins2005/react-onde-mora-o-estado) | Os 6 tipos de estado em React e a ferramenta certa para cada um |
| [react-estados-impossiveis](https://github.com/vmarins2005/react-estados-impossiveis) | Da sopa de booleanos ao XState: tornar estados invalidos inexprimiveis |
| [react-typescript-na-fronteira](https://github.com/vmarins2005/react-typescript-na-fronteira) | Tipo nao existe em runtime: validacao com Zod, branded types e verificacao de exaustividade |
| [react-testes-que-valem-a-pena](https://github.com/vmarins2005/react-testes-que-valem-a-pena) | Testing Trophy com Vitest, Testing Library, MSW, Playwright e axe |
| [react-performance-no-next](https://github.com/vmarins2005/react-performance-no-next) | Waterfalls de requisicao, streaming com Suspense e o que RSC realmente economiza de bundle |
| [react-entendendo-o-cache-do-next](https://github.com/vmarins2005/react-entendendo-o-cache-do-next) | As 4 camadas de cache do App Router e como diagnosticar dado velho na tela |
| [react-acessibilidade-na-pratica](https://github.com/vmarins2005/react-acessibilidade-na-pratica) | WCAG 2.2 AA em React: foco, teclado, live regions e os requisitos invisiveis em code review |
| `react-seguranca-no-next` **(você está aqui)** | Server Action e endpoint publico: autorizacao, validacao, rate limit e CSP com nonce |
| [react-quando-quebra-em-producao](https://github.com/vmarins2005/react-quando-quebra-em-producao) | Taxonomia de erros, error boundaries, log estruturado e feature flags com kill switch |
| [react-design-system-em-monorepo](https://github.com/vmarins2005/react-design-system-em-monorepo) | Design system como pacote versionado: Turborepo, design tokens e changesets |
| [react-commits-que-contam-historia](https://github.com/vmarins2005/react-commits-que-contam-historia) | Commit atomico e Conventional Commits, com historico curado e um bug para achar via git bisect |

---

## Licença

[MIT](./LICENSE) — use, copie e adapte à vontade, inclusive em projeto comercial.
Se este material ajudou, uma estrela no repositório é o suficiente.
