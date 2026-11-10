import { useCallback, useState } from "react";
import { giftCards } from "./data/gifts";
import { PackExperience } from "./components/PackExperience";
import { GiftCollection } from "./components/GiftCollection";
import "./App.css";

export default function App() {
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(0);
  const complete = useCallback(() => setFinished(true), []);

  const restart = useCallback(() => {
    setFinished(false);
    setSession((previous) => previous + 1);
  }, []);

  return (
    <main className="app" onKeyDown={(event) => {
      if (event.key.toLowerCase() === "r" && !(event.target as HTMLElement).closest("dialog")) restart();
    }}>
      <button className="restart-button" type="button" onClick={restart}
        aria-label="Reiniciar experiência" title="Reiniciar experiência">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M3 10a9 9 0 1 1 2.6 8.4" />
          <path d="M3 4v6h6" />
        </svg>
      </button>
      {giftCards.length === 0 ? <p className="empty-state">Ainda não há presentes configurados neste pacote.</p>
        : finished ? <GiftCollection gifts={giftCards} />
          : <PackExperience key={session} gifts={giftCards} onComplete={complete} />}
    </main>
  );
}
