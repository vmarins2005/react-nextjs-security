# ADR-001 — Autorização na camada de dados, nunca na de UI

- **Status:** Aceito
- **Data:** 2026-09-04

## Contexto

O padrão de autorização na base era condicional de renderização:

```tsx
{usuario.papel === 'admin' && <BotaoExcluir onClick={excluir} />}
```

Isso não é autorização. É **ocultação**. A Server Action `excluir` continua
sendo um endpoint HTTP público, invocável por `curl` com o payload copiado do
próprio DevTools.

O problema se agrava com o número de pontos de entrada. A mesma operação pode
ser chamada de uma Server Action, de um Route Handler, de um job agendado e de
um script de manutenção. Verificar permissão em cada ponto significa que
**esquecer um** basta — e ninguém percebe, porque a interface continua correta.

Uma revisão interna encontrou três operações sensíveis expostas exatamente
assim, todas com a UI impecável.

## Decisão

A verificação de permissão vive na **camada mais próxima do dado**, e é
obrigatória:

1. **Toda Server Action mutadora** começa com `await exigirPapel(...)`, antes de
   qualquer efeito colateral.
2. **Toda consulta por id filtra pelo dono**, sem exceção:
   ```ts
   // ✘ IDOR: qualquer id, de qualquer usuário
   db.pedido.findUnique({ where: { id } })

   // ✔ o filtro faz parte da consulta
   db.pedido.findUnique({ where: { id, userId: sessao.userId } })
   ```
3. **A identidade vem sempre da sessão**, nunca do payload.
4. **`exigirPapel` lança** em vez de retornar booleano — *fail closed*. Um
   retorno booleano pode ser ignorado por engano (`verificar(...)` sem `if`);
   uma exceção não.
5. A condicional de UI **permanece**, como experiência do usuário. Ela apenas
   deixa de ser tratada como medida de segurança.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Só condicional de UI | Zero código extra | Não é segurança; a ação continua pública | É o problema |
| Middleware verificando rota | Um lugar só | Server Action não tem rota estável e legível; middleware não conhece o recurso sendo acessado | Cobre autenticação, não autorização por recurso |
| Camada de política (CASL, oso) | Regras declarativas e centralizadas; testáveis | Mais uma abstração; curva de aprendizado; exagero para 3 papéis | Revisitar se o modelo de permissões crescer |
| RLS no banco (Postgres) | Impossível de contornar; a política acompanha o dado | Exige o banco certo e disciplina de conexão; difícil de depurar | **Ideal** quando disponível; combinar com o item abaixo |
| Verificação na Server Action + filtro na consulta | Simples; explícito; próximo do dado | Exige disciplina em cada ação | **Escolhido** |

## Consequências

**Positivas**
- A proteção acompanha o **dado**, não a tela. Um caminho de entrada novo (job,
  webhook, script) herda a mesma verificação porque usa a mesma função.
- IDOR deixa de ser possível por construção: o filtro está na consulta.
- Fica auditável: dá para verificar por busca que toda ação mutadora chama
  `exigirPapel`.

**Negativas**
- Repetição: a primeira linha de toda ação é igual. Isso é aceitável e até
  desejável — explícito é melhor que implícito em segurança. Um wrapper
  (`comAutorizacao('admin', fn)`) reduz a repetição, ao custo de tornar a
  verificação menos visível na leitura.
- Exige disciplina em cada ação nova. **Mitigação:** item obrigatório no template
  de PR, e verificação por busca no CI.
- Mensagens de erro precisam ser genéricas para o usuário: dizer "você não é
  admin" já entrega informação sobre o modelo de permissões para quem sonda.

**Monitorar**
- Server Actions sem chamada a `exigirPapel` — deve ser possível verificar com
  um script simples no CI.
- Consultas `findUnique`/`findFirst` sem filtro de dono.

## Nota transferível

A pergunta única que resolve todo code review de segurança em front:

> **"O que acontece se alguém chamar isto direto, sem passar pela minha tela?"**

Se a resposta não for "é recusado no servidor", não há autorização — há
ocultação.
