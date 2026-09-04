import 'server-only'
import { cookies } from 'next/headers'

/**
 * Sessão simulada, lida de um cookie.
 *
 * Em produção isto validaria um JWT assinado ou consultaria a sessão no banco.
 * O que interessa aqui é **onde** a sessão é lida e **como** o cookie é
 * configurado.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS QUATRO FLAGS DE UM COOKIE DE SESSÃO
 *
 *   httpOnly: true      JavaScript não consegue ler. É o que impede que um XSS
 *                       roube a sessão. Token em `localStorage` é legível por
 *                       qualquer script injetado — inclusive por dependência
 *                       comprometida.
 *
 *   secure: true        Só viaja por HTTPS.
 *
 *   sameSite: 'lax'     Principal defesa contra CSRF. 'strict' é mais seguro
 *                       porém quebra o fluxo de voltar de um provedor OAuth.
 *
 *   path / maxAge       Escopo e validade explícitos.
 *
 * O erro comum é guardar o token em `localStorage` "porque é mais fácil de
 * mandar no header". A conveniência custa a única proteção real contra roubo de
 * sessão via XSS.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Papel = 'anonimo' | 'membro' | 'admin'
export type Sessao = { userId: string; papel: Papel }

export async function getSessao(): Promise<Sessao> {
  const store = await cookies()
  const papel = store.get('papel')?.value

  if (papel === 'admin') return { userId: 'u_admin', papel: 'admin' }
  if (papel === 'membro') return { userId: 'u_membro', papel: 'membro' }
  return { userId: 'anon', papel: 'anonimo' }
}

/** Erro de domínio para falha de autorização. */
export class NaoAutorizado extends Error {
  constructor(acao: string) {
    super(`Sem permissão para: ${acao}`)
    this.name = 'NaoAutorizado'
  }
}

/**
 * A função que TODA Server Action mutadora precisa chamar na primeira linha.
 *
 * Note que ela **lança**, não retorna booleano. Isso é deliberado: um retorno
 * booleano pode ser ignorado por engano (`verificarPapel(...)` sem `if`),
 * enquanto uma exceção não passa despercebida. É *fail closed* — na dúvida,
 * nega.
 */
export async function exigirPapel(minimo: Exclude<Papel, 'anonimo'>, acao: string): Promise<Sessao> {
  const sessao = await getSessao()

  const nivel: Record<Papel, number> = { anonimo: 0, membro: 1, admin: 2 }
  const exigido = nivel[minimo]
  const atual = nivel[sessao.papel]

  if (atual < exigido) throw new NaoAutorizado(acao)
  return sessao
}
