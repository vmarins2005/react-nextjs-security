# Modelo de ADR (Architecture Decision Record)

ADR é o artefato mais subestimado de tech lead. Ele não documenta *o que* o código
faz — o código faz isso sozinho. Ele documenta **por que a alternativa foi
descartada**, que é exatamente a informação que se perde em três meses e faz
alguém refazer a discussão do zero.

Regras de uso:

- Um arquivo por decisão, e **imutável**. Mudou de ideia? Escreva um ADR novo com
  status "Substitui ADR-00X" e marque o antigo como "Substituído".
- Numeração sequencial e nome descritivo: `ADR-004-zustand-em-vez-de-redux.md`.
- Curto. Uma página. Se passou disso, provavelmente são duas decisões.
- Escrito **na hora da decisão**, não depois. ADR retroativo vira racionalização.

---

## Template

    # ADR-00X — <decisão em uma frase, no imperativo>

    - Status: Proposto | Aceito | Substituído por ADR-00Y | Descartado
    - Data: AAAA-MM-DD
    - Decisores: <quem participou>

    ## Contexto

    Qual é a força que exige uma decisão agora? Restrição técnica, prazo, tamanho e
    maturidade do time, requisito de negócio, custo. Fatos, não opinião.

    ## Decisão

    O que foi decidido, afirmativo e direto. "Vamos usar X para Y."

    ## Alternativas consideradas

    | Alternativa | Prós | Contras | Por que não |
    |---|---|---|---|
    | A |  |  |  |
    | B |  |  |  |

    Esta é a seção que dá valor ao documento. Um ADR sem alternativas descartadas
    é um anúncio, não uma decisão.

    ## Consequências

    Positivas: o que fica mais fácil.

    Negativas: o que fica mais difícil — e você precisa listar. Toda decisão tem
    custo; ADR que só lista benefício é propaganda.

    Neutras / monitorar: qual gatilho nos faria revisitar isto.

---

## Por que isso importa na avaliação de senioridade

Um dev pleno responde "usei Zustand". Um senior responde "usei Zustand **em vez
de** Redux Toolkit porque o estado global era pequeno e o custo de boilerplate não
se pagava; se surgir necessidade de time-travel debugging ou middlewares de
auditoria, o ADR-004 registra que revisitamos". A segunda resposta demonstra que
você entende decisão como algo reversível e com custo, não como preferência.
