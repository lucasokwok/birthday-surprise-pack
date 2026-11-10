# Roadmap de evolução

## 1. Como usar este plano

**Atualização 3D:** modelo fornecido integrado com malhas recortadas e deformadas, saída das cartas em Three.js e passagem à revelação existente. Tela preta sem HUD. Ver [MODEL_3D.md](MODEL_3D.md). Na presente entrega, executar `npm test` e `npm run build`; o usuário fará a validação visual. Não abrir navegador, produzir capturas ou fazer medições de aparência/fluidez.

Este roadmap registra objetivos e estado da implementação de 09/11/2026. Os requisitos estão em [PROJECT_SPEC.md](PROJECT_SPEC.md) e a arquitetura atual em [ARCHITECTURE.md](ARCHITECTURE.md). Os comportamentos listados por entrega são referências de escopo; não devem ser interpretados como resultados de testes.

| Entrega | Status no código |
| --- | --- |
| 1A/1B: gesto e faixa | Implementados em `PackExperience` |
| 2A/2B: saída e baralho | Implementados com camadas e timelines GSAP |
| 3A/3B: revelação e efeitos | Implementados; avanço manual e efeitos da biblioteca |
| 4A: dados | SHEIN e Pudim cadastrados, contrato configurável |
| 4B: design das cartas | Frame e ícones provisórios, imagem/fallback e foil simples; arte final adiada |
| 5A: coleção | Implementada com inspeção e reinício |
| 6A/6B: polimento | Base simples; refinamento gráfico adiado conforme pedido |
| 7A: build | Executar `npm run build`; demais validações dispensadas |
| 7B: documentação | Atualizada para a composição implementada |



A prioridade segue a experiência: rasgo, saída e revelação. Implementar todas as animações com design provisório simples; refinamento do pacote e das cartas fica para depois. Responsividade e acessibilidade continuam sendo requisitos do código.

**Política definida pelo usuário:** validar somente com `npm run build`, para economizar tokens. Não executar lint, testes, navegador, screenshots, vídeos ou benchmarks sem nova solicitação explícita. Os comportamentos abaixo são objetivos de implementação, sem obrigação de validação prática. O deploy na Vercel fica por conta do usuário.

Não há cronograma artificial nem necessidade de backend. Cada entrega deve resultar em um comportamento demonstrável e uma alteração pequena o suficiente para revisão. Aprovação de uma etapa não autoriza funcionalidades comerciais ou integrações fora do escopo.

## 2. Preparação mínima para a primeira entrega

Na implementação, instalar as dependências existentes com `npm ci`, preservar o lockfile e executar `npm run build` ao concluir as alterações. Não abrir navegador nem executar validações visuais.

Não iniciar por refatoração geral, migração de stack ou criação de todos os componentes propostos. A arquitetura já identifica o limite principal: `CardPack` 1.4.1 não expõe controle contínuo da abertura nem uma pilha sequencial. O primeiro experimento deve testar a cena própria com as primitivas existentes, não procurar uma nova biblioteca sem evidência.

## 3. Prioridade 1 — Abertura interativa do pacote

### Entrega 1A: gesto e material em escala reduzida de escopo

**Objetivo:** implementar controle direto do rasgo, antes de investir em partículas e arte final.

Criar uma cena mínima de embalagem com corpo e faixa superior separados. Usar Pointer Events para mouse/toque, progresso normalizado, captura, retorno abaixo do limiar e confirmação única. Reaproveitar GSAP e CSS/SVG; usar arte provisória original. Incluir alternativa por botão e teclado, além de política básica de movimento reduzido.

**Comportamento a implementar:**

- Ao parar o ponteiro em aproximadamente 25%, 50% e 75%, o rasgo também para na posição correspondente.
- Arraste insuficiente retorna ao fechado, sem registrar presentes.
- Arraste confirmado abre uma única vez; um toque sem arraste não confirma na área principal.
- Mouse e dedo funcionam; segundo ponteiro é ignorado.
- `pointercancel`, perda de captura e mudança de orientação não deixam a cena travada.
- A alternativa sem arraste passa pelas mesmas fases lógicas e funciona por teclado.
- Implementar medidas responsivas para celular e desktop.

**Rastreabilidade:** RF-01, RF-02, RF-03, RF-11.

### Entrega 1B: separação convincente da faixa

**Objetivo:** completar a sensação de material físico.

Adicionar borda irregular de rasgo, reação discreta do corpo, resistência visual, remoção da faixa e acomodação da embalagem aberta. Ao confirmar, o controle passa do gesto para uma timeline; o gesto não deve continuar escrevendo nas mesmas transformações. Não implementar ainda uma simulação física por malha.

**Comportamento a implementar:** faixa acompanha o gesto, se desprende da região correta, sai com inércia moderada e deixa a boca do pacote visível; o corpo não desaparece abruptamente; retorno/reinício restauram todas as camadas. Movimento reduzido mantém a confirmação sem giros e tremores decorativos.

**Dependência:** 1A. **Rastreabilidade:** RF-03, início de RF-04.

## 4. Prioridade 2 — Saída das cartas

### Entrega 2A: origem e oclusão corretas

**Objetivo:** cartas realmente parecem sair de dentro da embalagem.

Integrar um pequeno conjunto de cartas com verso provisório. Fazer a frente do pacote ocultar a região ainda interna e deslocar as cartas pela abertura. Preservar continuidade espacial com a cena de rasgo; não montar um segundo pacote por clique após o primeiro desaparecer.

**Comportamento a implementar:** implementar oclusão das cartas pela frente do material; o ponto de saída coincide com a abertura; cartas não podem ser reveladas durante o deslocamento; redimensionamento não causa salto ou estado travado. O modo reduzido chega ao mesmo estado final com transição simples.

**Dependência:** 1B. **Rastreabilidade:** RF-04.

### Entrega 2B: formação do baralho

**Objetivo:** transformar saída em uma pilha pronta para descoberta.

Aplicar perspectiva, camadas, pequenos atrasos e desaceleração. Reutilizar `Card` para frente/verso quando adequado, mantendo wrappers de voo separados das transformações internas. Suportar 1, 2 e 5 cartas, sem regras vinculadas a um número fixo.

**Comportamento a implementar:** ordem visual e de dados coincidem; o baralho acomoda sem salto; a primeira carta fica identificável; apenas o término da timeline libera a revelação. Reiniciar não deixa cartas ou efeitos da sessão anterior.

**Dependência:** 2A. **Rastreabilidade:** RF-04, base de RF-05 e RF-10.

## 5. Prioridade 3 — Revelação individual

### Entrega 3A: fila, virada e leitura

**Objetivo:** cada presente ganha um momento próprio.

Implementar uma carta ativa por vez, ordem do array e avanço explícito após leitura. Escolher um único proprietário da fila: composição local pequena com `Card` e GSAP, ou regras de `core` com renderizador compatível. Registrar a escolha conforme o protótipo. Não usar `CardOpening` supondo que `readingOf` crie uma pausa indefinida: seu fluxo normal é temporizado na versão analisada.

**Comportamento a implementar:** primeira virada tem antecipação e repouso; nome/descrição permanecem disponíveis até a pessoa continuar; cliques repetidos durante a transição não duplicam IDs nem pulam cartas; a coleção só fica disponível após ler e confirmar a última carta. Teclado permite concluir tudo.

**Dependência:** 2B. **Rastreabilidade:** RF-05, RF-10, RF-11.

### Entrega 3B: efeitos de raridade sincronizados

**Objetivo:** dar intensidade adequada às revelações sem prejudicar leitura.

Começar pelos temas e efeitos existentes, como o preset festivo ou um plano reduzido. Sincronizar o efeito com a virada e garantir que a configuração por carta seja interpretada pela aplicação quando necessária. Não adicionar outra biblioteca de partículas.

**Comportamento a implementar:** implementar tratamentos discreto e intenso; efeito ocorre no momento correto, termina sem resíduos e mantém texto legível. O movimento reduzido elimina flashes/tremores decorativos e entrega os mesmos presentes.

**Dependência:** 3A. **Rastreabilidade:** RF-06.

## 6. Prioridade 4 — Design e personalização das cartas

### Entrega 4A: contrato de dados e conteúdo definitivo inicial

**Objetivo:** configurar presentes sem editar a lógica.

Evoluir `src/data/gifts.ts` conforme o contrato opcional da especificação, preservando compatibilidade com `GlyphCard`. Cadastrar Vale Carrinho SHEIN (R$ 100,00) e Vale Caixa de Pudim da Rebeca com as descrições definidas. Substituir os exemplos nesta entrega, não na tarefa documental. Escolher raridades e paleta como decisões visuais, sem sorteio.

**Comportamento a implementar:** inserir/remover/editar uma carta somente em dados/assets funciona com 1, 2 e 5 entradas; IDs duplicados e raridades inválidas são sinalizados durante desenvolvimento; ausência de valor no Pudim não exibe preço zero; lista vazia tem apresentação estática compreensível.

**Dependência:** 3A; pode acompanhar o final de 3B sem antecipar arte complexa. **Rastreabilidade:** RF-07 e conteúdo de RF-08.

### Entrega 4B: face, verso e arte premium

**Objetivo:** consolidar a identidade original das cartas.

Criar `GiftCardFace` comum à revelação e coleção, imagens/ícones locais opcionais, fallback, cores e estilos limitados. Aplicar moldura, tipografia, verso e holografia seletiva. Usar `renderFace`/`renderBack` ou `Card` conforme a composição escolhida; evitar colocar URL no campo `art`.

**Comportamento a implementar:** fotos/ícones carregam sem salto de layout; falha da imagem preserva conteúdo e mostra fallback; nomes longos e descrições completas podem ser lidos. Cor individual funciona inclusive em duas cartas da mesma raridade quando configurada. Dados visuais não contêm callbacks de animação. Artes não dependem de serviços externos.

**Dependência:** 4A. **Rastreabilidade:** RF-07, RF-08.

## 7. Prioridade 5 — Coleção final

### Entrega 5A: coleção consistente e inspeção

**Objetivo:** revisitar os presentes sem perder o acabamento da revelação.

Substituir a grade textual pela apresentação das mesmas cartas, responsiva e com inspeção ampliada. Reutilizar `Card` e a face compartilhada; avaliar `peek` de `core`/`CardOpening` para reinspeção, sem abrir novamente os IDs. Preservar reinício por sessão.

**Comportamento a implementar:** todos os presentes aparecem uma vez; nome, descrição, valor quando houver e informações adicionais são legíveis; inspeção fecha por controle explícito e Escape e devolve foco à origem. Reiniciar restaura embalagem fechada, fila e efeitos. Limpar recursos da sessão anterior ao reiniciar.

**Dependência:** 4B e conclusão de 3A. **Rastreabilidade:** RF-09, RF-10, RF-11.

## 8. Prioridade 6 — Polimento visual

### Entrega 6A: identidade do pacote e continuidade

**Objetivo:** fazer pacote, cartas e coleção pertencerem à mesma experiência.

Definir arte original da embalagem, paleta, tipografia, título e mensagem configuráveis. Refinar sombra, reflexo, profundidade, antecipação e transições. Corrigir metadados de template e traduzir labels/raridades da biblioteca. Limpeza de assets sem uso pode acompanhar essa entrega, com revisão das referências.

**Comportamento a implementar:** personalizar mensagem/arte do pacote não exige editar gesto; a experiência não mistura textos em inglês; pacote, baralho, cartas e coleção têm continuidade gráfica e espacial. Confirmar `lang="pt-BR"` no HTML. **Rastreabilidade:** RF-01, RF-12 e refinamento de RF-04 a RF-09.

### Entrega 6B: microinterações e efeitos finais

**Objetivo:** aumentar acabamento sem tornar o fluxo mais pesado ou confuso.

Refinar resposta ao hover/pega, inclinação, holografia, iluminação e partículas. Limitar camadas e partículas no celular. Remover o que compete com o gesto ou a leitura; não criar efeitos apenas para preencher a tela.

**Comportamento a implementar:** controles respondem imediatamente; transições não têm posições abruptas; efeitos acabam e não acumulam. O toque tem feedback equivalente ao hover e o modo reduzido permanece completo.

**Dependência:** 6A. **Rastreabilidade:** RF-06 e qualidade visual de todo o fluxo.

## 9. Prioridade 7 — Consolidação de responsividade, acessibilidade e desempenho

### Entrega 7A: consolidação e build

Contemplar os comportamentos da [matriz de aceitação](PROJECT_SPEC.md#8-matriz-de-aceitação-integrada) no código, sem executar a matriz como testes. A única validação exigida é `npm run build`; corrigir as falhas até o comando passar.

Não executar lint, testes automatizados, navegador, emulação, screenshots, vídeos ou medições de desempenho. Registrar o resultado do build e a ausência de validação visual/funcional; compilação não comprova comportamento em uso.

### Entrega 7B: documentação final da implementação

Atualizar README, arquitetura, exemplos de personalização e status deste plano conforme o código entregue. Registrar como trocar imagem/ícone, texto, raridade, cores, efeito e arte do pacote, com caminhos reais. Identificar a decisão de composição efetivamente adotada e os limites conhecidos. Não manter descrições futuras apresentadas como implementadas ou diagramas de arquivos que não existem.

**Comportamento a implementar:** outra pessoa consegue executar o frontend e trocar um presente apenas seguindo os documentos; os links funcionam; a lista de recursos prontos corresponde ao código. A [definição de experiência concluída](PROJECT_SPEC.md#9-definição-de-experiência-concluída) está atendida e evidenciada.

## 10. Escopo que deve permanecer adiado

Backend, banco, login, painel administrativo, checkout, cupons/resgate, integração SHEIN, sorteio de presentes, sincronização entre dispositivos e infraestrutura de observabilidade não contribuem para este produto. Não entram como “próxima fase” automática. WebGL, motores físicos, forks da biblioteca ou novas dependências exigem evidência de limitação concreta da solução simples, e não são pré-requisitos deste plano.

**Próxima ação recomendada:** colher feedback do usuário sobre as animações e definir posteriormente a direção visual do pacote e das cartas. O deploy na Vercel fica por conta do usuário.
