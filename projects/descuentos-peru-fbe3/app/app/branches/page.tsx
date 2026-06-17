"use client";

import { useEffect, useState } from "react";

interface Branch {
  branch_id: string;
  name: string;
  address: string;
  opening_hours: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    opening_hours: "",
  });

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch("/api/branches");
        if (!response.ok) throw new Error("Failed to fetch branches");
        const data: Branch[] = await response.json();
        setBranches(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBranch((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBranch = async () => {
    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBranch),
      });
      if (!response.ok) throw new Error("Failed to add branch");
      const addedBranch: Branch = await response.json();
      setBranches((prev) => [...prev, addedBranch]);
      setNewBranch({ name: "", address: "", opening_hours: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-6">Branches</h1>
      {loading ? (
        <p>Loading branches...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : branches.length === 0 ? (
        <p>No branches available.</p>
      ) : (
        <div className="grid gap-4">
          {branches.map((branch) => (
            <div
              key={branch.branch_id}
              className="rounded-3xl shadow-lg bg-[#900C3F] p-6 text-[#FFFFFF]"
            >
              <h2 className="text-xl font-bold">{branch.name}</h2>
              <p>{branch.address}</p>
              <p>{branch.opening_hours}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Add New Branch</h2>
        <input
          type="text"
          name="name"
          value={newBranch.name}
          onChange={handleInputChange}
          placeholder="Branch Name"
          className="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300 mb-2 w-full"
        />
        <input
          type="text"
          name="address"
          value={newBranch.address}
          onChange={handleInputChange}
          placeholder="Address"
          className="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300 mb-2 w-full"
        />
        <input
          type="text"
          name="opening_hours"
          value={newBranch.opening_hours}
          onChange={handleInputChange}
          placeholder="Opening Hours"
          className="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300 mb-4 w-full"
        />
        <button
          onClick={handleAddBranch}
          className="rounded-full bg-[#FF5733] text-[#FFFFFF] py-3 px-6 font-bold hover:bg-[#C70039] transition-colors duration-300"
        >
          Add Branch
        </button>
      </div>
    </div>
  );
}
