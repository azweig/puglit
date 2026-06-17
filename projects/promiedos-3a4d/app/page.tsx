"use client";

import { useEffect, useState } from "react";
import { NextPage } from "next";
import Link from "next/link";

interface Match {
  id: number;
  date_time: string;
  team_home: string;
  team_away: string;
  score_home: number | null;
  score_away: number | null;
}

interface Tournament {
  id: number;
  name: string;
}

interface Scorer {
  id: number;
  player_name: string;
  team_name: string;
  goals: number;
}

const HomePage: NextPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/live-football");
        const data = await response.json();
        const matchList = Array.isArray(data.matches) ? data.matches : [];
        const tournamentList = Array.isArray(data.tournaments) ? data.tournaments : [];
        const scorerList = Array.isArray(data.scorers) ? data.scorers : [];

        setMatches(matchList);
        setTournaments(tournamentList);
        setScorers(scorerList);
      } catch (err: any) {
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <header className="sticky top-0 bg-[#FF6347] shadow-md">
        <nav className="flex justify-around p-4">
          <Link href="/" className="text-[#FFD700] font-bold text-2xl">Inicio</Link>
          <Link href="/matches" className="text-[#FFD700] font-bold text-2xl">Partidos</Link>
          <Link href="/standings" className="text-[#FFD700] font-bold text-2xl">Posiciones</Link>
          <Link href="/scorers" className="text-[#FFD700] font-bold text-2xl">Goleadores</Link>
        </nav>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="text-center text-lg text-[#808080]">Loading...</div>
        ) : error ? (
          <div className="text-center text-lg text-[#FF4500]">{error}</div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="font-bold text-2xl mb-4">Partidos en Vivo</h2>
              <div className="space-y-4">
                {matches.map((m) => (
                  <div key={m.id} className="bg-[#FF6347] shadow-md rounded-lg p-4">
                    <h3 className="font-semibold text-xl text-[#FFD700]">
                      {m.team_home} vs {m.team_away}
                    </h3>
                    <p className="text-[#000000]">
                      {m.score_home ?? "-"} : {m.score_away ?? "-"}
                    </p>
                    <p className="text-[#808080]">{new Date(m.date_time).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-bold text-2xl mb-4">Top Scorers</h2>
              <div className="space-y-4">
                {scorers.map((s) => (
                  <div key={s.id} className="bg-[#FF6347] shadow-md rounded-lg p-4">
                    <h3 className="font-semibold text-xl text-[#FFD700]">
                      {s.player_name}
                    </h3>
                    <p className="text-[#000000]">
                      Goals: {s.goals}
                    </p>
                    <p className="text-[#808080]">Team: {s.team_name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-bold text-2xl mb-4">Tournaments</h2>
              <div className="space-y-4">
                {tournaments.map((t) => (
                  <div key={t.id} className="bg-[#FF6347] shadow-md rounded-lg p-4">
                    <h3 className="font-semibold text-xl text-[#FFD700]">
                      {t.name}
                    </h3>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default HomePage;
