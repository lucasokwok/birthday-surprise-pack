# Integração do booster 3D

## Diagnóstico do arquivo fornecido

`models/booster_pack_tcg_pack.glb` é um GLB 2.0 de 622.632 bytes. Foi analisado estruturalmente, sem renderização ou captura visual.

| Item | Encontrado |
| --- | --- |
| Cena | `Sketchfab_Scene` |
| Malha do pacote | `Object_4`, sob `Cube_2`; 1.132 vértices de origem, 1.352 triângulos |
| Detalhe frontal | `Object_6`, sob `Plane_3`; 13.671 vértices de origem, 10.792 triângulos |
| Atributos | Posição, normal, UV e índices em ambas as malhas |
| Material do pacote | `Material.001`: metálico 0,9, rugosidade 0,187, dupla face |
| Material do detalhe | `Material.003`: metálico 0, rugosidade 0,5, dupla face |
| Texturas/imagens | Nenhuma; o aspecto original depende dos materiais PBR e da geometria |
| Animações/skins | Nenhuma |
| Faixa superior separada | Não existe no GLB |
| Compressores externos | Não necessários |

Autoria/licença: Hasan Ajami, CC BY 4.0, conforme metadados do próprio GLB. Ver [avisos de terceiros](../THIRD_PARTY_NOTICES.md).

## Arquitetura e reaproveitamento

A implementação anterior estava em `PackExperience.tsx`: usava DOM/CSS para corpo/faixa, GSAP para abertura e saída e cartas DOM com perspectiva para revelar os presentes. As fases, limiar de gesto, cancelamento, bloqueio contra comandos repetidos, IDs revelados, efeitos, coleção e reinício foram reaproveitados.

Não havia biblioteca 3D instalada. Foram adicionados somente Three.js, React Three Fiber 9 (React 19), Drei 10 e tipos de Three.js. Não foram adicionados motor físico, outro sistema de estado, pós-processamento, serviços de assets ou backend.

`BoosterScene.tsx` carrega o arquivo por importação Vite `?url`, usando `useGLTF`. O build emite o binário em `dist/assets/` e resolve o caminho automaticamente. O cache do loader evita buscar novamente o GLB a cada abertura. Uma tentativa explícita após falha limpa apenas essa entrada do cache.

## Corte e animações

`boosterGeometry.ts` aplica as transformações dos nós a cópias da geometria e normaliza a altura para 4,2 unidades. Um corte próximo ao selo superior gera duas partes complementares por recorte de triângulos. Os atributos novos são interpolados, incluindo UV e normal. Nenhum atributo do GLB original é editado; os materiais renderizados são clones dos originais.

O shader dos materiais recebe o progresso do gesto. A deformação avança da esquerda para a direita, levantando a faixa e abrindo o bordo do corpo. Após confirmar, a faixa gira em torno da extremidade e é lançada para fora da cena. O corpo continua visível enquanto as cartas começam a subir; depois desce para fora do enquadramento. A abertura não consiste em ocultar o modelo inteiro.

`PackOpeningLight.tsx` posiciona o núcleo branco intenso e a luz pontual na linha do rasgo (`cutY`), acompanhando a largura liberada pelo gesto e a pose da embalagem. A luz não aparece com o pacote intacto, e o teste de profundidade mantém os elementos nas regiões fechadas ocultos. Não há emissão no material das cartas. Ao terminar de remover a faixa, o feixe forte cede lugar a uma iluminação residual de 18% atrás do baralho; essa camada acompanha `cardPose()` e não acompanha a embalagem descartada. Na passagem à interface DOM, uma sombra luminosa discreta em `.deck-backlight` mantém o efeito atrás das cartas durante a revelação. Intensidades e altura derivam de `packLight()` em `boosterMotion.ts`, sem timeline independente, e são menores com movimento reduzido. Materiais próprios são liberados na desmontagem; não foram adicionados bloom, pós-processamento, dependências ou um loop contínuo.

A malha do antigo rótulo branco (`Object_6`) mantém a geometria e os parâmetros PBR originais, sem deformação por shader. A dobra do corpo começa 0,06 unidade acima do rótulo; um recorte reto adicional insere vértices nesse limite. Isso impede que os triângulos maiores da embalagem propaguem a deformação sobre a malha mais densa do rótulo e a encubram. No descarte, rótulo e embalagem recebem juntos apenas as transformações do grupo do corpo, sem alteração relativa de formato ou cor. A identificação do rótulo corresponde ao GLB atual e deve ser revista se o arquivo for substituído.

A arte personalizada está em `public/textures/pack-label.png` (PNG RGBA, 1024 × 1505 px). `packConfig.labelTexture` define o caminho relativo a `public/`; o carregamento respeita o `BASE_URL` do Vite. A textura é aplicada somente ao clone do material do rótulo, preservando os parâmetros PBR e os UVs originais. O canal alfa torna o retângulo transparente nas áreas vazias e revela a embalagem metálica abaixo. A transparência tem escrita de profundidade desativada e descarte de alfa zero; o material do corpo permanece inalterado. A geometria do rótulo limita a arte à área existente. O loader mantém a imagem em cache; a textura própria da sessão é liberada na desmontagem, e a ação de tentar novamente limpa também falhas de carregamento do PNG.

As cartas emergentes são objetos Three.js com espessura e verso gerado localmente. O deslocamento é escalonado e considera profundidade. Ao acomodarem, a câmera e as poses alinham a primeira carta com o baralho DOM existente; a apresentação passa para o mesmo sistema de virada, leitura manual, efeitos e coleção.

O verso é composto em canvas com `public/vitoria.png` centralizado inteiro sobre a paleta rosa, sem símbolo ou texto. A interface usa a mesma imagem com `object-fit: contain`. O caminho fica em `src/data/cardBack.ts`; o PNG do verso e o rótulo são carregados juntos pelo cache do loader e incluídos na recuperação de falhas. As descrições foram removidas da apresentação das cartas e da inspeção, mantendo nomes e valores.

Corpo e superfície do verso usam um contorno arredondado real, extrudado com espessura de 0,018 unidade. `src/data/cardLayout.ts` compartilha proporção e raio entre a geometria 3D e o CSS/frame DOM: o raio equivale a 28/300 da largura. As UVs da face são normalizadas para manter a imagem inteira do verso, sem voltar a exibir uma superfície retangular nos cantos.

`boosterMotion.ts` é o contrato numérico entre GSAP, o renderizador e os testes. O progresso por frame fica em refs; o React continua sendo atualizado apenas nas mudanças lógicas de fase. Cada transformação tem um proprietário.

## Interface e qualidade

- Fundo preto e viewport inteira; sem cabeçalho, título, contador, instruções, rodapé ou HUD visível. O botão com ícone de reinício no canto superior direito é a exceção solicitada posteriormente pelo usuário.
- Rótulo inicialmente alinhado à câmera, sem rotação fixa lateral. Mouse à esquerda gira o pacote para a direita, e vice-versa, com suavização de 0,6 segundo e amplitude horizontal limitada.
- Respiração em ciclo suave de 4,8 segundos, combinando escala de até 0,8% e leve deslocamento vertical. Pausa ao iniciar o rasgo/abertura e retorna ao repouso; retoma se o gesto for cancelado. Fica desativada com movimento reduzido e pausada quando a aba está oculta.
- Arraste na parte superior para abrir; clique/toque na carta para revelar e continuar.
- Controles de teclado e anúncios permanecem acessíveis, visualmente ocultos. O foco por teclado pode tornar a ação acessível visível.
- Na coleção, toque em uma carta para inspecionar; feche pelo botão ×, Escape ou fundo do diálogo. Use o ícone de reinício para voltar ao booster fechado; clicar no fundo da coleção preserva a sessão. A tecla R também reinicia enquanto o foco está na aplicação, fora do diálogo.
- `frameloop="demand"`, invalidação durante respiração/animação/interação, DPR limitado a 1,5 e iluminação de ambiente gerada localmente, sem HDR/CDN externo.
- Preservação de valores PBR do modelo. Não há texturas externas a substituir ou baixar.
- Falha de carregamento ou ausência de WebGL apresenta mensagem e tentativa novamente, em vez de uma tela silenciosamente travada.
- Movimento reduzido encurta as transições e mantém as regras existentes de redução dos efeitos.
- Recursos próprios são liberados na desmontagem. O GLB de origem permanece no cache e não é alterado pelas sessões.

## Regras dos presentes preservadas

O aplicativo atual não tem probabilidades, inventário persistente ou chamadas de abertura a uma API. Os dois presentes configurados são garantidos, na ordem do array, e o progresso é em memória. A integração 3D preserva isso. Não foi criado sorteio nem persistência nova.

## Validação e limites

`npm test` verifica leitura do GLB, estrutura dos materiais, separação de corpo/faixa, conservação de área, interpolação de UVs, limite de dobra acima do rótulo, saída escalonada, alinhamento final e reinicialização numérica. `npm run build` verifica TypeScript e produção. Os testes usam o executor nativo do Node com suporte a TypeScript; usar Node 22.12+.

Por instrução posterior do usuário, não foram feitos testes visuais, navegação, screenshots ou avaliação de fluidez em aparelhos. A compilação e os testes matemáticos não comprovam renderização de shaders, acabamento do rasgo ou continuidade percebida da transição: esses itens devem ser avaliados visualmente pelo usuário.

O modelo não possui rig de embalagem nem animação autoral de rasgo. A solução é um corte com borda irregular e deformação procedural localizada, sem simulação física de folha. Materiais e detalhes foram mantidos; não foram inventadas texturas ausentes.
