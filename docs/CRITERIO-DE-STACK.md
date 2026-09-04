# Critério de escolha: Next.js ou React + Vite?

Esta é a primeira decisão de arquitetura de qualquer projeto React, e a resposta
correta em entrevista **nunca** é "Next.js, sempre". Um tech lead que não sabe
argumentar contra o próprio framework favorito não está avaliando, está torcendo.

## A pergunta que decide

> **O servidor precisa participar da renderização?**

Se a resposta for não, o Next.js entrega complexidade que você paga sem usar: o
modelo de cache em quatro camadas, a fronteira server/client, o build de duas
árvores, o acoplamento a um runtime de servidor no deploy.

## Escolha **Next.js** quando houver pelo menos um destes

| Sinal | Por quê |
|---|---|
| SEO importa | O conteúdo precisa estar no HTML da primeira resposta |
| Conteúdo público e cacheável | SSG/ISR entrega HTML de CDN, custo próximo de zero |
| First paint é métrica de negócio | Streaming + RSC reduzem drasticamente o LCP |
| Precisa de camada de servidor própria | Route Handlers e Server Actions eliminam um BFF separado |
| Segredo não pode ir ao cliente | Buscar dado no servidor mantém token fora do bundle |
| Bundle precisa ser pequeno | RSC não envia ao cliente o JS do componente que roda no servidor |

## Escolha **React + Vite** quando

| Sinal | Por quê |
|---|---|
| App atrás de login | Nada é indexável; SSR não paga o próprio custo |
| Ferramenta interna / dashboard | O usuário abre uma vez e fica; TTI importa mais que LCP |
| Não há servidor Node no deploy | Vite gera estáticos; sobe em qualquer bucket ou CDN |
| O foco é lógica de cliente | Menos camadas entre você e o problema |
| Biblioteca ou design system | Você entrega um pacote, não uma aplicação |

## Aplicação neste lab

O critério adicional aqui é **didático**: cada projeto usa o stack que deixa o
conceito mais visível, com o mínimo de ruído em volta.

- **Vite** para tudo que é lógica de cliente pura (SOLID, padrões de componente,
  estado, tipos, testes, acessibilidade). Colocar isso em Next só adicionaria a
  fronteira `'use client'` como distração de algo que não é o assunto da aula.
- **Next.js** só onde o conceito **é** o servidor: RSC e streaming, modelo de
  cache, segurança de Server Actions, observabilidade ponta a ponta e
  organização de rotas em escala.
- **Turborepo** no design system, porque o conceito ali é justamente *múltiplos
  pacotes versionados*, que não existe em app único.

## A resposta de entrevista

> "Eu começaria perguntando se o conteúdo precisa ser indexável e se existe
> requisito de first paint. Sem esses dois, um SPA com Vite entrega o mesmo valor
> com muito menos superfície operacional — e o time não precisa aprender o modelo
> de cache do App Router para entregar a primeira feature. Se aparecer SEO,
> conteúdo público, ou necessidade de manter credencial fora do cliente, o
> Next.js passa a se pagar."
