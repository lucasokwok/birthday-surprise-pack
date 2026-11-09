# Birthday Surprise Pack

Uma experiência frontend de aniversário: rasgue um pacote com o mouse ou dedo, retire o baralho e revele seus presentes. A primeira implementação prioriza as animações; a identidade gráfica do pacote e das cartas é provisória e pode ser refinada depois.

Não há backend, banco, login, pagamentos, cupons válidos, resgate ou integração com lojas. Os presentes são simbólicos e serão entregues fora da aplicação. Nenhum asset oficial de Pokémon foi incorporado.

## Implementado

- Rasgo horizontal controlado por Pointer Events, com progresso proporcional ao arraste.
- Retorno da faixa se a pessoa soltar antes de 75%; confirmação única após o limiar.
- Tratamento de cancelamento, perda de captura, resize e perda de foco da janela.
- Abertura alternativa por botão/teclado.
- Faixa superior se desprendendo e cartas saindo de trás da embalagem para formar um baralho.
- Revelação individual com antecipação, virada em perspectiva e efeitos da biblioteca.
- Avanço manual após a leitura; comandos bloqueados durante as transições.
- Vale Carrinho SHEIN de R$ 100,00 e Vale Caixa de Pudim da Rebeca.
- Coleção com inspeção em diálogo nativo, fechamento por Escape e reinício completo.
- Regras responsivas e modo de movimento reduzido no código.

Esses itens descrevem a implementação. Por decisão do usuário, a validação é limitada a `npm run build`: não são executados lint, testes, navegador, screenshots, vídeos ou benchmarks. Compilar não comprova aparência, funcionamento dos gestos, acessibilidade ou fluidez em aparelhos reais.

## Stack

React 19, TypeScript, Vite, GSAP e `@react-cards-opening/core`/`ui` 1.4.1. `Card`, temas e `EffectLayer` são reutilizados da biblioteca. A cena de pacote e a sequência manual são próprias, pois `CardPack` não expõe controle contínuo de rasgo. Não foi adicionada nova dependência.

As versões exatas são as do `package-lock.json`. Node compatível com `^20.19.0 || >=22.12.0` é necessário para as ferramentas resolvidas.

## Execução e build

```bash
npm ci
npm run dev
```

Use a URL informada pelo Vite. Não são necessárias credenciais nem variáveis de ambiente.

```bash
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

Para imagem ou ícone próprio, usar `visual: { src: "/meu-presente.webp", alt: "Descrição da imagem", fit: "contain" }`, com arquivo em `public/`, ou importar um asset de `src/assets/`. Imagem tem preferência; em falha, aparece `art` (glifo opcional da biblioteca) ou o ícone local. Não é necessário editar a lógica da experiência. Os textos completos também aparecem abaixo da carta durante a leitura, além do campo opcional `note` na inspeção.

`info.amountInCents` é opcional; `10000` exibe R$ 100,00. Sem valor configurado não aparece preço. A ordem do array é a ordem de revelação. Todos os presentes são garantidos; raridade afeta somente a apresentação. Uma lista vazia exibe uma mensagem estática.

Editar [src/data/pack.ts](src/data/pack.ts) para título, mensagem, emblema, cor e limiar do rasgo. Os detalhes de design poderão mudar depois sem alterar a sequência.

## Estrutura

```text
src/
  App.tsx                       # Sessão, experiência e coleção
  components/PackExperience.tsx  # Gesto, timelines, baralho e revelação
  components/GiftCard.tsx        # Carta comum ao baralho e à coleção
  components/GiftCollection.tsx  # Coleção e diálogo de inspeção
  data/gifts.ts                 # Conteúdo e opções dos presentes
  data/pack.ts                  # Configuração da embalagem
  App.css                       # Cena e visual provisório
  index.css                     # Base global
```

## Documentação

- [Especificação](docs/PROJECT_SPEC.md): visão e comportamentos desejados.
- [Arquitetura](docs/ARCHITECTURE.md): composição implementada, estado e animações.
- [Roadmap](docs/ROADMAP.md): prioridades e status das entregas.
- [Skills e referências](docs/IMPLEMENTATION_RESOURCES.md): fontes externas e limites de aplicação.
- [Instruções para agentes](AGENTS.md): decisões do projeto e validação somente por build.
- [Skills locais](.agents/skills/README.md): seleção instalada para implementação.

## Licença

Código sob [MIT](LICENSE). Imagens próprias devem ter autorização apropriada; nenhuma arte de terceiros dos repositórios de referência foi copiada.
