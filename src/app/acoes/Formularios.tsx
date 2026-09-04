'use client'

import { useActionState } from 'react'
import { apagarTudo, criarPost, type ResultadoAcao } from '../actions'

/**
 * Client Components finos, existindo só para consumir `useActionState`.
 *
 * `useActionState(acao, estadoInicial)` devolve `[estado, dispatch, pending]`:
 *   - `estado`  é o retorno da última execução da Server Action
 *   - `dispatch` é passado direto para `<form action={...}>`
 *   - `pending` é `true` enquanto a ação está em voo — sem `useState` manual
 *
 * Repare no que **não** muda: a segurança continua inteiramente do lado do
 * servidor. Este arquivo é apresentação. Se alguém remover o `disabled` do botão
 * pelo DevTools, a ação recusa do mesmo jeito.
 */

export function FormularioDePost() {
  const [estado, dispatch, pending] = useActionState<ResultadoAcao | null, FormData>(
    criarPost,
    null,
  )

  return (
    <form action={dispatch} className="panel">
      <div style={{ display: 'grid', gap: '0.5rem', maxWidth: '34rem' }}>
        <label htmlFor="titulo">Título</label>
        <input id="titulo" name="titulo" aria-invalid={!!estado?.ok === false && !!estado} />
        {estado && !estado.ok && estado.campos?.['titulo'] ? (
          <small style={{ color: 'var(--bad)' }}>{estado.campos['titulo']}</small>
        ) : null}

        <label htmlFor="conteudo">Conteúdo</label>
        <textarea id="conteudo" name="conteudo" rows={3} />
        {estado && !estado.ok && estado.campos?.['conteudo'] ? (
          <small style={{ color: 'var(--bad)' }}>{estado.campos['conteudo']}</small>
        ) : null}

        <button disabled={pending}>{pending ? 'Publicando...' : 'Publicar'}</button>

        {estado && !estado.ok ? (
          <p role="alert" style={{ color: 'var(--bad)' }}>
            {estado.erro}
          </p>
        ) : null}
        {estado?.ok ? (
          <p role="status" style={{ color: 'var(--good)' }}>
            Post publicado.
          </p>
        ) : null}
      </div>
    </form>
  )
}

export function BotaoApagarSeguro() {
  const [estado, dispatch, pending] = useActionState<ResultadoAcao | null, FormData>(
    // `useActionState` sempre passa `formData` como segundo argumento; a ação
    // simplesmente o ignora.
    (anterior) => apagarTudo(anterior),
    null,
  )

  return (
    <form action={dispatch}>
      <button disabled={pending}>Apagar tudo (seguro)</button>
      {estado && !estado.ok ? (
        <p role="alert" style={{ color: 'var(--bad)' }}>
          {estado.erro}
        </p>
      ) : null}
      {estado?.ok ? (
        <p role="status" style={{ color: 'var(--good)' }}>
          Tudo apagado.
        </p>
      ) : null}
    </form>
  )
}
