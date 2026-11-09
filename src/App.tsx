import { useState } from "react";
import { CardPack, EFFECT_SETS } from "@react-cards-opening/ui";
import { giftCards } from "./data/gifts";
import "./App.css";

export default function App() {
  const [opened, setOpened] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(0);

  function handleOpen(id: string) {
    setOpened((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
  }

  function restart() {
    setOpened([]);
    setFinished(false);
    setSession((previous) => previous + 1);
  }

  return (
    <main className="app">
      <header>
        <h1>Birthday Surprise Pack</h1>
        <p>Uma surpresa especial de aniversário ❤️</p>
      </header>

      {!finished ? (
        <section aria-label="Abertura de presentes">
          <p>Toque no pacote para descobrir seus presentes!</p>

          <CardPack
            key={session}
            cards={giftCards}
            opened={opened}
            onOpen={handleOpen}
            onDone={() => setFinished(true)}
            effects={EFFECT_SETS.festive}
          />
        </section>
      ) : (
        <section>
          <h2>Sua coleção de presentes!</h2>
          <p>Todos esses presentes são seus ❤️</p>

          <div className="gift-grid">
            {giftCards.map((card) => (
              <article className="gift-item" key={card.id}>
                <h3>{card.name}</h3>
                <p>{card.line}</p>
                <small>{card.rarity}</small>
              </article>
            ))}
          </div>

          <button className="restart-button" onClick={restart}>
            Abrir novamente
          </button>
        </section>
      )}
    </main>
  );
}
