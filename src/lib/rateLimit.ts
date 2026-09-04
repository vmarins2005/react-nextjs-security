import 'server-only'

/**
 * Rate limit em memoria, com janela deslizante simples.
 *
 * ATENCAO - esta implementacao NAO serve para producao, e a razao e importante:
 * ela vive na memoria de UM processo. Numa arquitetura serverless ou com varias
 * instancias, cada uma tem o proprio contador, e o limite efetivo vira
 * `limite x numero de instancias`. Um atacante nem precisa saber disso: a
 * distribuicao acontece sozinha.
 *
 * Em producao use armazenamento compartilhado - Redis (`@upstash/ratelimit`),
 * o rate limit da CDN, ou um WAF. O algoritmo importa menos que o fato de o
 * contador ser compartilhado.
 *
 * Sobre a chave: use a IDENTIDADE quando houver sessao, e o IP apenas como
 * complemento. Limitar so por IP pune escritorio inteiro atras de um NAT e nao
 * detem quem tem varios IPs.
 */

type Registro = { contador: number; expiraEm: number }

const registros = new Map<string, Registro>()

export function checarLimite(
  chave: string,
  opcoes: { max: number; janelaMs: number },
): { permitido: boolean; restantes: number; esperarSegundos: number } {
  const agora = Date.now()
  const atual = registros.get(chave)

  if (!atual || atual.expiraEm < agora) {
    registros.set(chave, { contador: 1, expiraEm: agora + opcoes.janelaMs })
    return { permitido: true, restantes: opcoes.max - 1, esperarSegundos: 0 }
  }

  if (atual.contador >= opcoes.max) {
    return {
      permitido: false,
      restantes: 0,
      esperarSegundos: Math.ceil((atual.expiraEm - agora) / 1000),
    }
  }

  atual.contador += 1
  return { permitido: true, restantes: opcoes.max - atual.contador, esperarSegundos: 0 }
}
