# Especificação funcional e visual

## 1. Visão e estado deste documento

O Birthday Surprise Pack deve ser uma pequena experiência interativa premium de aniversário: a pessoa rasga uma embalagem digital, retira cartas e descobre presentes simbólicos personalizados. A sensação física da abertura e o cuidado com cada revelação são os principais critérios de sucesso.

Esta especificação registra o produto desejado e a primeira implementação de 09/11/2026. O fluxo de animações foi implementado com aparência provisória; o refinamento gráfico fica para depois. O diagnóstico atual está na [arquitetura](ARCHITECTURE.md) e o status das entregas no [roadmap](ROADMAP.md). Implementação no código não equivale a validação prática.

**Política de validação definida pelo usuário:** para economizar tokens, validar somente a compilação com `npm run build` nas entregas de implementação. Não realizar validações visuais/funcionais, navegador, screenshots, vídeos, lint, testes automatizados ou benchmarks, salvo nova solicitação explícita. Os critérios abaixo descrevem o comportamento a implementar; não são uma obrigação de executar uma matriz de testes. Aprovação do build não comprova aparência, acessibilidade, gestos ou fluidez.

**Atualização 3D:** usar o modelo `models/booster_pack_tcg_pack.glb` em tela inteira preta, sem HUD visível. O GLB tem duas malhas, dois materiais e nenhuma textura/animação incorporada; o corte procedural e as cartas emergentes estão descritos em [MODEL_3D.md](MODEL_3D.md). O usuário solicitou testes e build nesta integração, mantendo a avaliação visual a seu cargo. Não executar navegador ou capturas. Esta atualização substitui referências antigas à embalagem em CSS, instruções visíveis ou obrigação de usar apenas build.

### Situação atual resumida

| Aspecto | Implementado no código | Próxima evolução |
| --- | --- | --- |
| Pacote | GLB original com corte, deformação por gesto e faixa destacável | Avaliação visual pelo usuário |
| Saída | Cartas Three.js emergem do pacote e passam ao baralho DOM | Refinamento guiado pelo feedback do usuário |
| Revelação | Virada individual em perspectiva, efeitos e avanço manual | Ajuste de ritmo se solicitado |
| Conteúdo | SHEIN e Pudim, ícones SVG e suporte a imagens locais | Fotos/ilustrações definitivas opcionais |
| Coleção | Mesmas cartas, inspeção em diálogo e reinício | Refinamento gráfico |
| Acessibilidade | Alternativa sem arraste, teclado, foco e movimento reduzido no código | Nenhuma validação prática exigida |


## 2. Escopo e objetivos

### Dentro do escopo

- Uma única experiência frontend, com pacote, baralho, revelação e coleção.
- Identidade gráfica original de aniversário e aparência de material físico.
- Animações suaves, sincronizadas e responsivas ao gesto.
- Cartas definidas em arquivos locais, com imagens/ícones opcionais e raridade visual.
- Mouse, toque e alternativas acessíveis que entreguem os mesmos presentes.
- Reinício da sessão sem recarregar a página e sem persistência obrigatória.

### Fora do escopo

Backend, banco de dados, contas, autenticação, pagamentos, carrinho de compras funcional, cupons válidos, resgate, códigos de validação, painel administrativo, chamadas a lojas ou outros serviços externos. Não haverá sorteio comercial: todas as cartas configuradas devem ser entregues uma vez por sessão. O valor SHEIN é uma informação sobre o presente, sem vínculo com a plataforma.

Áudio, vibração, compartilhamento e instalação como PWA não são requisitos desta versão. Não devem consumir prioridade antes de concluir a experiência principal.

## 3. Direção visual

A inspiração é o acabamento de boosters digitais de TCG, em especial Pokémon TCG Pocket. A aplicação deve ter embalagem, moldura, símbolos e ilustrações próprios; não reproduzir elementos oficiais protegidos.

| Elemento | Direção proposta | Evidência de acabamento esperada |
| --- | --- | --- |
| Cena | Foco central, fundo que sustenta a iluminação e pouca distração | Pacote é o primeiro elemento percebido; controles permanecem claros |
| Embalagem | Material metalizado, selos superior/inferior, textura, espessura sugerida | Reflexos e sombra coerentes antes, durante e depois do rasgo |
| Faixa rasgada | Parte superior visualmente independente, borda irregular | Faixa acompanha a mão e se desprende; não some inteira de uma vez |
| Baralho | Camadas, pequeno deslocamento entre cartas e perspectiva | Origem na abertura da embalagem e ordem de profundidade consistente |
| Cartas | Moldura própria, imagem/ilustração em destaque, hierarquia legível | Nome e conteúdo do presente legíveis; borda e brilho não encobrem texto |
| Raridade | Cor, tratamento da moldura e intensidade de revelação | Não depender só de cor para comunicar o nível |
| Efeitos | Luz, holografia e partículas seletivas | Contribuem para o momento da virada sem dificultar leitura ou controle |
| Tipografia | Família e escala consistentes com a identidade | Nome longo do Pudim cabe ou pode ser lido integralmente na inspeção |

Sensação de peso, elasticidade e inércia será obtida inicialmente com curvas de animação e relações entre camadas. Não é necessário simular fisicamente uma folha deformável. Paleta final, arte da embalagem, tipografia e imagens ainda precisam ser escolhidas; não existem assets finais aprovados no repositório.

## 4. Fluxo completo e interações

### 4.1 Apresentação

Exibir apenas o booster 3D centralizado sobre fundo preto, sem instruções, contadores, título, rodapé ou HUD. Manter instruções em português para leitores de tela. A inclinação deve ser sutil e interrompida quando o gesto assume o controle.

A tela deve oferecer também uma ação acessível de abertura sem arraste, oculta até foco por teclado. Ela é uma alternativa de acesso, enquanto o arraste é a interação principal. O pacote não deve abrir acidentalmente por um toque ou clique sem deslocamento na área de rasgo.

### 4.2 Rasgo controlado por gesto

Proposta inicial: gesto horizontal da esquerda para a direita pela faixa superior. A área de captura deve ser maior que o detalhe desenhado, para acomodar dedos. A direção e os parâmetros podem ser refinados a partir do feedback do usuário, mantendo previsibilidade.

1. Pressionar a faixa prepara o gesto, armazena o ponteiro ativo e destaca a área.
2. Movimentar o ponteiro atualiza continuamente a extensão do rasgo, a posição da faixa, a leve deformação visual e a reação do corpo do pacote.
3. Parar o ponteiro mantém o rasgo na posição atingida. Não deixar a animação completar sozinha enquanto a pessoa ainda controla o gesto.
4. Soltar antes do limiar devolve suavemente a faixa e a embalagem ao estado fechado; nenhum presente é revelado.
5. Soltar após o limiar confirma a abertura uma única vez. A faixa termina de separar, ganha pequeno movimento de inércia e sai do foco; a abertura da embalagem fica visível.

Como ponto de partida verificável, usar um limiar configurável de 75% do percurso útil e uma pequena zona morta para diferenciar toque de arraste. São parâmetros de protótipo, não valores implementados ou resultados de testes. O progresso deve ser normalizado pelo tamanho da faixa, sem depender de uma distância fixa em pixels. Retroceder durante o gesto pode reduzir o progresso visual; a confirmação só ocorre na soltura válida.

Cancelamento do sistema, perda de captura, mudança de orientação ou redimensionamento durante o gesto devem cancelar com segurança e permitir tentar novamente. Ignorar ponteiros adicionais; um segundo dedo não deve acelerar, confirmar ou duplicar a abertura. O clique de compatibilidade após um arraste não deve disparar outra ação.

O gesto não deve selecionar texto, arrastar a imagem nativamente ou deslocar horizontalmente a página. Preservar rolagem e zoom fora da região interativa; não bloquear gestos no documento inteiro.

### 4.3 Saída das cartas

Depois de concluída a separação, as cartas devem surgir de dentro da embalagem aberta, com o verso voltado para a pessoa. A boca do pacote deve ocultar a parte ainda interna. Uma breve antecipação precede o deslocamento; as cartas deslizam, se sobrepõem e formam um baralho com profundidade.

Manter continuidade entre o pacote rasgado e a saída: a embalagem não deve desaparecer antes de fornecer uma origem visual às cartas. Pequenos atrasos entre camadas podem sugerir atrito; a acomodação deve ter desaceleração convincente e pouco excesso de movimento. Bloquear revelações até o baralho estar pronto. No movimento reduzido, substituir o voo por apresentação direta ou transição curta, sem eliminar a etapa lógica.

### 4.4 Revelação individual

A pessoa deve identificar claramente a próxima carta. Proposta inicial: ordem definida pelo array de configuração, com uma carta ativa e as demais ainda ocultas. Não há necessidade de sorteio nem de probabilidades.

Cada revelação deve conter antecipação curta, destaque da carta, virada, efeito apropriado e repouso para leitura. A continuação deve depender de uma ação explícita; se forem reutilizadas primitivas com avanço temporizado, adaptar esse comportamento antes de aceitar a entrega. Não encadear presentes tão rapidamente que a pessoa perca sua descrição.

Ignorar repetição de comandos durante a transição. Registrar cada ID revelado uma vez e só após o momento efetivo da revelação. Acionar a carta já conhecida pode permitir inspeção, sem contabilizá-la novamente. A raridade altera a apresentação e nunca os presentes recebidos.

### 4.5 Coleção e reinício

Após a última revelação e sua confirmação, apresentar os presentes recebidos usando a mesma identidade das cartas. Exibir todo o conteúdo, com inspeção ampliada quando necessário. A inspeção deve ter fechamento explícito, suporte a Escape e retorno de foco ao controle de origem.

“Abrir novamente” deve limpar o progresso e restaurar o pacote fechado. Nenhum verso, partícula, modal, posição de arraste ou callback antigo pode permanecer ativo. Atualizar a página também inicia uma sessão nova; persistência não é necessária.

## 5. Requisitos funcionais

| ID | Requisito | Comportamento esperado |
| --- | --- | --- |
| RF-01 | Pacote fechado com identidade original | Cena apresenta embalagem reconhecível, instrução e alternativa sem arraste |
| RF-02 | Rasgo por mouse e toque | Progresso acompanha o ponteiro em ambas as entradas; pausa do gesto pausa o rasgo |
| RF-03 | Confirmar/cancelar abertura | Soltura abaixo do limiar restaura; acima confirma uma vez; cancelamento permite nova tentativa |
| RF-04 | Remover faixa e retirar baralho | Faixa se separa e cartas emergem visualmente da abertura, sem salto de origem |
| RF-05 | Revelação individual | Uma carta ativa por vez, ordem configurada e avanço explícito após leitura |
| RF-06 | Efeitos coerentes | Efeito configurado acompanha a virada, distingue intensidade e não oculta informações |
| RF-07 | Configuração dos presentes | Adicionar, remover ou editar carta exige apenas dados/assets, sem alterar o fluxo |
| RF-08 | Imagem, ícone e alternativa visual | Imagem local opcional, fallback se ausente/falhar e texto do presente preservado |
| RF-09 | Coleção final e inspeção | Todos os presentes configurados aparecem uma vez e podem ser lidos novamente |
| RF-10 | Reinício completo | Nova sessão começa fechada, sem IDs abertos ou efeitos anteriores |
| RF-11 | Caminho acessível equivalente | Teclado e ação sem arraste concluem as mesmas etapas e entregam as mesmas cartas |
| RF-12 | Configuração da embalagem | Título/mensagem, emblema ou arte local e tema ajustáveis sem editar lógica de gesto |

## 6. Dados e personalização

### 6.1 Implementação atual

`src/data/gifts.ts` exporta `giftCards: GiftDefinition[]`. O tipo estende `GlyphCard`, com nome, descrição, raridade e opções locais de ícone/imagem, aparência, efeito e informações adicionais. O array define a ordem do baralho e os presentes garantidos.

| ID | Presente atual | Raridade | Ícone |
| --- | --- | --- | --- |
| `carrinho-shein` | Vale Carrinho SHEIN | `rare` | `bag` |
| `pudim-rebeca` | Vale Caixa de Pudim da Rebeca | `epic` | `pudding` |
| `cafe-da-tarde` | Vale Café da Tarde | `legendary` | `gift` |
| `chocolate-laranja` | Vale Chocolate com Laranja | `legendary` | `gift` |

O protótipo inicial tinha cinco exemplos com glifos; a configuração atual tem quatro presentes garantidos, com artes completas em `public/cards/`. Os ícones servem como fallback se a imagem falhar.

### 6.2 Conteúdo inicial implementado

| Campo | Carta SHEIN | Carta Pudim |
| --- | --- | --- |
| ID | `carrinho-shein` | `pudim-rebeca` |
| Nome | Vale Carrinho SHEIN | Vale Caixa de Pudim da Rebeca |
| Valor | R$ 100,00 | Não informado; não inventar valor |
| Descrição | Um vale para escolher R$ 100 em produtos na SHEIN. | Um vale-presente para ganhar uma caixa de pudim da Rebeca. |
| Arte aplicada | `public/cards/shein_card.png` | `public/cards/caixadepudim_card.png` |
| Raridade/cores de efeitos | Rara / rosa | Épica / rosa claro |

Não são necessárias URLs de compra nem funcionalidade de resgate. Além dessas duas cartas, Café da Tarde e Chocolate com Laranja usam as artes `cafedatarde_card.png` e `chocolatelaranja_card.png`, raridade lendária e efeitos dourados de celebração, sem valor monetário configurado. As quatro cartas são garantidas em cada sessão.

### 6.3 Contrato de personalização implementado

O tipo local estende `GlyphCard` preservando `name`, `line` e `art`. `line` é a descrição obrigatória para os presentes. `visual` referencia imagem ou ícone SVG; `icon` seleciona um dos desenhos locais quando não há imagem ou glifo:

```ts
// Contrato de src/data/gifts.ts; GlyphCard vem da biblioteca.
interface GiftDefinition extends GlyphCard {
  line: string;
  icon?: "bag" | "pudding" | "gift";
  visual?: {
    src: string;
    alt: string;
    fit?: "contain" | "cover";
    kind?: "image" | "logo" | "card";
  };
  appearance?: {
    primaryColor?: string;
    secondaryColors?: readonly string[];
    style?: "classic" | "foil";
  };
  revealEffect?: "default" | "celebration" | "glow";
  info?: {
    amountInCents?: number;
    currency?: "BRL";
    note?: string;
  };
}
```

Os nomes de estilo e efeito acima são opções implementadas pela aplicação, não props prontas da biblioteca. A função de revelação interpreta o efeito e usa `EffectLayer`. O tipo importa `GlyphCard` da UI, sem nova dependência. Não criar um motor genérico de templates.

Regras de configuração:

- `id`, `name` e `rarity` obrigatórios; descrição `line` deve estar preenchida para os presentes reais, mesmo sendo opcional no tipo externo.
- `visual` tem preferência sobre `art`. Em falha de imagem, usar `art` e, sem ele, um ícone genérico local. Nunca ocultar nome ou descrição por ausência de arte.
- Usar assets importados de `src/assets/` ou arquivos de `public/`; não depender de hotlinks, serviços de imagens ou chamadas externas.
- `amountInCents: 10000` representa R$ 100,00, formatado em `pt-BR`; o valor é apenas informativo. Ausência de valor não gera “R$ 0,00”.
- Raridade fornece padrões; cores/estilo opcionais ajustam a carta sem alterar regras de progresso. A moldura externa por carta depende dos limites de renderização descritos na arquitetura.
- Ausência de `revealEffect` usa o padrão do tema/raridade. Preferências de movimento e desempenho têm precedência sobre efeitos decorativos.
- Informações adicionais têm campos nomeados conforme necessidade real; evitar metadados genéricos ilimitados.
- Usar IDs únicos e raridades conhecidas. A tipagem descreve o contrato; não existe validador adicional de unicidade em runtime. Não há necessidade de framework de schema.
- Ordem do array define a ordem da revelação. Suportar 1, 2 e 5 cartas sem ajustes na lógica; coleção vazia deve exibir mensagem estática de configuração, sem interação quebrada.

`src/data/pack.ts` já reúne título, mensagem, emblema textual, cor e limiar do gesto. A arte da embalagem é provisória em CSS; imagem personalizada da embalagem e direção gráfica final ficam para evolução posterior.

## 7. Requisitos não funcionais

### Responsividade

Suportar larguras a partir de 320 CSS px, sem rolagem horizontal e sem reduzir cartas até tornar o texto ilegível. Manter proporção das cartas; adaptar escala e posições à área disponível. Em telas baixas e orientação horizontal, permitir rolagem vertical para controles e descrições. Considerar barras do navegador e áreas seguras; não depender apenas de uma altura fixa de viewport.

Mouse pode produzir inclinação/reflexo por hover. No toque, o mesmo conteúdo e feedback devem estar disponíveis sem hover. Prever redimensionamento e rotação com a experiência fechada, durante arraste e após revelação, sem exigir testes no navegador nesta etapa.

### Acessibilidade

Disponibilizar ação de um único toque/clique sem arraste e operação por teclado; a alternativa ao arraste segue o objetivo do [critério WCAG 2.2 sobre movimentos de arraste](https://www.w3.org/TR/WCAG22/#dragging-movements). Como requisitos do produto, usar foco visível, nomes acessíveis em português, contraste de texto adequado, alvos interativos de pelo menos 44 × 44 CSS px e informação de raridade também textual. Corrigir futuramente `lang="en"` para `pt-BR`, traduzir labels da biblioteca e os nomes de raridade exibidos.

Anunciar mudanças de etapa e nome do presente com moderação, sem anunciar cada frame. Ao abrir inspeção, mover o foco para ela, conter navegação se modal e devolvê-lo ao fechar. Na troca para coleção/reinício, evitar foco perdido em elemento desmontado.

Respeitar `prefers-reduced-motion`: remover flutuação contínua, tremores, giros amplos, paralaxe e flashes decorativos, preservando confirmação, conteúdo e navegação. Preferir fades curtos ou troca direta. A política vale para CSS, GSAP e efeitos da biblioteca; a existência de suporte parcial externo não equivale a conformidade do fluxo completo. Evitar sequências estroboscópicas em qualquer modo. Esses pontos são critérios do projeto, sem alegação de auditoria WCAG concluída.

### Desempenho e robustez

- Priorizar `transform` e `opacity`, poucas camadas e assets dimensionados para sua exibição. Não assumir que grandes sombras, filtros, máscaras ou gradientes animados serão baratos.
- Limitar partículas, área de iluminação, resolução e duração dos efeitos no celular. O modo leve mantém todos os presentes.
- Meta de projeto: animação próxima de 60 fps em tela de 60 Hz, sem travamento perceptível na captura do gesto. Implementar com baixo custo de layout e efeitos limitados, sem executar medições ou declarar desempenho comprovado.
- Evitar trabalho síncrono pesado nos trechos críticos do gesto e da revelação. Benchmarks e análise de frames ficam dispensados pela política de validação.
- Preparar imagens antes da revelação e reservar proporções para evitar saltos de layout. Se uma arte não carregar, continuar com fallback.
- Cancelar timelines, callbacks, captura e frames de sessões antigas. Repetir a experiência não deve acumular listeners, efeitos ou referências DOM.
- Build estático sem variáveis secretas, serviços de negócio ou chamadas externas de execução. Hospedagem estática pode ser decidida depois, sem infraestrutura adicional de aplicação.

## 8. Matriz de aceitação integrada

Os cenários abaixo orientam a implementação. Sua execução como testes visuais/funcionais está dispensada por decisão do usuário; não apresentar esses resultados como verificados. A única validação exigida é `npm run build`.

| Cenário | Resultado exigido |
| --- | --- |
| Desktop, mouse, movimento padrão | Rasgo acompanha arraste; saída e viradas são contínuas; coleção completa |
| Smartphone, toque, retrato e paisagem | Mesmo fluxo, sem conflito com rolagem e sem controles cortados |
| Teclado e ação sem arraste | Abertura, revelação, inspeção, fechamento e reinício possíveis, com foco previsível |
| Movimento reduzido | Mesmos presentes e estados; sem movimento contínuo, flashes e tremores decorativos |
| Arraste curto, retorno e cancelamento | Pacote fecha novamente; nenhum ID é revelado; nova tentativa funciona |
| Arraste concluído e comandos repetidos | Apenas uma abertura e uma revelação por ID; sem avanço concorrente |
| Última carta | Tempo de leitura e confirmação antes da coleção; nenhum presente faltando |
| Arte ausente/falha e texto longo | Fallback visível; descrição integral acessível na inspeção |
| Arrays de 1, 2 e 5 cartas | Nenhum ajuste na lógica; todas aparecem na ordem configurada |
| Array vazio | Mensagem de configuração compreensível e ausência de fluxo travado |
| Reiniciar repetidamente | Retorno ao estado fechado, sem restos visuais ou callbacks de sessão anterior |
| Rede após carregar assets locais | Nenhuma integração externa necessária para abrir e visualizar os presentes |

Compatibilidade desejada: Chrome, Firefox e Safari em desktop, Chrome em Android e Safari em iOS. Não executar testes em navegadores, emulação ou hardware real sem nova solicitação explícita. Registrar a compatibilidade como objetivo de implementação, sem alegação de certificação.

## 9. Definição de experiência concluída

Considerar a implementação entregue quando o código contemplar RF-01 a RF-12 e os comportamentos descritos na matriz, os dois presentes estiverem cadastrados e `npm run build` terminar com sucesso. Não exigir lint, testes no navegador, validação visual, vídeo, capturas ou execução em smartphone real. Nenhum serviço de backend deve ser necessário, e recursos ainda não implementados devem continuar identificados como planejados.

Na entrega, distinguir “implementado no código e build aprovado” de “validado visualmente/funcionalmente”. Informar que essas validações foram dispensadas pelo usuário, sem tratar a compilação como prova da experiência em uso.
