#!/usr/bin/env node

console.log(`
📋 Conexões alternativas ao Supabase:

1️⃣ **Via Supabase Client (JavaScript/TypeScript)** ✅ FUNCIONANDO
   - Já funciona na sua aplicação
   - Use para queries normais

2️⃣ **Via psql com Pooler** (Necessita string de conexão)
   Acesse: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/settings/database

   Copie a "Connection string" com formato:
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres

   Use assim:
   psql "postgresql://postgres.quovvwrwyfkzhgqdeham:[SENHA]@[POOLER-HOST]:6543/postgres"

3️⃣ **Ativar IPv6 no Router**
   - Acesse: http://192.168.0.1
   - Procure por "IPv6" nas configurações
   - Ative: Native/DHCPv6
   - Reinicie o router

4️⃣ **Verificar com ISP**
   - Ligue para seu ISP
   - Pergunte: "Vocês suportam IPv6 nativo?"
   - Se sim, peça para ativar

---

Qual operador você usa? (MEO/NOS/Vodafone/NOWO)
`);
