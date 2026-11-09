import { useCallback, useState } from "react";
import { giftCards } from "./data/gifts";
import { packConfig } from "./data/pack";
import { PackExperience } from "./components/PackExperience";
import { GiftCollection } from "./components/GiftCollection";
import "./App.css";

export default function App() {
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(0);
  const complete = useCallback(() => setFinished(true), []);

  function restart() {
    setFinished(false);
    setSession((previous) => previous + 1);
  }

  return (
    <main className="app">
      <header className="app-header">
        <span className="brand">✦ Birthday Surprise Pack</span>
        <button type="button" className="text-button" onClick={restart}>Recomeçar</button>
      </header>
      <div className="intro"><h1>{packConfig.title}</h1><p>{packConfig.message}</p></div>
      {giftCards.length === 0 ? <p className="empty-state">Ainda não há presentes configurados neste pacote.</p>
        : finished ? <GiftCollection gifts={giftCards} onRestart={restart} />
          : <PackExperience key={session} gifts={giftCards} onComplete={complete} />}
      <footer>Feito para celebrar você.</footer>
    </main>
  );
}
