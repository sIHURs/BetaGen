import { FormEvent, useState } from "react";
import { analyzeMock } from "./api/client";
import type { AnalyzeResponse } from "./api/types";
import "./styles.css";

function App() {
  const [climbName, setClimbName] = useState("Blue Arete");
  const [wallAngle, setWallAngle] = useState(35);
  const [attempts, setAttempts] = useState(4);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeMock({
        climb_name: climbName,
        wall_angle: wallAngle,
        attempts,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>BetaGen Boulder Analyzer</h1>
      <p className="subtitle">Windows 11 development skeleton</p>

      <form onSubmit={onSubmit} className="panel">
        <label>
          Climb Name
          <input value={climbName} onChange={(e) => setClimbName(e.target.value)} required />
        </label>

        <label>
          Wall Angle (0-90)
          <input
            type="number"
            min={0}
            max={90}
            value={wallAngle}
            onChange={(e) => setWallAngle(Number(e.target.value))}
            required
          />
        </label>

        <label>
          Attempts
          <input
            type="number"
            min={1}
            max={100}
            value={attempts}
            onChange={(e) => setAttempts(Number(e.target.value))}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Run Mock Analysis"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <section className="panel">
          <h2>Result</h2>
          <p>Climb: {result.climb_name}</p>
          <p>Estimated Grade: {result.grade_estimate}</p>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <ul>
            {result.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

export default App;
