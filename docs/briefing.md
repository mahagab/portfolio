# Briefing assíncrono

## Estado da implementação

O formulário e os CTAs estão implementados. O WhatsApp continua sendo a ação principal. A opção “Prefiro enviar os detalhes do projeto” aparece na hero e na área de contato quando o briefing está habilitado.

O formulário pede nome, empresa opcional, e-mail para retorno, tipo de site, objetivo, materiais, prazo e investimento. As opções de investimento são até R$ 1.000, R$ 1.000 a R$ 2.000, acima de R$ 2.000 e ainda não defini.

A confirmação diz: “Briefing recebido! Vou analisar suas respostas e retornar pelo e-mail informado em até um dia útil.” Ela só aparece depois que o receptor confirma o envio. Falhas mantêm o conteúdo digitado. Nada do briefing é enviado para o Analytics. O código não grava as respostas em localStorage ou sessionStorage.

Em desenvolvimento, o formulário pode ser conferido em `/#briefing`. Em produção, ele e os links de acesso ficam ocultos até configurar `PUBLIC_BRIEFING_ENABLED=true`. A versão atual publicada não foi alterada por este trabalho.

## Configuração do Directus (11 ou superior)

O site é estático: envia JSON diretamente para `PUBLIC_DIRECTUS_URL/items/project_briefings`. Nenhum token administrativo pode estar no código do site ou em uma variável `PUBLIC_`.

A ferramenta `scripts/setup-directus-briefing.mjs` cria uma coleção dedicada, os campos e uma política pública de CRIAÇÃO, sem liberar leitura, alteração, compartilhamento ou exclusão. Ela não altera as outras coleções. Se encontrar uma configuração conflitante, interrompe para revisão. A configuração remota ainda não foi executada, por falta de acesso administrativo.

A forma mais simples é abrir o terminal na pasta do projeto e executar `node --experimental-strip-types scripts/configure-briefing.mjs`. Ele pede o token em uma entrada oculta, cria a configuração e executa as duas submissões reais. O token não é salvo em disco nem deve ser enviado no chat. Obtenha o token no seu perfil de administrador do Directus e remova ou revogue-o após o uso se tiver sido criado apenas para esta configuração.

Alternativamente, no PowerShell:

```powershell
$briefingSecret = Read-Host 'Token administrativo do Directus' -AsSecureString
$env:DIRECTUS_ADMIN_TOKEN = [System.Net.NetworkCredential]::new('', $briefingSecret).Password
try {
  node --experimental-strip-types scripts/setup-directus-briefing.mjs
  if ($LASTEXITCODE -ne 0) { throw 'A configuração não terminou; revise o erro antes de continuar.' }
  node --experimental-strip-types scripts/test-directus-briefing.mjs
  if ($LASTEXITCODE -ne 0) { throw 'O recebimento real não foi confirmado; não ative o formulário ainda.' }
} finally {
  Remove-Item Env:DIRECTUS_ADMIN_TOKEN -ErrorAction SilentlyContinue
  Remove-Variable briefingSecret -ErrorAction SilentlyContinue
}
```

`PUBLIC_DIRECTUS_URL` é carregada do `.env` pelo script. Se a sua versão do Directus for anterior à 11, configure o papel Public manualmente em vez de executar a ferramenta de políticas.

Também é possível criar manualmente a coleção `project_briefings` no painel:

| Campo | Tipo | Obrigatório |
| --- | --- | --- |
| id | UUID, chave primária automática | sim |
| date_created | Data de criação automática | automático |
| name | String, máximo 100 | sim |
| company | String, máximo 120 | não |
| email | String, máximo 254 | sim |
| site_type | String, opções de `SITE_TYPES` em `src/lib/briefing.ts` | sim |
| objective | Texto, entre 20 e 1.500 caracteres | sim |
| materials | JSON, lista das opções de `MATERIALS` | sim |
| deadline | String, opções de `DEADLINES` | sim |
| budget | String, opções de `BUDGETS` | sim |

Permita apenas criação pública dos campos do formulário (e id, usado pelas simulações). Restrinja as opções de tipo de site, prazo e orçamento e valide os campos de texto. Não permita consulta pública: nomes, e-mails e respostas devem ser vistos apenas por você no painel. A definição programática está no script de configuração.

No servidor do Directus, o CORS precisa permitir a origem exata do site e requisições POST com Content-Type application/json. A configuração do CORS é da hospedagem do Directus, não das variáveis do Astro. O servidor também deve limitar requisições para controlar envios automatizados; as validações do navegador não substituem as do servidor.

## Validação real e ativação

1. Execute a configuração e a ferramenta de simulações com acesso administrativo.
2. Ela envia dois registros fictícios, identifica-os como TESTE, verifica cada campo salvo usando a API administrativa e confere que a leitura pública está bloqueada. Não apaga registros automaticamente.
3. Abra a coleção no painel do Directus e confira os dois registros. Este é o recebimento necessário para concluir a tarefa.
4. Em desenvolvimento, teste também um envio pelo formulário do navegador. Isso valida o CORS da origem, que um teste de API no terminal não cobre.
5. Configure `PUBLIC_BRIEFING_ENABLED=true` no ambiente de hospedagem, execute um novo build e publique. Repita um envio no domínio final.

Você receberá os briefings na coleção do Directus. Não há envio de e-mail ou notificação automática configurado: o e-mail do formulário é o endereço para você retornar ao interessado. Não foram criadas contas, serviços pagos, campanhas ou automações externas.

## Duas simulações e proposta inicial

| Simulação | Informações recebidas no teste local | Proposta inicial possível |
| --- | --- | --- |
| Landing page | Studio de pilates; aula experimental via WhatsApp; página com oferta, benefícios e depoimentos; logo, textos e fotos prontos; 15 a 30 dias; R$ 1.000 a R$ 2.000 | Proposta de uma página para campanha, sujeita à análise dos materiais e à disponibilidade para o prazo desejado. |
| Site institucional | Consultoria B2B; início, sobre, serviços e contato; captação de propostas; logo e domínio prontos; precisa de apoio nos textos; 1 a 2 meses; acima de R$ 2.000 | Proposta institucional com quatro páginas, incluindo o trabalho necessário de organização do conteúdo. |

Os dados permitem selecionar o serviço e a faixa comercial e preparar uma estimativa inicial. O objetivo livre pergunta pelas páginas ou seções para evitar estimar um institucional sem indicação de escopo. As faixas não constituem preço fechado, e o prazo escolhido não é compromisso automático de entrega.

## Verificações executadas

`node --experimental-strip-types --test tests/briefing.test.mjs tests/briefing-submit.test.mjs tests/contact.test.mjs`

As duas simulações foram recebidas por um servidor HTTP local de teste; isso valida os dados e o transporte, mas não equivale a recebimento no Directus de produção. Também são testados formulário vazio, e-mail inválido, opções inválidas, materiais contraditórios, limites de texto, respostas 400/403/429/500, falha de rede e página de login que responde 200.

Referências: [API de itens](https://directus.com/docs/api/items) e [controle de acesso do Directus](https://directus.com/docs/guides/auth/access-control).

