// Cria (ou atualiza) as 3 contas de demonstração, uma por perfil de acesso,
// e vincula a consumidora à nutricionista.
//
// Uso:  npm run seed:demo
//
// Precisa, no .env.local (que NUNCA vai para o GitHub):
//   VITE_SUPABASE_URL=...                 (o mesmo do app)
//   SUPABASE_SERVICE_ROLE_KEY=...         (Project Settings → API Keys → secret / service_role)
//   DEMO_PASSWORD=...                     (senha das 3 contas, mínimo 6 caracteres)
//
// A chave service_role ignora a RLS: use só aqui, no seu computador, nunca no app.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.DEMO_PASSWORD

if (!url || !serviceKey || !password || password.length < 6) {
  console.error(
    'Faltam variáveis no .env.local: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e DEMO_PASSWORD (mínimo 6 caracteres). Veja o README.',
  )
  process.exit(1)
}

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const ACCOUNTS = [
  {
    email: 'consumidor.demo@nutridecifra.app',
    name: 'Carla Consumidora',
    role: 'consumer',
    profile: { restrictions: ['gluten', 'sugar'], goal: 'reduce_sugar', sugar_limit_g: 25, sodium_limit_mg: 400 },
  },
  { email: 'nutricionista.demo@nutridecifra.app', name: 'Dra. Nina Nutricionista', role: 'nutritionist', profile: {} },
  { email: 'admin.demo@nutridecifra.app', name: 'Alex Administrador', role: 'admin', profile: {} },
]

async function findUserId(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const u = data.users.find((x) => x.email?.toLowerCase() === email)
    if (u) return u.id
    if (data.users.length < 200) return null
  }
  return null
}

async function upsertAccount(a) {
  let id = await findUserId(a.email)
  if (id) {
    const { error } = await db.auth.admin.updateUserById(id, { password, email_confirm: true })
    if (error) throw error
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: a.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: a.name },
    })
    if (error) throw error
    id = data.user.id
  }
  // o gatilho handle_new_user cria o perfil; aqui garantimos nome, perfil de acesso e preferências
  const { error } = await db
    .from('profiles')
    .upsert({ id, email: a.email, name: a.name, role: a.role, ...a.profile }, { onConflict: 'id' })
  if (error) {
    if (String(error.message).includes('role')) {
      throw new Error('A coluna "role" não existe. Rode supabase/migrations/002_perfis_e_permissoes.sql antes do seed.')
    }
    throw error
  }
  return id
}

const ids = {}
for (const a of ACCOUNTS) {
  ids[a.role] = await upsertAccount(a)
  console.log(`ok  ${a.role.padEnd(12)} ${a.email}`)
}

const { error: linkError } = await db
  .from('care_links')
  .upsert(
    { patient_id: ids.consumer, nutritionist_id: ids.nutritionist, status: 'active', revoked_at: null },
    { onConflict: 'patient_id,nutritionist_id' },
  )
if (linkError) throw linkError
console.log('ok  vínculo      consumidora → nutricionista')
console.log('\nPronto. Entre no app com qualquer um dos e-mails acima e a senha definida em DEMO_PASSWORD.')
