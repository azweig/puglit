"use client";

import { useEffect, useState } from "react";

interface Branch {
  branch_id: number;
  name: string;
  address: string;
  phone?: string;
}

const BranchesPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState<{ name: string; address: string; phone?: string }>({ name: "", address: "", phone: "" });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("/api/branches");
        if (!response.ok) throw new Error("Failed to fetch branches");
        const data = await response.json();
        setBranches(data ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const addBranch = async () => {
    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch),
      });
      if (!response.ok) throw new Error("Failed to add branch");
      const addedBranch = await response.json();
      setBranches((prev) => [...prev, addedBranch]);
      setNewBranch({ name: "", address: "", phone: "" });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF] p-4">
      <h1 className="text-2xl font-bold mb-4">Branches</h1>
      {loading ? (
        <p>Loading branches...</p>
      ) : error ? (
        <p className="text-[#C70039]">{error}</p>
      ) : branches.length === 0 ? (
        <p>No branches available.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {branches.map((branch) => (
            <div key={branch.branch_id} className="bg-[#FFFFFF] text-[#581845] p-4 rounded-3xl shadow-lg">
              <h2 className="font-bold text-lg">{branch.name}</h2>
              <p>{branch.address}</p>
              {branch.phone && <p>{branch.phone}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Add New Branch</h2>
        <input
          type="text"
          placeholder="Branch Name"
          value={newBranch.name}
          onChange={(e) => setNewBranch((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full mb-2 rounded-md border border-[#C70039] bg-[#FFFFFF] text-[#581845] px-3 py-2 focus:border-[#FF5733]"
        />
        <input
          type="text"
          placeholder="Address"
          value={newBranch.address}
          onChange={(e) => setNewBranch((prev) => ({ ...prev, address: e.target.value }))}
          className="w-full mb-2 rounded-md border border-[#C70039] bg-[#FFFFFF] text-[#581845] px-3 py-2 focus:border-[#FF5733]"
        />
        <input
          type="text"
          placeholder="Phone (optional)"
          value={newBranch.phone}
          onChange={(e) => setNewBranch((prev) => ({ ...prev, phone: e.target.value }))}
          className="w-full mb-2 rounded-md border border-[#C70039] bg-[#FFFFFF] text-[#581845] px-3 py-2 focus:border-[#FF5733]"
        />
        <button
          onClick={addBranch}
          className="rounded-full bg-[#FF5733] text-[#FFFFFF] px-4 py-2 hover:bg-[#C70039] transition-all duration-200 ease-in-out"
        >
          Add Branch
        </button>
      </div>
    </div>
  );
};

export default BranchesPage;
