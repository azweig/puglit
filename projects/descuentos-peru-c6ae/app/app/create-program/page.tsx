"use client";

import { useState } from "react";

export default function CreateProgram() {
  const [step, setStep] = useState(1);
  const [programName, setProgramName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: programName,
          description,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create program");
      }
      setProgramName("");
      setDescription("");
      setStep(1);
      alert("Program created successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-6">
      <h1 className="text-3xl font-bold mb-6">Create Program</h1>
      <div className="flex justify-between items-center mb-4">
        <div className={`w-1/3 h-2 ${step >= 1 ? 'bg-[#900C3F]' : 'bg-[#FFC300]'}`}></div>
        <div className={`w-1/3 h-2 ${step >= 2 ? 'bg-[#900C3F]' : 'bg-[#FFC300]'}`}></div>
        <div className={`w-1/3 h-2 ${step >= 3 ? 'bg-[#900C3F]' : 'bg-[#FFC300]'}`}></div>
      </div>
      {step === 1 && (
        <div className="mb-6">
          <label className="block font-medium mb-2">Program Name</label>
          <input
            type="text"
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
          />
        </div>
      )}
      {step === 2 && (
        <div className="mb-6">
          <label className="block font-medium mb-2">Description</label>
          <textarea
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      )}
      {step === 3 && (
        <div className="mb-6">
          <p className="font-medium">Review your program details:</p>
          <p className="mt-2"><strong>Name:</strong> {programName || "Not provided"}</p>
          <p className="mt-2"><strong>Description:</strong> {description || "Not provided"}</p>
        </div>
      )}
      {error && <p className="text-[#FFC300] mb-4">{error}</p>}
      <div className="flex justify-between">
        {step > 1 && (
          <button
            className="bg-[#C70039] text-[#FFFFFF] font-medium py-2 px-5 rounded-full shadow-sm"
            onClick={handlePrevious}
          >
            Previous
          </button>
        )}
        {step < 3 ? (
          <button
            className="bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105"
            onClick={handleNext}
          >
            Next
          </button>
        ) : (
          <button
            className="bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
