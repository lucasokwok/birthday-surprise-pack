# Skills e referências para implementação

Pesquisa realizada em 09/11/2026, orientada pela [especificação](PROJECT_SPEC.md) e pelo [roadmap](ROADMAP.md). O objetivo é preparar implementação de rasgo, saída, revelação e cartas premium sem alterar a aplicação nesta etapa.

**Atualização de planejamento:** por decisão do usuário, usar somente `npm run build` como validação da implementação. Não executar lint, testes, navegador, screenshots, vídeos ou benchmarks. `webapp-testing` permanece instalada para eventual solicitação explícita futura. Priorizar animações com design provisório; deploy será feito pelo usuário.

## 1. Resultado da seleção

Foram selecionadas oito skills locais: cinco oficiais da GreenSock, duas da Anthropic e uma da Vercel. O destino é `.agents/skills/`, com pastas completas e versões fixadas por commit. O [índice local](../.agents/skills/README.md) explica quando usar cada uma, e [sources.json](../.agents/skills/sources.json) registra origem e hashes dos arquivos.

Skills são instruções e recursos para agentes, não pacotes npm de execução. A instalação não inclui novas bibliotecas no frontend, navegador de testes ou serviços externos. O uso efetivo ocorre na próxima etapa de desenvolvimento.

### Critérios utilizados

- Compatibilidade com React, Vite, GSAP e os objetivos já definidos.
- Preferência por material do mantenedor da tecnologia e fonte verificável no GitHub.
- Leitura dos `SKILL.md`, inspeção de referências e verificação das versões baixadas contra os hashes da árvore upstream.
- Adoção no catálogo e reputação do repositório como sinais adicionais, sem tratar popularidade como prova de correção.
- Evitar coleções inteiras, ferramentas de scroll e stacks alternativas sem relação com o rasgo de um pacote.

Foram consultados o catálogo skills.sh, sua busca por CLI e os repositórios de origem. Na consulta, `greensock/gsap-skills` tinha 18.158 estrelas, `anthropics/skills` 190.474 e `vercel-labs/agent-skills` 33.765, conforme metadados do GitHub; são fotografias da pesquisa, não valores permanentes.

## 2. Skills escolhidas

As contagens aproximadas abaixo foram retornadas por `npx skills find` em 09/11/2026; podem divergir ligeiramente das páginas por atualização/cache. O conteúdo instalado vem do GitHub fixado, não dos resumos do catálogo.

| Skill e catálogo | Origem | Instalações aproximadas | Utilidade concreta |
| --- | --- | --- | --- |
| [gsap-core](https://skills.sh/greensock/gsap-skills/gsap-core) | GreenSock | 85,3 mil | Transformações, curvas, stagger e ramificações para movimento reduzido |
| [gsap-timeline](https://skills.sh/greensock/gsap-skills/gsap-timeline) | GreenSock | 78,5 mil | Timeline pausada controlada pelo gesto e sequência após confirmação |
| [gsap-react](https://skills.sh/greensock/gsap-skills/gsap-react) | GreenSock | 75 mil | Escopo, refs, contexto e limpeza no ciclo React |
| [gsap-performance](https://skills.sh/greensock/gsap-skills/gsap-performance) | GreenSock | 78,5 mil | Escritas agrupadas, transformações e redução de trabalho no celular |
| [gsap-utils](https://skills.sh/greensock/gsap-skills/gsap-utils) | GreenSock | 73,6 mil | `clamp`, `normalize`, `mapRange` para converter o arraste em progresso |
| [frontend-design](https://skills.sh/anthropics/skills/frontend-design) | Anthropic | 1,1 milhão | Identidade original, tipografia, composição, material e acabamento |
| [vercel-react-best-practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) | Vercel | 882,5 mil | Separar progresso contínuo de renderização React e evitar trabalho redundante |
| [webapp-testing](https://skills.sh/anthropics/skills/webapp-testing) | Anthropic | 200,9 mil | Testes do fluxo, captura de tela, console e validação em navegador |

### Limites e adaptações necessárias

- `gsap-react` mostra `@gsap/react`, ausente no manifesto atual. Sua alternativa com `gsap.context()` é suficiente para começar. A instalação da skill não autoriza adicionar o pacote automaticamente.
- Não interpretar `contextSafe` como cancelamento de callbacks antigos: ele serve para registrar animações no contexto. Cancelar recursos e proteger a identidade da sessão continua sendo necessário.
- Os exemplos `unitize(value, unit)` e a afirmação de que `shuffle` cria outro array, na revisão de `gsap-utils`, divergem das páginas oficiais: [`unitize`](https://gsap.com/docs/v3/GSAP/UtilityMethods/unitize()/) envolve uma função, e [`shuffle`](https://gsap.com/docs/v3/GSAP/UtilityMethods/shuffle()/) modifica o array recebido. Preservamos a origem e registramos aqui a correção. O projeto não precisa embaralhar presentes.
- A skill Vercel contém material de Next.js/servidor. Aplicar somente regras pertinentes ao frontend atual; não introduzir SSR, cache de servidor, autenticação ou APIs.
- A skill de testes inclui exemplos Python/Playwright e um helper de servidor. Esses recursos foram copiados, sem executá-los ou instalar seus requisitos. Ao utilizá-los, seguir o `--help` e adaptar às ferramentas disponíveis.
- Fontes oficiais também podem ter erros: conferir as APIs da versão usada antes de incorporar um exemplo.

Não foram selecionadas skills de ScrollTrigger, outros frameworks, bancos, comércio eletrônico, Remotion ou geração de vídeos. O produto é uma interação ao vivo controlada por gesto, e a stack atual já é adequada para o primeiro protótipo.

## 3. Repositórios de referência

As observações abaixo resultam da leitura de arquivos concretos. Não foram executadas demos nem medidos desempenho ou acessibilidade dos projetos externos. Referência de técnica não significa dependência recomendada ou cópia de sua identidade visual.

### 3.1 Luango/openpack — referência mais próxima de rasgo e continuidade

[Repositório](https://github.com/Luango/openpack), revisão analisada `ac1688d5c273922b9ff60d653be2389ceac2086c`.

Arquivos prioritários:

- [src/pack.js](https://github.com/Luango/openpack/blob/ac1688d5c273922b9ff60d653be2389ceac2086c/src/pack.js): Pointer Events, recorte SVG, separação das partes e confirmação.
- [src/reveal.js](https://github.com/Luango/openpack/blob/ac1688d5c273922b9ff60d653be2389ceac2086c/src/reveal.js): baralho, interação com a carta frontal e transição para coleção.
- [docs/tear-and-exit.md](https://github.com/Luango/openpack/blob/ac1688d5c273922b9ff60d653be2389ceac2086c/docs/tear-and-exit.md): regras e parâmetros do gesto, confirmação e saída da embalagem.
- [src/motion.js](https://github.com/Luango/openpack/blob/ac1688d5c273922b9ff60d653be2389ceac2086c/src/motion.js): motor de movimento referenciado pelos componentes; leitura adicional antes de qualquer adaptação.

O código de `pack.js` cria recortes complementares com `clipPath`, acompanha a trajetória do ponteiro e chama a revelação após separar o material. O baralho é preparado atrás da embalagem, o que dá uma referência concreta para evitar o salto entre duas cenas desconectadas.

**Como aplicar o estudo:** primeiro entender camadas, sistema de coordenadas e fronteira entre gesto e animação automática. Reproduzir a ideia com arte própria, faixa superior simples e GSAP, sem portar o motor inteiro. É um repositório pequeno em adoção (duas estrelas na consulta), usado aqui pela pertinência do código inspecionado.

**Diferenças importantes:** o exemplo aceita trajetórias mais livres e pode confirmar ao cruzar uma borda ainda durante o arraste. Nosso contrato inicial é horizontal e confirma na soltura após o limiar; a especificação do produto prevalece. O projeto externo também possui seleção 3D, áudio e recursos de catálogo que não precisamos adotar. A documentação externa contém referências a `pack.html` ausente na árvore consultada; os fontes atuais devem prevalecer sobre esses links antigos.

**Licença:** não foi identificado arquivo de licença explícito na árvore consultada. Nenhum código ou asset foi incorporado; manter como referência de estudo até esclarecer autorização para eventual reutilização.

### 3.2 simeydotme/pokemon-cards-css — holografia e profundidade

[Repositório](https://github.com/simeydotme/pokemon-cards-css) e [demo pública](https://poke-holo.simey.me/), revisão `acb1197633e749a1fba4412231db2f6581586d00`.

Arquivos prioritários:

- [src/lib/components/Card.svelte](https://github.com/simeydotme/pokemon-cards-css/blob/acb1197633e749a1fba4412231db2f6581586d00/src/lib/components/Card.svelte): coordenadas normalizadas, inclinação, brilho e suavização por springs.
- [public/css/cards/base.css](https://github.com/simeydotme/pokemon-cards-css/blob/acb1197633e749a1fba4412231db2f6581586d00/public/css/cards/base.css): base da composição de cartas; leitura direcionada na etapa de design.
- [public/css/cards/regular-holo.css](https://github.com/simeydotme/pokemon-cards-css/blob/acb1197633e749a1fba4412231db2f6581586d00/public/css/cards/regular-holo.css): referência de tratamento holográfico.

O componente inspecionado calcula a posição relativa do ponteiro, desloca brilho/fundo e coordena atualizações com `requestAnimationFrame`. Serve especialmente ao design e à reinspeção das cartas; não resolve o rasgo do pacote.

**Como aplicar o estudo:** compreender a relação entre posição do ponteiro, ângulo e iluminação; criar tratamento próprio em CSS/GSAP. Não adicionar Svelte nem buscar cartas por APIs externas. Os glifos e as imagens do aniversário continuam sendo locais.

**Licença identificada:** [GPL-3.0](https://github.com/simeydotme/pokemon-cards-css/blob/acb1197633e749a1fba4412231db2f6581586d00/LICENSE). O código não foi copiado para o projeto MIT. As artes oficiais presentes na demo não fazem parte da identidade a construir.

### 3.3 simeydotme/hover-tilt — microinteração mais isolada

[Repositório](https://github.com/simeydotme/hover-tilt) e [demo](https://hover-tilt.simey.me), revisão `5db58f38cbbfa20054ca2c21a144d866d304b34a`.

O arquivo [HoverTilt.svelte](https://github.com/simeydotme/hover-tilt/blob/5db58f38cbbfa20054ca2c21a144d866d304b34a/packages/hover-tilt/src/lib/components/HoverTilt.svelte) separa ativação, posição, propriedades de brilho e retorno suavizado. Usa Pointer Events e agrupa atualização de movimento em frames. Há também distribuição como Web Component, mas isso não obriga sua instalação em React.

**Como aplicar o estudo:** estudar inclinação e reflexo na carta ativa, com retorno suave ao repouso. Adaptar o conceito à composição existente, usando GSAP e CSS. Não depender de hover para informações ou ações no toque.

**Licença identificada:** [MIT](https://github.com/simeydotme/hover-tilt/blob/5db58f38cbbfa20054ca2c21a144d866d304b34a/LICENSE). Nenhum componente externo foi instalado.

### 3.4 hongyime/pokemonpacks — React/GSAP e gesto sobre cartas

[Repositório](https://github.com/hongyime/pokemonpacks) e [demo](https://hongyime.github.io/pokemonpacks/), revisão `0c0744277da0757ad7a1f1600eef4c9d901c40ca`.

Arquivos inspecionados:

- [src/components/PackOpening.tsx](https://github.com/hongyime/pokemonpacks/blob/0c0744277da0757ad7a1f1600eef4c9d901c40ca/src/components/PackOpening.tsx): timeline GSAP de tremor, aumento de escala, desaparecimento e transição.
- [src/components/CardViewer.tsx](https://github.com/hongyime/pokemonpacks/blob/0c0744277da0757ad7a1f1600eef4c9d901c40ca/src/components/CardViewer.tsx): carta ativa, bloqueio durante animação, arraste, retorno e avanço.

**Limite confirmado:** a abertura do pacote é uma animação automática ao montar o componente, não um rasgo controlado pelo gesto. O arraste aparece nas cartas e usa Hammer.js. Portanto, não apresentar esse exemplo como solução pronta para nosso requisito prioritário.

É útil para comparar estados de revelação e movimentação em React/GSAP, mas não para copiar a arquitetura. Nosso projeto pode usar Pointer Events sem Hammer.js, e não precisa de dashboard, favoritos, armazenamento e serviços de catálogo. O efeito de abertura inspecionado também não fornece cleanup da timeline; não repetir essa omissão em `StrictMode`. Duas estrelas na consulta: exemplo secundário, não uma base comprovada de produção.

**Licença identificada:** [Apache-2.0](https://github.com/hongyime/pokemonpacks/blob/0c0744277da0757ad7a1f1600eef4c9d901c40ca/LICENSE). Nenhum código ou imagem foi incorporado.

### 3.5 greensock/gsap-skills/examples — integração de referência oficial

[Exemplos oficiais](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760/examples), revisão igual à das skills instaladas.

[examples/react/App.jsx](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/examples/react/App.jsx) demonstra refs, escopo e `useGSAP`; há também um [exemplo vanilla](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760/examples/vanilla). São referências de integração, não exemplos de booster.

Usar os princípios de lifecycle e cleanup. Como `@gsap/react` não está no app, começar com a alternativa `gsap.context()` já descrita na skill. **Licença:** MIT para esse repositório de skills/exemplos; a licença do pacote GSAP é independente.

### 3.6 BetterTyped/react-cards-opening — preservar a base já adotada

[Fonte da versão 1.4.1](https://github.com/BetterTyped/react-cards-opening/tree/v1.4.1), já analisada na [arquitetura](ARCHITECTURE.md).

- [card-pack.tsx](https://github.com/BetterTyped/react-cards-opening/blob/v1.4.1/packages/ui/src/card-pack.tsx): comportamento existente e limite da abertura por clique.
- [card.tsx](https://github.com/BetterTyped/react-cards-opening/blob/v1.4.1/packages/ui/src/card.tsx): candidato a frame comum da revelação e coleção.
- [card-opening.tsx](https://github.com/BetterTyped/react-cards-opening/blob/v1.4.1/packages/ui/src/card-opening.tsx): voo/virada/inspeção e limite de avanço temporizado.
- [effects.ts](https://github.com/BetterTyped/react-cards-opening/blob/v1.4.1/packages/ui/src/effects.ts): presets e planos por raridade.

Essa continua sendo a primeira fonte de reaproveitamento, não uma dependência a abandonar por causa das novas referências. O manifesto atual já a inclui; nenhuma atualização foi feita. Licença MIT conforme o repositório upstream.

## 4. Ordem recomendada de estudo e aplicação

| Próxima entrega | Skills principais | Referência mais útil | Resultado esperado |
| --- | --- | --- | --- |
| 1A: progresso do rasgo | `gsap-core`, `gsap-timeline`, `gsap-utils`, `gsap-react` | OpenPack `pack.js` | Faixa segue o ponteiro e cancela/confirma conforme nossa especificação |
| 1B/2: material e saída | `gsap-timeline`, `gsap-performance` | OpenPack `pack.js` e `reveal.js` | Oclusão e continuidade entre embalagem aberta e baralho |
| 3: revelação | `gsap-react`, `gsap-timeline` | BetterTyped e comparação com `CardViewer` | Uma carta ativa, sem duplicação e com avanço explícito |
| 4: carta premium | `frontend-design`, `gsap-performance` | Holografia e Hover Tilt | Face original, reflexo controlado e conteúdo legível |
| 5: coleção | `frontend-design`, `vercel-react-best-practices` | `Card` e inspeção da biblioteca atual | Mesma carta na coleção e foco previsível |
| Cada entrega interativa | `gsap-performance` | Requisitos do projeto | Código com custo limitado; validação somente por build |

## 5. O que foi e o que não foi instalado

As oito skills foram preparadas com o instalador de skills, usando download por commit e Git sparse checkout para as duas pastas Anthropic, cujo repositório completo era maior do que o necessário. Foram conferidos 89 arquivos originais contra os hashes GitHub, preservadas as licenças disponíveis e acrescentados índice e manifesto locais.

Na etapa de pesquisa, nenhum repositório de demo foi clonado dentro do projeto, nenhum asset Pokémon foi copiado e a aplicação não foi modificada. Na implementação posterior, `src/` e o favicon foram atualizados; o manifesto e o lockfile permanecem preservados. Não foram instalados GSAP adicional, Hammer.js, Svelte, PixiJS, Three.js, `@gsap/react` ou Playwright. As demos são links de estudo; a instalação de skills não implementa as animações.

Para usar as skills, solicitar por nome no próximo turno, por exemplo: “Use gsap-timeline e gsap-react para a entrega 1A”. Se o cliente não atualizar o catálogo automaticamente, reabrir a sessão do projeto. O índice local registra as restrições que devem acompanhar esses exemplos.
