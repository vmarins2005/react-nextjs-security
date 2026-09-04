import { apagarTudoRuim, papelAtual, trocarPapel } from '../actions'
import { BotaoApagarSeguro, FormularioDePost } from './Formularios'
import { listarPosts } from '@/lib/posts'

export const dynamic = 'force-dynamic'

export default async function AcoesPage() {
  const papel = await papelAtual()
  const posts = listarPosts()

  return (
    <main>
      <h1>Server Actions são endpoints públicos</h1>

      <div className="panel">
        <p style={{ marginTop: 0 }}>
          Papel atual: <strong>{papel}</strong> (guardado em cookie{' '}
          <code>httpOnly</code>)
        </p>
        <form action={trocarPapel} className="row">
          <select name="papel" defaultValue={papel}>
            <option value="anonimo">anônimo</option>
            <option value="membro">membro</option>
            <option value="admin">admin</option>
          </select>
          <button>Trocar papel</button>
        </form>
      </div>

      <h2>Ação protegida corretamente</h2>
      <p>
        Autenticação, autorização, rate limit (5/min) e validação com Zod — nesta ordem,
        antes de qualquer efeito. Tente criar um post como <strong>anônimo</strong>: a
        ação recusa no servidor, não na interface.
      </p>
      <FormularioDePost />

      <h2>Posts</h2>
      <div className="panel">
        {posts.length === 0 ? (
          <p className="muted">Nenhum post.</p>
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <strong>{post.titulo}</strong> — {post.conteudo}{' '}
                <span className="muted">(autor: {post.autorId})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2>A demonstração da falha</h2>
      <p>
        Os dois botões abaixo apagam tudo. O da esquerda é o anti-exemplo:{' '}
        <strong>ele funciona com qualquer papel</strong>, inclusive anônimo. O da direita
        exige admin — verificado no servidor.
      </p>
      <div className="grid cols-2">
        <form action={apagarTudoRuim} className="panel">
          <h3 style={{ marginTop: 0 }}>
            <span className="tag">sem verificação</span>
          </h3>
          <p className="muted">
            Troque para &quot;anônimo&quot; e clique. Apaga do mesmo jeito.
          </p>
          <button>Apagar tudo (inseguro)</button>
        </form>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>
            <span className="tag">exigirPapel('admin')</span>
          </h3>
          <p className="muted">Só funciona como admin, independentemente do que a UI faça.</p>
          <BotaoApagarSeguro />
        </div>
      </div>

      <h2>Prove você mesmo que é um endpoint público</h2>
      <ol>
        <li>Troque para <strong>admin</strong>.</li>
        <li>Abra o DevTools na aba Network.</li>
        <li>Clique em &quot;Apagar tudo (seguro)&quot;.</li>
        <li>
          Na requisição <code>POST</code>, clique com o botão direito e escolha{' '}
          <em>Copy → Copy as cURL</em>.
        </li>
        <li>
          Troque para <strong>anônimo</strong>, remova o cookie do comando cURL e
          execute-o no terminal.
        </li>
        <li>
          A ação insegura executa. A segura devolve erro. <strong>Nada na interface
          fez diferença.</strong>
        </li>
      </ol>
      <p className="muted">
        Repare que o <code>Next-Action</code> no cabeçalho é o id da função. Ele é
        estável entre deploys do mesmo build — não é um segredo, e nunca foi pensado
        como um.
      </p>
    </main>
  )
}
