# Origem dos contatos e medição

## Links para divulgar

Substitua `https://seu-dominio.com/` pelo domínio real do site:

- Google Ads: `https://seu-dominio.com/?utm_source=google&utm_medium=cpc&utm_campaign=landing_pages`
- Instagram (anúncio): `https://seu-dominio.com/?utm_source=instagram&utm_medium=paid_social&utm_campaign=landing_pages`
- Instagram (bio): `https://seu-dominio.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio`
- Facebook (anúncio): `https://seu-dominio.com/?utm_source=facebook&utm_medium=paid_social&utm_campaign=landing_pages`

Use esses links como destino dos anúncios e da bio, e não o link direto do WhatsApp. O visitante deve passar pelo site para medir o clique.

Todos os botões do WhatsApp adaptam a mensagem: “Vim pelo Google”, “Vim pelo Instagram”, etc. Os parâmetros UTM têm prioridade. Sem UTMs, os identificadores gclid/gbraid/wbraid indicam Google Ads; na ausência deles, o referenciador pode identificar a plataforma. O fbclid sozinho não distingue Instagram de Facebook, portanto use UTMs.

Quando não há evidência da origem, a mensagem informa “Vim pelo site da GM codeworks (origem não identificada)”. Não se presume que todo contato sem parâmetros veio de acesso direto. Sem JavaScript, o botão continua funcionando com essa mensagem de origem não identificada.

A última origem identificada é mantida por até 30 minutos na mesma aba, usando sessionStorage. Se o armazenamento estiver bloqueado, a identificação pela URL atual continua funcionando. Os dados de campanha da URL não são reproduzidos livremente na mensagem. O número do WhatsApp está centralizado em `src/lib/contact.ts`.

## Tag base do Google Ads

A tag `AW-18526877385` está configurada no componente `Analytics.astro`, carregado no head do layout. O gtag.js é carregado uma única vez, mesmo se o GA4 também for configurado. Para substituir o ID, configure `PUBLIC_GOOGLE_ADS_ID` no ambiente de hospedagem; um valor vazio desativa a tag do Ads. É necessário refazer o build e publicar para aplicar qualquer mudança.

Essa é a tag base da conta, não uma ação de conversão. O evento `whatsapp_click` existente não é automaticamente uma conversão do Google Ads. Para medir esse clique como conversão, crie uma ação específica no Google Ads e forneça o snippet do evento com o destino completo `AW-18526877385/ROTULO_DA_CONVERSAO`. Não há rótulo configurado e não registramos visita à página como conversão.

A configuração do GA4 continua separada, com `PUBLIC_GA_MEASUREMENT_ID=G-...`. Após publicar, valide a tag base no domínio com o Tag Assistant. O build local confirma a inclusão do código, mas não confirma o recebimento no painel do Google Ads.

Referência: https://developers.google.com/tag-platform/gtagjs/configure

## Ativar o GA4 posteriormente

A medição está preparada, mas fica DESATIVADA sem um ID real.

1. Crie uma propriedade no Google Analytics e um fluxo de dados da Web para o domínio do site.
2. Copie o ID de medição `G-...` e configure `PUBLIC_GA_MEASUREMENT_ID=G-SEUIDREAL` no ambiente de hospedagem (ou no `.env` local).
3. Execute um novo build e publique o resultado. O ID é público e é incorporado ao build.
4. Abra um link de teste com UTM e confira a mensagem do WhatsApp. Não é necessário enviar a mensagem.
5. Confira o evento `whatsapp_click` nos relatórios em tempo real ou no DebugView usando o modo de depuração do Google Analytics.
6. Para relatórios com os parâmetros personalizados, registre dimensões de evento para `contact_source`, `contact_medium` e `contact_location`.

O evento `whatsapp_click` registra um clique, não confirma que a conversa foi iniciada, que a mensagem foi enviada ou que houve uma venda. `contact_location` distingue menu, hero e contato. Não enviamos o telefone nem a mensagem do WhatsApp nos parâmetros do evento. Bloqueadores podem impedir a medição sem impedir o contato.

Não há tag de conversão do Google Ads configurada. A configuração da propriedade e a validação real do recebimento de eventos ainda são necessárias antes de usar os números como base de campanha. Antes de ativar a coleta, alinhe a configuração de privacidade/consentimento do site à sua operação.

Referências oficiais:
- https://developers.google.com/tag-platform/gtagjs
- https://developers.google.com/analytics/devguides/collection/ga4/events

## Verificações locais

- `node --experimental-strip-types --test tests/contact.test.mjs`
- `npm run build`


Você é um especialista em recrutamento e marca pessoal no LinkedIn. Sua tarefa é analisar detalhadamente o perfil de um profissional que deseja ser encontrado e abordado por recrutadores. Avalie os seguintes pontos com base no perfil em PDF anexado:
Título Profissional
Está claro, objetivo e otimizado com palavras-chave da área de atuação?
Sobre (Resumo)
O texto é estratégico, com storytelling, foco em competências, conquistas e abertura para novas oportunidades? Está escrito de forma humanizada e profissional?
Experiências Profissionais
As descrições estão completas, com foco em entregas, resultados e ferramentas utilizadas?
Competências
As principais competências técnicas e comportamentais da área estão listadas de forma clara e relevante?
Destaques
O perfil utiliza a seção de “Destaques” para mostrar portfólio, certificados, projetos ou postagens relevantes?
URL personalizada
O link do perfil está otimizado (sem números aleatórios), facilitando o compartilhamento?
Atividades e Engajamento
O profissional publica ou interage com frequência? O conteúdo está alinhado ao objetivo de atrair recrutadores?
Recomendações
O perfil possui recomendações recebidas ou escritas que reforçam sua credibilidade?
Palavras-chave e SEO
O perfil utiliza termos relevantes da área para facilitar a busca dos recrutadores?
Para cada item acima, entregue:
Uma porcentagem de desempenho (0% a 100%).
Uma justificativa objetiva e técnica explicando como chegou a essa nota.
Pontos positivos e oportunidades de melhoria com linguagem direta e construtiva.
Ao final, entregue também:
Um resumo geral da impressão do perfil.
Uma lista de melhorias práticas e prioritárias.
Uma sugestão de título profissional otimizado, se necessário.
Uma sugestão de mensagem para o campo “Sobre”, que possa atrair recrutadores com clareza e impacto.
