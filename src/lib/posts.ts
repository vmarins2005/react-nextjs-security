import 'server-only'

export type Post = {
  id: string
  titulo: string
  conteudo: string
  autorId: string
  criadoEm: string
}

let posts: Post[] = [
  {
    id: 'seed-1',
    titulo: 'Primeiro post',
    conteudo: 'Conteudo de exemplo criado no boot do servidor.',
    autorId: 'u_membro',
    criadoEm: new Date().toISOString(),
  },
]

export function listarPosts(): Post[] {
  return posts
}

export function adicionarPost(post: Post): void {
  posts = [post, ...posts]
}

export function apagarTodosOsPosts(): void {
  posts = []
}
