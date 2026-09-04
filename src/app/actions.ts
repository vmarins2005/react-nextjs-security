'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { exigirPapel, getSessao, NaoAutorizado } from '@/lib/auth'
import { checarLimite } from '@/lib/rateLimit'
import { adicionarPost, apagarTodosOsPosts, type Post } from '@/lib/posts'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  A LIÇÃO CENTRAL DESTE PROJETO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   **Uma Server Action é um endpoint HTTP público.**
 *
 * O Next gera um id para cada função marcada com `'use server'` e expõe uma rota
 * que a invoca. Qualquer pessoa pode chamá-la com `curl`, com o payload que
 * quiser, sem passar pela sua interface.
 *
 * Esconder o botão não protege nada. `disabled` não protege nada. Renderizar
 * condicionalmente não protege nada. Tudo isso é **cliente**, e cliente é
 * território do atacante.
 *
 * Toda Server Action mutadora precisa das quatro verificações abaixo:
 *
 *   1. autenticação  — quem é?
 *   2. autorização   — pode fazer isto?
 *   3. validação     — o payload faz sentido?
 *   4. rate limit    — não está abusando?
 *
 * Esta é, hoje, a falha de segurança mais comum em aplicações App Router — e é
 * pergunta obrigatória em entrevista de senior para vaga com Next.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * ANTI-EXEMPLO
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Esta ação parece segura porque, na interface, o botão que a chama só aparece
 * para admin. Ela está completamente exposta.
 *
 * Exploração, sem nenhuma ferramenta especial: abra o DevTools na aba Network,
 * execute a ação uma vez como admin, copie a requisição como cURL, troque de
 * papel, e execute o cURL. Funciona.
 */
export async function apagarTudoRuim(): Promise<void> {
  // ✘ sem autenticação
  // ✘ sem autorização
  // ✘ sem rate limit
  apagarTodosOsPosts()
  revalidatePath('/acoes')
}

/* ────────────────────────────────────────────────────────────────────────────
 * VERSÃO CORRETA
 * ──────────────────────────────────────────────────────────────────────────── */

const criarPostSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'Título precisa de ao menos 3 caracteres')
    // Limite de tamanho não é frescura: sem ele, um payload de 10MB entra no
    // seu banco e a linha vira um problema permanente.
    .max(120, 'Título muito longo'),
  conteudo: z.string().trim().min(1, 'Escreva algo').max(5_000),
})

export type ResultadoAcao =
  | { ok: true }
  | { ok: false; erro: string; campos?: Record<string, string> }

/**
 * Assinatura de `useActionState`: `(estadoAnterior, formData)`.
 *
 * Um `<form action={fn}>` puro exige que a ação retorne `void`. Como queremos
 * devolver erros de validação para a tela, a ação passa a ser consumida por
 * `useActionState` num Client Component — que é o padrão do Next 15 para
 * formulário com feedback, e o que dá `pending` de graça.
 */
export async function criarPost(
  _anterior: ResultadoAcao | null,
  formData: FormData,
): Promise<ResultadoAcao> {
  try {
    // (1) e (2) — quem é, e pode fazer isto. SEMPRE a primeira coisa.
    const sessao = await exigirPapel('membro', 'criar post')

    // (4) — rate limit por identidade, não apenas por IP.
    const limite = checarLimite(`criarPost:${sessao.userId}`, { max: 5, janelaMs: 60_000 })
    if (!limite.permitido) {
      return { ok: false, erro: `Muitas tentativas. Tente em ${limite.esperarSegundos}s.` }
    }

    // (3) — validação server-side. A validação do cliente é conveniência de UX;
    // ela não protege nada, porque o cliente não executa o seu código.
    const parsed = criarPostSchema.safeParse({
      titulo: formData.get('titulo'),
      conteudo: formData.get('conteudo'),
    })

    if (!parsed.success) {
      const campos: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0]
        if (typeof campo === 'string') campos[campo] = issue.message
      }
      return { ok: false, erro: 'Dados inválidos', campos }
    }

    const post: Post = {
      id: crypto.randomUUID(),
      titulo: parsed.data.titulo,
      conteudo: parsed.data.conteudo,
      // O autor vem da SESSÃO, nunca do formulário. Aceitar `autorId` do
      // payload permitiria a qualquer pessoa publicar em nome de outra — e essa
      // é a vulnerabilidade que mais aparece em auditoria de código.
      autorId: sessao.userId,
      criadoEm: new Date().toISOString(),
    }

    adicionarPost(post)
    revalidatePath('/acoes')
    return { ok: true }
  } catch (error) {
    if (error instanceof NaoAutorizado) {
      // Mensagem genérica para o usuário; o detalhe vai para o log do servidor.
      // Vazar "você não é admin" já entrega informação sobre o modelo de
      // permissões para quem está sondando.
      return { ok: false, erro: 'Você não tem permissão para esta ação.' }
    }
    throw error
  }
}

export async function apagarTudo(_anterior: ResultadoAcao | null): Promise<ResultadoAcao> {
  try {
    await exigirPapel('admin', 'apagar todos os posts')
    apagarTodosOsPosts()
    revalidatePath('/acoes')
    return { ok: true }
  } catch (error) {
    if (error instanceof NaoAutorizado) {
      return { ok: false, erro: 'Apenas administradores podem fazer isto.' }
    }
    throw error
  }
}

/** Troca o papel simulado. Existe apenas para a demonstração. */
export async function trocarPapel(formData: FormData): Promise<void> {
  const papel = String(formData.get('papel') ?? 'anonimo')
  const store = await cookies()

  store.set('papel', papel, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })

  revalidatePath('/acoes')
}

/** Usada pela página para exibir o papel atual. */
export async function papelAtual() {
  return (await getSessao()).papel
}
