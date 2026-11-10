# Arquitetura

## 1. Estado da implementação

**Atualização 3D:** o booster é agora o GLB fornecido em `models/`, renderizado por Three.js/R3F/Drei. A tela é preta e sem HUD. A faixa é separada na geometria e deformada por shader; as cartas saem em 3D e passam ao baralho DOM existente. A análise detalhada e os limites estão em [MODEL_3D.md](MODEL_3D.md). Para esta atualização, executar testes estruturais/matemáticos e build; avaliação visual fica com o usuário, sem navegador ou capturas.

Em 09/11/2026 foi implementada a sequência de rasgo, saída do baralho, revelação individual e coleção. A prioridade desta versão é animação e interação; pacote e cartas usam aparência provisória simples. O protótipo anterior da revisão `9888b6b` usava `CardPack`, cinco exemplos e uma coleção textual; essa composição foi substituída sem reescrever a stack.

A validação definida pelo usuário é somente `npm run build`. Não executar lint, navegador, testes, screenshots, vídeos ou medições sem nova solicitação. Descrever recursos como implementados no código, sem alegar validação visual, funcional ou em dispositivos reais. O deploy na Vercel será feito pelo usuário.

## 2. Stack e reaproveitamento

React 19/React DOM, TypeScript, Vite, GSAP e `@react-cards-opening/core`/`ui` permanecem nas versões do lockfile. Na atualização 3D foram adicionados Three.js, React Three Fiber, Drei e tipos de Three.js, a pedido do usuário. A instalação foi feita com `npm ci`.

| Recurso | Uso |
| --- | --- |
| `Card` | Frame de cada carta, com conteúdo personalizado e a mesma apresentação na coleção |
| `themeOf` | Tema-base da carta |
| `PixelGlyph` | Suporte opcional a `art` nos presentes |
| `EffectLayer` | Partículas e iluminação disparadas no meio da virada |
| `DEFAULT_RARITIES` | Raridades com rótulos traduzidos |
| `usePrefersReducedMotion` | Preferência de movimento reduzido compartilhada entre cena, coleção e inspeção |
| GSAP | Progresso de rasgo, retorno, remoção, saída, virada, descarte, inclinação e entrada da coleção |

`CardPack` não é mais montado. O [código da versão 1.4.1](https://github.com/BetterTyped/react-cards-opening/blob/v1.4.1/packages/ui/src/card-pack.tsx) usa clique, explosão e cartas sobre uma mesa, sem API pública de progresso de rasgo ou pilha sequencial. A [revelação pronta](https://github.com/BetterTyped/react-cards-opening/blob/v1.4.1/packages/ui/src/card-opening.tsx) avança após tempo de leitura. Por isso, a cena e a fila são próprias, reutilizando os componentes e efeitos que atendem ao requisito. Não se acessa DOM privado da biblioteca e não há modificações em `node_modules`.

## 3. Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `src/main.tsx` | Entrada em `StrictMode`; CSS da biblioteca antes dos estilos locais |
| `src/App.tsx` | Estado de conclusão, chave da sessão, apresentação e reinício |
| `src/components/PackExperience.tsx` | Gesto, fases, índice ativo, IDs revelados e timelines |
| `src/components/BoosterScene.tsx` | GLB, cache, materiais e renderização 3D |
| `src/components/PackOpeningLight.tsx` | Brilho forte na costura do rasgo e luz residual atrás do baralho após a abertura, com movimento reduzido |
| `src/three/boosterGeometry.ts` | Normalização e recorte de triângulos |
| `src/three/boosterMotion.ts` | Poses numéricas compartilhadas com testes |
| `src/three/cardGeometry.ts` | Corpo extrudado e superfície arredondada das cartas 3D, com UVs normalizadas |
| `src/data/cardLayout.ts` | Proporção, espessura e raio de cantos compartilhados entre cartas 3D e DOM |
| `src/data/cardPalette.ts` | Paleta rosa do rótulo aplicada ao tema, versos DOM/3D e inspeção das cartas |
| `src/data/cardBack.ts` | Caminho compartilhado da imagem `vitoria.png` usada no verso DOM/3D |
| `src/components/GiftCard.tsx` | Frame da biblioteca, conteúdo personalizado, flip externo, verso, ícones e fallback |
| `src/components/GiftCollection.tsx` | Coleção e inspeção em `<dialog>` nativo |
| `src/data/gifts.ts` | `GiftDefinition`, presentes, rótulos e raridades |
| `src/data/pack.ts` | Mensagens, emblema, cor e limiar do gesto |
| `src/App.css` | Camadas da cena, embalagem, cartas e layout provisório |
| `src/index.css` | Base, fonte de sistema, cores e regras globais |
| `index.html` | Idioma `pt-BR`, viewport e metadados |
| `public/favicon.svg` | Símbolo simples próprio |

Os antigos assets de template em `src/assets/` e `public/icons.svg` permanecem sem uso. Não foram copiados assets dos repositórios externos. Não há rotas, estado global, backend, storage ou serviços externos.

## 4. Estado e fluxo

`App` mantém `finished` e `session`. Reiniciar restaura `finished=false` e incrementa a chave: a cena anterior é desmontada, seus recursos são limpos e a nova começa fechada.

O botão permanente com ícone de reinício no canto superior direito usa essa mesma ação. Ele substitui a área invisível de reinício no fundo da coleção e o controle global antes oculto.

`PackExperience` é o único dono da revelação. Mantém fase, índice e IDs abertos. Refs espelham os valores necessários a handlers/callbacks, permitindo bloquear comandos imediatamente sem esperar outro render. Progresso contínuo do gesto não passa por `setState`.

| Fase | Transição |
| --- | --- |
| `sealed` | Pressionar faixa inicia `tearing`; alternativa por botão inicia `opening` |
| `tearing` | Arraste controla a timeline; soltura insuficiente leva a `returning`, válida leva a `opening` |
| `returning` | Timeline volta a zero e retorna a `sealed` |
| `opening` | Completa separação e remove a faixa |
| `dealing` | Cartas sobem de trás da embalagem, que sai da cena; baralho acomoda |
| `ready` | Primeira/ próxima carta espera ação explícita para virar |
| `flipping` | Antecipação, giro e efeitos; ID é registrado uma vez no meio da virada |
| `reading` | Presente permanece disponível até confirmação explícita |
| `discarding` | Carta sai e próxima avança; depois da última, chama conclusão no App |

O progresso de revelação deriva dos IDs abertos. Não há sorteio; o array define sequência e presentes garantidos. A coleção só é montada após confirmar a última carta. O caso vazio é tratado em `App` com mensagem estática.

## 5. Gesto e camadas

A faixa usa Pointer Events, ponteiro primário e captura por `setPointerCapture`. O deslocamento horizontal é dividido por 85% da largura da região de interação e limitado a 0–1. Uma zona morta de 6 CSS px evita progresso por pequenos movimentos. Soltar com progresso de pelo menos `packConfig.tearThreshold` (0,75 por padrão) confirma; antes disso, a faixa retorna.

`pointercancel`, perda de captura, resize e perda de foco da janela cancelam o gesto ativo. A captura é liberada depois de limpar a referência, para impedir que `lostpointercapture` reverta uma abertura já confirmada. Um segundo ponteiro é ignorado. Clique sem arraste não abre a faixa; ativação por teclado e o botão alternativo usam a mesma sequência de abertura.

O corpo e a faixa são partes derivadas do GLB original, por corte e interpolação de atributos. O gesto controla a deformação por shader. GSAP anima os valores numéricos de tensão, rasgo, remoção da faixa, saída das cartas e acomodação. R3F aplica as poses com invalidação sob demanda; não há setState por frame.

As cartas emergem no mesmo espaço 3D do pacote. Câmera e poses finais são calculadas para coincidir com o frame DOM usado na revelação. Quando a saída termina, a cena WebGL é desmontada e a revelação existente assume. Não há dois controladores concorrentes da abertura.

## 6. Ciclo de vida e efeitos

As animações são criadas em `gsap.context()` com escopo da cena. Handlers acrescentam suas timelines ao mesmo contexto. Desmontagem marca a sessão como inativa, libera ponteiro, limpa efeitos, cancela retorno e chama `context.revert()`. Callbacks verificam se a instância ainda está ativa. Listeners de resize/blur são removidos no cleanup.

A revelação usa duas metades de giro: costas até 90 graus, registro do ID e efeitos, depois face até zero. A inscrição de IDs usa atualização funcional e ignora duplicatas. Avanço só é permitido em `reading`; revelação só em `ready`.

A escolha de `revealEffect` resolve efeitos públicos da biblioteca: celebração com confete/estrela, brilho com glitter/halo e padrão discreto. A cor principal é passada ao efeito. A camada é limpa no avanço e no reinício.

Movimento reduzido encurta as transições, não executa partículas e desativa loops CSS. Se a preferência mudar durante uma transição, a timeline ativa chega ao fim. A inclinação por mouse utiliza `quickTo` em wrapper separado e só é acionada durante leitura; toque não depende de hover.

## 7. Dados e personalização

`GiftDefinition` estende `GlyphCard`, preservando `id`, `name`, `line`, `rarity` e `art`. Campos locais opcionais:

- `icon`: `bag`, `pudding` ou `gift`, desenhados localmente em SVG.
- `visual`: `src`, `alt` e `fit` para a imagem principal. `kind: "logo"` usa uma placa branca; `kind: "card"` exibe uma arte de carta completa, sem cortes nem textos/selos sobrepostos. O modo completo usa `contain`, mantém a proporção compartilhada DOM/3D e inclui a raridade no texto alternativo; em falha, restaura a face com nome, raridade, valor e glifo/ícone. Sem `kind`, a imagem aparece sobre o fundo rosa.
- `brand`: `src` e `alt` opcionais para uma segunda imagem, exibida como selo no canto da arte principal, sem deformar a logo. Se falhar, somente o selo é removido.
- `appearance`: cor principal, cores secundárias e `classic`/`foil`.
- `revealEffect`: `default`, `celebration` ou `glow`.
- `info`: valor em centavos, moeda BRL e mensagem complementar.

Imagem tem prioridade. Em falha, a face apresenta o glifo `art` ou o ícone local. O valor é opcional e formatado em português brasileiro; não há preço zero para presentes sem valor. A cor principal controla frame e efeitos; a primeira cor secundária participa do brilho foil. As demais cores ficam disponíveis nos dados para evolução do design.

As quatro cartas atuais são SHEIN (R$ 100,00, rara), Caixa de Pudim da Rebeca (épica, sem preço), Café da Tarde e Chocolate com Laranja (ambas lendárias, sem preço). Usam, respectivamente, `public/cards/shein_card.png`, `caixadepudim_card.png`, `cafedatarde_card.png` e `chocolatelaranja_card.png`, todas na mesma pasta. Os caminhos respeitam o `BASE_URL` do Vite. As lendárias usam o frame animado da biblioteca, tom dourado e efeito de celebração. Os nomes de raridade e todos os controles estão em português. Configurar presentes não exige editar as timelines.

## 8. Coleção e inspeção

A coleção utiliza o mesmo `GiftCard`. Sua entrada possui deslocamento e stagger simples. A inspeção usa `showModal()` do `<dialog>`, com botão de fechamento e Escape nativo. O nome completo aparece também fora do frame. Por solicitação posterior do usuário, descrições e mensagens complementares não são mais renderizadas; os campos permanecem nos dados por compatibilidade. O verso DOM/3D usa `public/vitoria.png`, centralizado sem cortes, com fundo e moldura rosas; o símbolo e o texto antigos foram removidos.

Na coleção e na inspeção, as cartas ficam planas e o verso local é ocultado; as transformações da entrada são limpas ao terminar. O verso interno do frame da biblioteca também fica oculto por uma classe fornecida pela API pública `classNames`, pois a virada da experiência é controlada pelo wrapper local. Isso evita manter superfícies redundantes sobrepostas nas cartas em repouso. Os quatro presentes atuais usam `appearance.style: "foil"` para exibir o brilho local.

O ciclo de abertura do diálogo é separado da animação de entrada, para mudanças de movimento reduzido não fecharem/reabrirem a inspeção. O handler de `close` só limpa a seleção se o diálogo realmente estiver fechado: eventos atrasados do cleanup do `StrictMode` não removem um diálogo já reaberto.

O diálogo nativo fornece comportamento de modalidade/foco, mas não houve teste de acessibilidade ou compatibilidade. Esses recursos são descritos como implementação, não como certificação.

## 9. Limites e próximo trabalho

O GLB não tem texturas, rig ou animações de rasgo. Materiais e detalhes de origem foram preservados; o corte e a deformação são procedurais, sem simulação física de folha. O renderizador requer WebGL e a avaliação de aparência/fluidez deve ser feita pelo usuário.

Os testes estruturais/matemáticos e o build não substituem essa avaliação. Não foram realizados navegador, capturas ou inspeção visual, conforme pedido. O deploy permanece a cargo do usuário.
