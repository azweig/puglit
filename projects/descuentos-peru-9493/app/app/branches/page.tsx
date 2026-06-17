"use client";

import { useEffect, useState } from "react";

interface Branch {
  id: number;
  name: string;
  address: string;
  contact: string;
}

const BranchesPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState<{ name: string; address: string; contact: string }>({
    name: "",
    address: "",
    contact: ""
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("/api/branches");
        if (!response.ok) throw new Error("Failed to fetch branches.");
        const data: Branch[] = await response.json();
        setBranches(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

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
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newBranch)
      });
      if (!response.ok) throw new Error("Failed to add branch.");
      const addedBranch: Branch = await response.json();
      setBranches((prev) => [...prev, addedBranch]);
      setNewBranch({ name: "", address: "", contact: "" });
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="p-4 bg-[#FFFFFF] min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-[#212121]">Branches</h1>
      {loading ? (
        <p className="text-[#212121]">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-3xl shadow-lg bg-[#FFCCBC] p-4">
              <h2 className="text-lg font-semibold text-[#212121]">{branch.name}</h2>
              <p className="text-[#212121]">{branch.address}</p>
              <p className="text-[#212121]">Contact: {branch.contact}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2 text-[#212121]">Add New Branch</h2>
        <input
          type="text"
          name="name"
          value={newBranch.name}
          onChange={handleInputChange}
          placeholder="Branch Name"
          className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] mb-2 w-full"
        />
        <input
          type="text"
          name="address"
          value={newBranch.address}
          onChange={handleInputChange}
          placeholder="Branch Address"
          className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] mb-2 w-full"
        />
        <input
          type="text"
          name="contact"
          value={newBranch.contact}
          onChange={handleInputChange}
          placeholder="Contact Information"
          className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] mb-4 w-full"
        />
        <button
          onClick={handleAddBranch}
          className="bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300"
        >
          Add Branch
        </button>
      </div>
    </div>
  );
};

export default BranchesPage;
