import { NextResponse, type NextRequest } from 'next/server'

/**
 * CABEÇALHOS DE SEGURANÇA + CSP COM NONCE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE CSP
 *
 * Sanitizar entrada é a primeira defesa contra XSS, e ela falha eventualmente —
 * uma dependência comprometida, um `dangerouslySetInnerHTML` esquecido, um
 * campo novo que ninguém tratou. CSP é a **segunda camada**: mesmo que um script
 * seja injetado, o navegador se recusa a executá-lo se ele não tiver o nonce
 * correto.
 *
 * É defesa em profundidade: você não confia numa única barreira.
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE NONCE, E NÃO `unsafe-inline`
 *
 * `script-src 'unsafe-inline'` é o mesmo que não ter CSP para scripts — que é
 * exatamente o que a política deveria impedir. O nonce é um valor aleatório
 * gerado **por requisição**: o Next o injeta nos próprios scripts, e qualquer
 * script injetado por um atacante não o terá.
 *
 * Consequência importante: gerar nonce por requisição torna a resposta
 * **dinâmica**. Uma rota estática que passa por este middleware deixa de ser
 * cacheável no Full Route Cache. Em muitos produtos, a decisão certa é aplicar
 * o nonce só nas rotas autenticadas e usar hashes nas páginas públicas.
 * Ver ADR-002.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const csp = [
    `default-src 'self'`,
    // `strict-dynamic` faz o navegador confiar em scripts carregados por um
    // script já confiável — necessário para o carregamento em chunks do Next.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Styled-components e CSS-in-JS costumam exigir `unsafe-inline` para estilo.
    // É um risco menor que o de script, mas continua sendo um risco: prefira
    // CSS Modules ou Tailwind, que não precisam disto.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    // Bloqueia <object>, <embed> e <applet>.
    `object-src 'none'`,
    // Impede que <base> reescreva a resolução de URLs relativas.
    `base-uri 'self'`,
    // Impede que formulários sejam enviados para outro domínio.
    `form-action 'self'`,
    // Substituto moderno do X-Frame-Options: impede clickjacking.
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers } })

  response.headers.set('Content-Security-Policy', csp)

  // Impede o navegador de "adivinhar" o tipo do conteúdo. Sem isto, um upload
  // de texto pode acabar interpretado como HTML e executado.
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Não vazar a URL completa (que pode conter ids) para sites externos.
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Desliga APIs sensíveis que a aplicação não usa.
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS: só faz sentido em produção com HTTPS. Ligar em desenvolvimento
  // "gruda" o localhost em HTTPS no navegador e dá muito trabalho para desfazer.
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  }

  return response
}

export const config = {
  // Middleware roda em TODA requisição que casar com o matcher. Mantenha-o
  // barato: verificação de sessão e redirecionamento, nunca consulta a banco.
  // Excluímos assets estáticos, que não precisam de nada disto.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
