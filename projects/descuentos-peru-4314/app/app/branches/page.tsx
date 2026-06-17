"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Branch {
  branch_id: number;
  name: string;
  address: string;
  distance_km: number;
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [branchAddress, setBranchAddress] = useState<string>('');

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch('/api/branches');
        if (!response.ok) throw new Error('Failed to fetch branches');
        const data = await response.json();
        setBranches(data ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, []);

  const handleCreateBranch = async () => {
    if (!branchName || !branchAddress) return;
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: branchName, address: branchAddress }),
      });
      if (!response.ok) throw new Error('Failed to create branch');
      const newBranch = await response.json();
      setBranches((prev) => [...prev, newBranch]);
      setBranchName('');
      setBranchAddress('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen p-4">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#333333]">Branches</h1>
        <nav className="space-x-4">
          <Link href="/app" className="text-[#900C3F] hover:underline">Descubrir</Link>
          <Link href="/app/memberships" className="text-[#900C3F] hover:underline">Mis Programas</Link>
          <Link href="/app/location" className="text-[#900C3F] hover:underline">Ubicación</Link>
        </nav>
      </header>

      <main className="pt-20">
        <div className="bg-[#FFC300] rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">Create a New Branch</h2>
          <input
            type="text"
            placeholder="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="border border-[#C70039] rounded-md p-2 mb-2 w-full focus:outline-none focus:border-[#FF5733]"
          />
          <input
            type="text"
            placeholder="Branch Address"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
            className="border border-[#C70039] rounded-md p-2 mb-2 w-full focus:outline-none focus:border-[#FF5733]"
          />
          <button
            onClick={handleCreateBranch}
            className="bg-[#FF5733] text-white py-2 px-4 rounded-md hover:bg-[#C70039] transition duration-200 ease-in-out"
          >
            Add Branch
          </button>
        </div>

        {loading ? (
          <p className="text-center text-[#333333]">Loading branches...</p>
        ) : error ? (
          <p className="text-center text-[#FF5733]">{error}</p>
        ) : branches.length === 0 ? (
          <p className="text-center text-[#333333]">No branches available.</p>
        ) : (
          <ul className="space-y-4">
            {branches.map((branch) => (
              <li key={branch.branch_id} className="rounded-lg shadow-md bg-[#FFC300] p-4">
                <h3 className="text-xl font-bold text-[#333333]">{branch.name}</h3>
                <p className="text-[#333333]">{branch.address}</p>
                <p className="text-[#333333]">Distance: {branch.distance_km.toFixed(2)} km</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
