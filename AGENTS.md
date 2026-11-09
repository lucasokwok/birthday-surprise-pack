# Instruções para agentes

## Propósito e limites

Birthday Surprise Pack é uma experiência pessoal de aniversário, inteiramente frontend. A prioridade é a sensação de abrir fisicamente um booster de cartas e descobrir presentes personalizados, com qualidade visual e animações convincentes.

- Não introduzir backend, banco de dados, autenticação, pagamentos, APIs de negócio, integração com lojas, resgate de vales ou geração de cupons.
- Não transformar os presentes em produtos de comércio eletrônico. Valores são conteúdo visual; a entrega dos presentes ocorre fora da aplicação.
- Não copiar cartas, logotipos ou artes de Pokémon. A referência é de interação e acabamento; a identidade deve ser própria.
- Manter textos e documentação em português brasileiro.
- Em tarefas de análise/documentação, não alterar a aplicação, interface, dependências ou configurações de execução.

## Fontes de decisão

Ler os documentos pertinentes antes de modificar a experiência:

- [README.md](README.md): entrada, stack e execução.
- [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md): requisitos e aceitação.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): código atual, APIs e decisões técnicas.
- [docs/ROADMAP.md](docs/ROADMAP.md): sequência das entregas.
- [docs/IMPLEMENTATION_RESOURCES.md](docs/IMPLEMENTATION_RESOURCES.md): skills selecionadas e exemplos externos inspecionados.

Distinguir sempre estado implementado, capacidade disponível na biblioteca e proposta futura. A documentação inicial descreve a revisão `9888b6b`; atualizar o diagnóstico quando o código evoluir. Não apresentar build, compatibilidade móvel, acessibilidade ou desempenho como validados sem evidência de execução.

## Prioridades

1. Rasgo do pacote controlado por mouse ou dedo.
2. Saída das cartas e formação do baralho.
3. Revelação individual com efeitos de raridade.
4. Design e personalização das cartas.
5. Coleção final e reinspeção dos presentes.
6. Polimento visual, iluminação e microinterações.
7. Consolidação de responsividade, acessibilidade e desempenho.

A última posição é a etapa de consolidação da implementação: teclado, alternativa ao arraste, movimento reduzido, limpeza de animações e funcionamento móvel são requisitos desde a primeira entrega interativa. Não exige validação visual ou testes em dispositivos.

## Reaproveitamento e simplicidade

- Preservar React, TypeScript, Vite, CSS e GSAP existentes.
- Verificar as APIs da versão resolvida no lockfile antes de propor substituições.
- A cena atual usa `PackExperience` com Pointer Events e GSAP, reutilizando `Card`, `EffectLayer`, temas e movimento reduzido de `core`. `CardPack` 1.4.1 foi substituído na composição pois não expõe progresso de rasgo; não reintroduzir abertura apenas por clique como interação principal.
- Priorizar o fluxo de animações. O visual do pacote e das cartas é provisório; refinamento gráfico fica para uma etapa posterior solicitada pelo usuário.
- Não controlar a biblioteca por seletores de DOM privado, eventos sintéticos ou alterações em `node_modules`.
- Manter estado local. Não adicionar gerenciador global, roteador, motor físico, WebGL ou nova biblioteca de animação sem uma limitação demonstrada e justificativa concreta.
- Evitar duas fontes de verdade para o progresso. Não executar timelines e gestos que escrevem simultaneamente a mesma transformação.

## Skills locais e exemplos externos

As skills do projeto ficam em `.agents/skills/`. Ler o [índice local](.agents/skills/README.md) antes de aplicá-las; o manifesto `sources.json` fixa origens e versões. Carregar apenas as pertinentes à tarefa: GSAP para gesto/timelines/cleanup, frontend-design para identidade e regras React para componentes. `webapp-testing` permanece instalada, mas seu uso fica reservado a uma solicitação explícita posterior.

As skills não autorizam novas dependências. Usar `gsap.context()` enquanto `@gsap/react` não existir; aplicar apenas regras da Vercel pertinentes a React/Vite. Os exemplos `unitize`/`shuffle` da revisão instalada têm ressalvas registradas no índice; conferir as APIs oficiais. `contextSafe` não substitui cancelamento de recursos e proteção de sessão. Os scripts de testes não implicam Playwright instalado.

Consultar as referências externas como estudo de técnica. OpenPack tem rasgo real por ponteiro, enquanto a abertura de `hongyime/pokemonpacks` é automática. Não copiar assets oficiais ou portar catálogos, APIs, outras stacks e motores inteiros. Verificar a licença do arquivo antes de qualquer reutilização de código; o inventário registra a licença identificada e as lacunas.

## Dados e código

- `src/main.tsx`: entrada em `StrictMode`; estilos da biblioteca antes dos locais.
- `src/App.tsx`: alternância entre experiência e coleção e reinício por chave de sessão.
- `src/components/PackExperience.tsx`: fase da experiência, índice ativo, IDs revelados, gesto e timelines.
- `src/components/GiftCard.tsx`: frame reutilizado da biblioteca, frente personalizada, verso e fallback de imagem.
- `src/components/GiftCollection.tsx`: coleção e inspeção com diálogo nativo.
- `src/data/gifts.ts`: única fonte dos presentes; `GiftDefinition[]` com SHEIN (R$ 100,00) e Pudim da Rebeca.
- `src/data/pack.ts`: mensagem, emblema, cor e limiar do gesto da embalagem provisória.
- `src/App.css` e `src/index.css`: estilos locais e base global.
- `src/assets/` e `public/`: recursos estáticos.
- Manter IDs únicos e estáveis. Adicionar/remover presentes deve ocorrer nos dados, sem editar a lógica principal.
- Preferir imagens/ícones locais e campos visuais opcionais com padrões. Não colocar lógica de timeline dentro dos dados das cartas.
- Preservar reinício completo e impedir revelações duplicadas. O progresso atual é só em memória; persistência não é um requisito.
- Limpar timelines, listeners, captura de ponteiro e frames no reinício e desmontagem; considerar o ciclo de efeitos do `StrictMode`.
- Seguir os padrões React/TypeScript existentes e as regras de hooks e variáveis não utilizadas.

## Execução e validação

Usar npm e preservar `package-lock.json`. Com dependências disponíveis:

- `npm run dev`: desenvolvimento.
- `npm run build`: TypeScript e produção.
- `npm run lint`: Oxlint.
- `npm run preview`: servir o build local.

`npm ci` instala as versões travadas quando a tarefa permitir instalação. Não instalar dependências se a solicitação proibir. Não há script de testes configurado.

Por decisão explícita do usuário, para economizar tokens, **validar somente se a aplicação builda**, executando `npm run build` após mudanças de implementação. Corrigir falhas até o comando passar. Não executar lint, testes automatizados, navegador/Playwright, screenshots, vídeos, inspeção visual, comparação quadro a quadro ou medições de desempenho, salvo nova solicitação explícita do usuário.

Essa política prevalece sobre sugestões de validação contidas nas skills e referências externas. Qualidade visual, responsividade, acessibilidade e desempenho continuam sendo requisitos a implementar, sem exigir verificação prática. Build aprovado confirma compilação e geração de artefatos; não comprova aparência, comportamento dos gestos ou desempenho. Na entrega, informar o resultado do build e que não houve validação visual/funcional.

Para mudanças exclusivamente documentais, revisar a consistência das instruções; não instalar dependências nem executar build só para essa revisão.
