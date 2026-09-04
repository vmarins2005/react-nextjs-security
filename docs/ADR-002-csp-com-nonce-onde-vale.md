# ADR-002 — CSP com nonce nas rotas dinâmicas; hashes nas rotas estáticas

- **Status:** Aceito
- **Data:** 2026-09-04

## Contexto

Queremos CSP como **defesa em profundidade** contra XSS: sanitizar entrada é a
primeira barreira, e ela falha eventualmente — uma dependência comprometida, um
`dangerouslySetInnerHTML` esquecido, um campo novo que ninguém tratou. Com CSP,
um script injetado não executa mesmo assim.

Existe um conflito direto no App Router:

- **Nonce** é a forma correta de permitir os scripts do Next sem `unsafe-inline`.
- Nonce precisa ser **único por requisição**.
- Gerar valor por requisição no middleware torna a resposta **dinâmica**.
- Rota dinâmica sai do Full Route Cache.

Ou seja: a implementação ingênua de CSP **desliga o cache do site inteiro**, e
essa consequência não é óbvia — ela aparece semanas depois, como custo de
infraestrutura e LCP pior, sem ninguém conectar as duas coisas.

E a alternativa preguiçosa é pior: `script-src 'unsafe-inline'` é equivalente a
não ter CSP para script, que é justamente o que a política deveria proteger.

## Decisão

CSP em duas configurações, por tipo de rota:

**Rotas dinâmicas** (autenticadas, com `cookies()`, dashboards): CSP com **nonce
por requisição**, gerado no middleware. Elas já são dinâmicas — o nonce não custa
cache nenhum.

**Rotas estáticas e ISR** (landing, catálogo, blog): CSP **sem nonce**, usando
`'strict-dynamic'` com hashes dos scripts de bootstrap do Next, servida por
header estático da CDN. Preserva o Full Route Cache.

Em ambas, os demais cabeçalhos são iguais e sempre presentes:

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security  (apenas em produção)
frame-ancestors 'none'     (dentro da CSP)
```

Rollout obrigatório em duas etapas:
1. `Content-Security-Policy-Report-Only` por pelo menos duas semanas, coletando
   violações
2. só então mudar para o header que bloqueia

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Sem CSP | Zero atrito | Nenhuma defesa em profundidade; um XSS vira comprometimento total | Inaceitável em produto com sessão |
| CSP com `unsafe-inline` | Fácil; nada quebra | Equivale a não ter CSP para script | Segurança de fachada, que é pior que nenhuma |
| Nonce em todas as rotas | Uniforme; máxima proteção | Torna o site inteiro dinâmico; perde ISR; custo e LCP piores | Custo desproporcional nas rotas públicas |
| Só hashes, em todas | Preserva cache em tudo | Hashes precisam ser atualizados a cada build; frágil com chunks dinâmicos | Manutenção alta |
| Nonce nas dinâmicas, hash nas estáticas | Cada rota paga o que precisa | Duas configurações para manter; risco de divergirem | **Escolhido** |

## Consequências

**Positivas**
- XSS deixa de ser exploração automática: o script injetado não executa.
- `frame-ancestors 'none'` elimina clickjacking.
- Rotas públicas continuam estáticas, com o desempenho e o custo de sempre.
- O modo report-only dá visibilidade das violações **antes** de quebrar alguma
  coisa em produção — inclusive violações causadas por extensões de navegador dos
  usuários, que geram ruído e precisam ser filtradas.

**Negativas**
- Duas configurações de CSP para manter, com risco real de divergirem. Mitigação:
  a política é montada por uma função compartilhada, parametrizada.
- CSP quebra integrações que injetam script: analytics, chat de suporte, mapa,
  gateway de pagamento. Cada um exige entrada explícita na política, e essa lista
  cresce.
- `style-src 'unsafe-inline'` continua necessário com CSS-in-JS. É um risco menor
  que o de script, mas é um risco — e é mais um argumento a favor de CSS Modules
  ou Tailwind.
- Depuração de violação é chata: o console diz o que bloqueou, raramente diz o
  que fazer.

**Monitorar**
- Relatórios de violação (via `report-to`). Um pico costuma significar
  integração nova sem entrada na política — ou um ataque em curso.
- Proporção de rotas dinâmicas: se crescer, a economia desta decisão diminui.

## Nota transferível

O princípio que a decisão ilustra:

> **Defesa em profundidade tem custo, e o custo precisa ser medido antes de
> escolher onde aplicá-la.**

CSP é claramente boa. Aplicá-la sem entender que nonce por requisição desliga o
cache de página é como ligar um antivírus que consome toda a CPU: a intenção está
certa e o resultado líquido pode ser negativo.
