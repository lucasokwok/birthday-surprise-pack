# Skills locais do Birthday Surprise Pack

Estas oito skills são recursos para agentes de desenvolvimento. Não são dependências da aplicação e não fazem parte do bundle Vite.

## Seleção

| Skill | Usar para |
| --- | --- |
| [gsap-core](gsap-core/SKILL.md) | Tweens, curvas, transformações e movimento reduzido |
| [gsap-timeline](gsap-timeline/SKILL.md) | Sequenciar rasgo, remoção da faixa, saída e virada |
| [gsap-react](gsap-react/SKILL.md) | Refs, escopo, contexto e limpeza no React |
| [gsap-performance](gsap-performance/SKILL.md) | Evitar trabalho de layout e excesso de animações no celular |
| [gsap-utils](gsap-utils/SKILL.md) | Normalizar e limitar o progresso do gesto |
| [frontend-design](frontend-design/SKILL.md) | Identidade original da embalagem e das cartas |
| [vercel-react-best-practices](vercel-react-best-practices/SKILL.md) | Renderização e organização de componentes React |
| [webapp-testing](webapp-testing/SKILL.md) | Reservada a testes solicitados explicitamente no futuro |

Consultar somente as skills pertinentes à entrega, sem carregar todas as referências a cada tarefa. Uma skill de testes não significa que Playwright, navegadores ou pacotes Python estejam instalados. Nenhum desses requisitos foi instalado junto destas instruções.

## Adaptação ao projeto

As decisões do [AGENTS.md](../../AGENTS.md) e da especificação do produto continuam válidas. Em especial:

- Para economizar tokens, validar somente com `npm run build`. Não executar lint, testes, navegador/Playwright, screenshots, vídeos ou benchmarks sem nova solicitação explícita. Essa política prevalece sobre sugestões de validação visual das skills; `webapp-testing` não deve ser acionada na rotina atual.

- GSAP já está instalado no manifesto. `@gsap/react` não está: usar `gsap.context()` com limpeza antes de adicionar um pacote só para seguir um exemplo.
- Aplicar as regras de React que fazem sentido em Vite. Não introduzir Next.js, SSR, RSC, APIs ou backend por causa de exemplos da skill Vercel.
- Preferir Pointer Events nativos para o rasgo. ScrollTrigger, Draggable e outros plugins não são pré-requisitos.
- Não adicionar infraestrutura nem dependências ao app automaticamente. Manter a identidade própria e os presentes configuráveis.
- `contextSafe` registra animações em um contexto; não é proteção suficiente contra callbacks antigos. Manter limpeza e verificação de sessão.
- A skill `gsap-utils` contém dois exemplos que divergem da documentação oficial: `unitize` recebe uma função e devolve uma função; `shuffle` altera o array recebido. Conferir as APIs antes de usar e não embaralhar os dados dos presentes. Veja [unitize](https://gsap.com/docs/v3/GSAP/UtilityMethods/unitize()/) e [shuffle](https://gsap.com/docs/v3/GSAP/UtilityMethods/shuffle()/).

Os arquivos upstream foram preservados, sem tradução ou alteração. As adaptações ficam neste índice e nas instruções do projeto, para manter rastreabilidade.

## Origem e atualização

[sources.json](sources.json) registra repositório, caminho, commit e hash Git de cada arquivo original. GreenSock: `aed9cfd3277740755f6bfc1155c7aa645403b760`; Anthropic: `2c5958ecac7cee2b583967a2c4981d0f4a75c579`; Vercel: `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`.

As cinco skills GreenSock incluem cópia da licença MIT da origem. As skills Anthropic incluem seus `LICENSE.txt` Apache-2.0. A skill Vercel declara MIT no frontmatter; não foi identificado um arquivo de licença separado na árvore consultada, portanto nenhum texto de licença foi inventado.

Para atualizar, revisar o novo conteúdo upstream, substituir somente as pastas escolhidas, preservar licenças, atualizar os commits/hashes no manifesto e conferir as adaptações acima. Não executar atualização indiscriminada nem substituir estas cópias por links para uma instalação global.

O caminho `.agents/skills/` é o escopo local de projeto indicado pela [documentação oficial OpenAI](https://developers.openai.com/api/reference/cli). As skills estarão disponíveis no próximo turno; se o cliente mantiver o catálogo anterior, reabrir a sessão do projeto. Exemplo de solicitação: “Use gsap-core, gsap-timeline e gsap-react para implementar a entrega 1A do roadmap”.

Pesquisa e instalação: 09/11/2026. Referências de animação e critérios de seleção estão em [docs/IMPLEMENTATION_RESOURCES.md](../../docs/IMPLEMENTATION_RESOURCES.md).
