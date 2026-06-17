"use client";

import { useEffect, useState } from "react";

interface Branch {
  id: number;
  name: string;
  address: string;
  offers: string[];
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState<{ name: string; address: string }>({ name: "", address: "" });

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch("/api/branches");
        if (!response.ok) throw new Error("Failed to fetch branches.");
        const data: Branch[] = await response.json();
        setBranches(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  async function handleAddBranch() {
    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch),
      });
      if (!response.ok) throw new Error("Failed to add branch.");
      const addedBranch: Branch = await response.json();
      setBranches((prev) => [...prev, addedBranch]);
      setNewBranch({ name: "", address: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-4">Branches</h1>
      {loading ? (
        <p>Loading branches...</p>
      ) : error ? (
        <p className="text-[#C70039]">{error}</p>
      ) : branches.length === 0 ? (
        <p>No branches available.</p>
      ) : (
        <div className="grid gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-[#FFFFFF] rounded-3xl shadow-lg p-4">
              <h2 className="text-xl font-bold text-[#900C3F]">{branch.name}</h2>
              <p className="text-[#C70039]">{branch.address}</p>
              <div className="flex gap-2 mt-2">
                {branch.offers.map((offer, index) => (
                  <span key={index} className="px-2 py-1 rounded-full bg-[#900C3F] text-[#FFFFFF]">
                    {offer}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-2">Add New Branch</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Branch Name"
            value={newBranch.name}
            onChange={(e) => setNewBranch((prev) => ({ ...prev, name: e.target.value }))}
            className="border-2 border-[#900C3F] rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Branch Address"
            value={newBranch.address}
            onChange={(e) => setNewBranch((prev) => ({ ...prev, address: e.target.value }))}
            className="border-2 border-[#900C3F] rounded-lg px-3 py-2"
          />
          <button
            onClick={handleAddBranch}
            className="px-4 py-2 rounded-full bg-[#FF5733] text-[#FFFFFF] transition-all duration-200 ease-in-out hover:bg-[#FF6F61]"
          >
            Add Branch
          </button>
        </div>
      </div>
    </div>
  );
}
