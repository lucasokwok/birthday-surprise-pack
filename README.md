# Birthday Surprise Pack

Uma experiência frontend de aniversário: um booster 3D sobre fundo preto, sem HUD. Rasgue a faixa superior com o mouse ou dedo, veja as cartas saírem da embalagem e revele seus presentes. O modelo fornecido está em `models/booster_pack_tcg_pack.glb`; o design das cartas continua provisório.

Não há backend, banco, login, pagamentos, cupons válidos, resgate ou integração com lojas. Os presentes são simbólicos e serão entregues fora da aplicação. Nenhum asset oficial de Pokémon foi incorporado.

## Implementado

- Rasgo horizontal controlado por Pointer Events, com progresso proporcional ao arraste.
- Retorno da faixa se a pessoa soltar antes de 75%; confirmação única após o limiar.
- Tratamento de cancelamento, perda de captura, resize e perda de foco da janela.
- Abertura alternativa por botão/teclado.
- Corte procedural na geometria do GLB, faixa superior se deformando e se desprendendo, com cartas 3D saindo da embalagem em sequência.
- Materiais originais preservados, iluminação local, cache do modelo e recuperação de falha. O GLB não contém texturas ou animações incorporadas.
- Cena em tela inteira preta, sem cabeçalho, contador, instruções visíveis ou rodapé.
- Revelação individual com antecipação, virada em perspectiva e efeitos da biblioteca.
- Avanço manual após a leitura; comandos bloqueados durante as transições.
- Quatro cartas com artes completas em `public/cards/`: SHEIN (rara, R$ 100,00), Caixa de Pudim da Rebeca (épica), Café da Tarde e Chocolate com Laranja (lendárias).
- Coleção com inspeção em diálogo nativo, fechamento por Escape e reinício completo pelo botão com ícone no canto superior direito.
- Regras responsivas e modo de movimento reduzido no código.

Esses itens descrevem a implementação. Na integração 3D foram executados `npm test` (estrutura/geometria/movimento) e `npm run build`. Por decisão do usuário, não são feitos testes visuais, navegação, screenshots ou benchmarks. A avaliação visual será feita pelo próprio usuário; os testes não comprovam renderização de shaders ou fluidez em aparelhos reais.

## Stack

React 19, TypeScript, Vite, GSAP, Three.js, React Three Fiber 9, Drei 10 e `@react-cards-opening/core`/`ui` 1.4.1. `Card`, temas e `EffectLayer` são reutilizados da biblioteca. A cena de pacote e a sequência manual são próprias, pois `CardPack` não expõe controle contínuo de rasgo. As dependências 3D foram adicionadas para atender à substituição solicitada; nenhum motor físico ou serviço externo foi introduzido.

As versões exatas são as do `package-lock.json`. Usar Node 22.12+ para executar as ferramentas e os testes TypeScript pelo executor nativo do Node.

## Execução e build

```bash
npm ci
npm run dev
```

Use a URL informada pelo Vite. Não são necessárias credenciais nem variáveis de ambiente.

```bash
npm test
npm run build
```

O comando executa TypeScript e Vite e gera `dist/`. `npm run preview` serve esse build localmente, caso você queira experimentá-lo. O script `npm run lint` continua disponível, mas está dispensado da rotina por decisão do usuário.

**O deploy na Vercel fica por conta do usuário.** Este projeto gera arquivos estáticos em `dist/`; nenhuma publicação ou configuração de conta foi realizada.

## Personalização

Editar [src/data/gifts.ts](src/data/gifts.ts) para adicionar/remover presentes ou mudar os campos:

```ts
{
  id: "meu-presente", // único e estável
  name: "Meu presente",
  line: "Descrição do presente.",
  rarity: "rare",
  icon: "gift", // bag, pudding ou gift
  appearance: {
    primaryColor: "#c5a5ff",
    secondaryColors: ["#f0bf86"],
    style: "foil", // classic ou foil
  },
  revealEffect: "celebration", // default, celebration ou glow
  info: { note: "Uma mensagem opcional." },
}
```

Para imagem ou ícone próprio, usar `visual: { src: "/meu-presente.webp", alt: "Descrição da imagem", fit: "contain" }`, com arquivo em `public/`, ou importar um asset de `src/assets/`. Imagem tem preferência; em falha, aparece `art` (glifo opcional da biblioteca) ou o ícone local. Para uma arte de carta completa, usar `visual: { src: import.meta.env.BASE_URL + "cards/minha_card.png", alt: "Meu presente", kind: "card" }`. Esse modo ocupa a frente sem cortes, sem sobrepor nome, raridade, valor ou selo; o texto alternativo informa a raridade. Se a imagem falhar, o layout com nome, raridade e valor é restaurado com o glifo/ícone de fallback. Não é necessário editar a lógica da experiência. Por solicitação do usuário, descrições e mensagens complementares não são exibidas nas cartas nem na inspeção; `line` permanece nos dados por compatibilidade com o tipo da biblioteca.

`info.amountInCents` é opcional; `10000` exibe R$ 100,00. Sem valor configurado não aparece preço. A ordem do array é a ordem de revelação. Todos os presentes são garantidos; raridade afeta somente a apresentação. Uma lista vazia exibe uma mensagem estática.

Editar [src/data/pack.ts](src/data/pack.ts) para cor dos efeitos e limiar do gesto. Os campos antigos de mensagem/emblema não geram HUD; a aparência da embalagem vem do GLB. Arraste a parte superior para abrir e toque/clique nas cartas para revelar/continuar ou inspecionar na coleção. O botão com ícone no canto superior direito restaura o booster fechado; clicar no fundo da coleção não reinicia mais a sessão. Também há controles acessíveis por teclado; R reinicia enquanto o foco está na aplicação, fora do diálogo.

O rótulo usa `public/textures/pack-label.png`, configurado em `packConfig.labelTexture`. Substitua esse arquivo por um PNG RGBA vertical de aproximadamente 1024 × 1505 px. As áreas transparentes deixam aparecer o material metálico original, e a arte fica limitada à área do antigo rótulo branco.

As cores das cartas ficam em `src/data/cardPalette.ts`: rosa `#fa118f` extraído do rótulo, rosa claro e fundos em tom vinho. A paleta é compartilhada pela frente, pelo verso DOM/3D e pela inspeção. Os acentos de cada presente continuam configuráveis em `appearance`, com foil ativo nas duas cartas.

As cartas usam os arquivos locais `public/shein.jpg`, `public/pudim_pack.webp` e `public/doceriadarebeka.jpg`. Em `gifts.ts`, `visual` configura a arte principal; `visual.kind: "logo"` aplica uma placa branca para marcas. O campo opcional `brand: { src, alt }` adiciona o selo da doceria à imagem do pudim. Se a arte principal falhar, permanece o ícone de fallback; uma falha da logo secundária remove apenas o selo.

O verso usa `public/vitoria.png`, centralizado inteiro sobre o fundo rosa, sem texto. `src/data/cardBack.ts` compartilha o caminho entre a interface e as cartas 3D.

## Estrutura

```text
src/
  App.tsx                       # Sessão, experiência e coleção
  components/PackExperience.tsx  # Gesto, fases, timelines e revelação
  components/BoosterScene.tsx    # GLB, luz, corte/deformação e saída 3D
  three/boosterGeometry.ts       # Corte com atributos preservados
  three/boosterMotion.ts         # Poses e progresso da cena
  components/GiftCard.tsx        # Carta comum ao baralho e à coleção
  components/GiftCollection.tsx  # Coleção e diálogo de inspeção
  data/gifts.ts                 # Conteúdo e opções dos presentes
  data/pack.ts                  # Configuração da embalagem
  App.css                       # Cena e visual provisório
  index.css                     # Base global
```

## Documentação

- [Modelo 3D](docs/MODEL_3D.md): análise das malhas, materiais, corte, limitações e testes.
- [Especificação](docs/PROJECT_SPEC.md): visão e comportamentos desejados.
- [Arquitetura](docs/ARCHITECTURE.md): composição implementada, estado e animações.
- [Roadmap](docs/ROADMAP.md): prioridades e status das entregas.
- [Skills e referências](docs/IMPLEMENTATION_RESOURCES.md): fontes externas e limites de aplicação.
- [Instruções para agentes](AGENTS.md): decisões do projeto e validação sem navegador/capturas.
- [Skills locais](.agents/skills/README.md): seleção instalada para implementação.

## Licença

Código sob [MIT](LICENSE). O modelo de Hasan Ajami está sob CC BY 4.0: ver [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). O arquivo original não foi alterado; o corte e a deformação são derivados em memória. Nenhum código ou asset das demos de referência foi copiado.
