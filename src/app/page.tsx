import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      <h1>Segurança em Next.js</h1>
      <p>
        A regra que organiza tudo o que vem abaixo:{' '}
        <strong>o cliente é território do atacante.</strong> Nada que aconteça no
        navegador — botão escondido, campo <code>disabled</code>, validação de
        formulário, renderização condicional — é uma medida de segurança.
      </p>

      <p>
        <Link href="/acoes">→ Demonstração interativa da falha e da correção</Link>
      </p>

      <h2>1. Server Action é endpoint público</h2>
      <p>
        Cada função com <code>&apos;use server&apos;</code> vira uma rota HTTP invocável
        com <code>curl</code>. Toda ação mutadora precisa, <strong>nesta ordem</strong>:
      </p>
      <ol>
        <li>
          <strong>autenticação</strong> — quem é?
        </li>
        <li>
          <strong>autorização</strong> — pode fazer isto?
        </li>
        <li>
          <strong>validação</strong> — o payload faz sentido? (Zod, server-side)
        </li>
        <li>
          <strong>rate limit</strong> — não está abusando?
        </li>
      </ol>
      <p className="muted">
        Esta é hoje a falha mais comum em aplicações App Router, e é pergunta
        obrigatória em entrevista de senior.
      </p>

      <h2>2. Nunca confie no payload para identidade</h2>
      <pre className="panel" style={{ overflowX: 'auto' }}>{`// ✘ permite publicar em nome de qualquer pessoa
const autorId = formData.get('autorId')

// ✔ a identidade vem da sessao, sempre
const { userId } = await exigirPapel('membro', 'criar post')`}</pre>

      <h2>3. Sessão em cookie httpOnly</h2>
      <p>
        Token em <code>localStorage</code> é legível por qualquer script — inclusive por
        uma dependência comprometida. Cookie <code>httpOnly</code> não é acessível por
        JavaScript, e é a única proteção real contra roubo de sessão via XSS.
      </p>
      <p className="muted">
        As quatro flags: <code>httpOnly</code>, <code>secure</code>,{' '}
        <code>sameSite</code> (defesa contra CSRF), <code>path</code>/<code>maxAge</code>.
      </p>

      <h2>4. Segredo nunca tem prefixo público</h2>
      <p>
        Variáveis com <code>NEXT_PUBLIC_</code> são inseridas{' '}
        <strong>dentro do bundle</strong> e legíveis por qualquer pessoa que abra o
        DevTools. Auditar quais existem é um dos primeiros passos de qualquer revisão de
        segurança.
      </p>
      <pre className="panel" style={{ overflowX: 'auto' }}>{`# encontra segredo exposto
grep -rn "NEXT_PUBLIC_.*\\(KEY\\|SECRET\\|TOKEN\\|PASSWORD\\)" .`}</pre>

      <h2>5. CSP como segunda camada</h2>
      <p>
        Sanitizar entrada é a primeira defesa contra XSS, e ela falha eventualmente. O
        CSP com nonce, em <code>src/middleware.ts</code>, garante que um script injetado
        não execute mesmo assim. Note o custo documentado no arquivo: nonce por
        requisição torna a resposta dinâmica.
      </p>

      <h2>6. As armadilhas menores, mas frequentes</h2>
      <table className="panel" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Risco</th>
            <th align="left">Onde aparece</th>
            <th align="left">Correção</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>XSS</td>
            <td>
              <code>dangerouslySetInnerHTML</code>
            </td>
            <td>DOMPurify antes de renderizar, ou não renderizar HTML de usuário</td>
          </tr>
          <tr>
            <td>XSS por href</td>
            <td>
              <code>&lt;a href={'{urlDoUsuario}'}&gt;</code>
            </td>
            <td>
              validar o protocolo — <code>javascript:</code> executa
            </td>
          </tr>
          <tr>
            <td>Open redirect</td>
            <td>
              <code>redirect(searchParams.next)</code>
            </td>
            <td>lista de destinos permitidos, ou aceitar apenas caminhos relativos</td>
          </tr>
          <tr>
            <td>SSRF</td>
            <td>Route Handler que recebe uma URL e faz fetch nela</td>
            <td>lista de domínios permitidos; bloquear IPs internos</td>
          </tr>
          <tr>
            <td>IDOR</td>
            <td>
              <code>getPedido(params.id)</code> sem checar o dono
            </td>
            <td>a consulta filtra por <code>userId</code> da sessão</td>
          </tr>
          <tr>
            <td>Vazamento em log</td>
            <td>
              <code>console.log(formData)</code>
            </td>
            <td>nunca logar payload bruto de formulário</td>
          </tr>
        </tbody>
      </table>
    </main>
  )
}
