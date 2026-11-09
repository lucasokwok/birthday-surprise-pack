# Arquitetura

## 1. Estado da implementação

Em 09/11/2026 foi implementada a sequência de rasgo, saída do baralho, revelação individual e coleção. A prioridade desta versão é animação e interação; pacote e cartas usam aparência provisória simples. O protótipo anterior da revisão `9888b6b` usava `CardPack`, cinco exemplos e uma coleção textual; essa composição foi substituída sem reescrever a stack.

A validação definida pelo usuário é somente `npm run build`. Não executar lint, navegador, testes, screenshots, vídeos ou medições sem nova solicitação. Descrever recursos como implementados no código, sem alegar validação visual, funcional ou em dispositivos reais. O deploy na Vercel será feito pelo usuário.

## 2. Stack e reaproveitamento

React 19/React DOM, TypeScript, Vite, GSAP e `@react-cards-opening/core`/`ui` permanecem nas versões do lockfile. Nenhuma dependência nova foi adicionada. A instalação foi feita com `npm ci`.

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
| `src/components/PackExperience.tsx` | Gesto, fases, índice ativo, IDs revelados, baralho e timelines |
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

O corpo e a faixa são camadas independentes, com borda irregular via CSS e linha SVG. A timeline pausada controla separação, contramovimento do pacote, brilho e indicador de progresso. A retirada do pacote e a acomodação das cartas são sequenciadas depois da confirmação. A cena usa DOM/CSS, sem motor físico, canvas próprio ou WebGL.

A caixa do baralho, a inclinação, o voo de cada carta e a rotação frente/verso têm wrappers distintos. GSAP não escreve nas transformações internas do `Card`; controla somente elementos próprios. Isso evita disputa com os estilos da biblioteca.

## 6. Ciclo de vida e efeitos

As animações são criadas em `gsap.context()` com escopo da cena. Handlers acrescentam suas timelines ao mesmo contexto. Desmontagem marca a sessão como inativa, libera ponteiro, limpa efeitos, cancela retorno e chama `context.revert()`. Callbacks verificam se a instância ainda está ativa. Listeners de resize/blur são removidos no cleanup.

A revelação usa duas metades de giro: costas até 90 graus, registro do ID e efeitos, depois face até zero. A inscrição de IDs usa atualização funcional e ignora duplicatas. Avanço só é permitido em `reading`; revelação só em `ready`.

A escolha de `revealEffect` resolve efeitos públicos da biblioteca: celebração com confete/estrela, brilho com glitter/halo e padrão discreto. A cor principal é passada ao efeito. A camada é limpa no avanço e no reinício.

Movimento reduzido encurta as transições, não executa partículas e desativa loops CSS. Se a preferência mudar durante uma transição, a timeline ativa chega ao fim. A inclinação por mouse utiliza `quickTo` em wrapper separado e só é acionada durante leitura; toque não depende de hover.

## 7. Dados e personalização

`GiftDefinition` estende `GlyphCard`, preservando `id`, `name`, `line`, `rarity` e `art`. Campos locais opcionais:

- `icon`: `bag`, `pudding` ou `gift`, desenhados localmente em SVG.
- `visual`: `src`, `alt` e `fit` para imagem ou ícone SVG próprios. Não precisa de um discriminante adicional: ambos usam `<img>`.
- `appearance`: cor principal, cores secundárias e `classic`/`foil`.
- `revealEffect`: `default`, `celebration` ou `glow`.
- `info`: valor em centavos, moeda BRL e mensagem complementar.

Imagem tem prioridade. Em falha, a face apresenta o glifo `art` ou o ícone local. O valor é opcional e formatado em português brasileiro; não há preço zero para presentes sem valor. A cor principal controla frame e efeitos; a primeira cor secundária participa do brilho foil. As demais cores ficam disponíveis nos dados para evolução do design.

As cartas atuais são SHEIN (R$ 100,00, épica) e Pudim da Rebeca (rara, sem preço). Os nomes de raridade e todos os controles estão em português. Configurar presentes não exige editar as timelines.

## 8. Coleção e inspeção

A coleção utiliza o mesmo `GiftCard`. Sua entrada possui deslocamento e stagger simples. A inspeção usa `showModal()` do `<dialog>`, com botão de fechamento e Escape nativo. Nome e descrição completos aparecem também fora do frame, acomodando conteúdos maiores. A mensagem complementar é opcional.

O diálogo nativo fornece comportamento de modalidade/foco, mas não houve teste de acessibilidade ou compatibilidade. Esses recursos são descritos como implementação, não como certificação.

## 9. Limites e próximo trabalho

O material e a direção gráfica são provisórios. A simulação é uma faixa superior controlada por progresso horizontal, não um rasgo arbitrário por trajetória ou deformação por malha. Existe sequência de saída e virada, mas nenhuma medição de fluidez em hardware real foi feita.

O código prevê teclado, toque, cancelamentos e movimento reduzido. Apenas build é exigido e executado como validação; comportamento prático e acabamento visual não foram inspecionados. Não introduzir outra stack para refinar arte e estilos. O próximo passo é feedback do usuário sobre as animações e, depois, direção visual do pacote e das cartas. O deploy permanece a cargo do usuário.
