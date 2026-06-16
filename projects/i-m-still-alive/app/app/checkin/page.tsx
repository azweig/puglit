"use client";

import { useState, useEffect } from "react";

export default function CheckInPage() {
  const [status, setStatus] = useState({ lastCheckIn: null, silenceDays: 7, daysSinceCheckIn: null });
  const [silenceDays, setSilenceDays] = useState(7);

  useEffect(() => {
    async function fetchStatus() {
      const res = await fetch("/api/checkin");
      const data = await res.json();
      setStatus(data);
      setSilenceDays(data.silenceDays || 7);
    }
    fetchStatus();
  }, []);

  async function handleCheckIn() {
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ silence_days: silenceDays }),
    });
    const res = await fetch("/api/checkin");
    const data = await res.json();
    setStatus(data);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">I'm still alive ✓</h1>
      <button
        className="bg-[var(--brand)] text-white py-2 px-4 rounded mb-4"
        onClick={handleCheckIn}
      >
        Check In
      </button>
      <div className="mb-4">
        <p>Last Check-In: {status.lastCheckIn || "Never"}</p>
        <p>Days Since Last Check-In: {status.daysSinceCheckIn || "N/A"}</p>
        <p>
          Silence Days Threshold: 
          <input
            type="number"
            value={silenceDays}
            onChange={(e) => setSilenceDays(Number(e.target.value))}
            className="ml-2 border rounded p-1"
          />
        </p>
      </div>
      <p className="text-sm text-gray-600">
        If you don't check in within your set threshold, your messages will be delivered to your recipients.
      </p>
    </div>
  );
}
