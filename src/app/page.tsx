"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/Context/Web3Context";
import { contractAddress, contractABI } from "@/config";

export default function Home() {
  const [name, setName] = useState("");
  const [twitter, setTwitter] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    twitter: string;
    score: string;
  } | null>(null);

  const { account, signer, provider, connectWallet } = useWeb3();

  useEffect(() => {
    if (!provider || !account) return;

    console.log("✅ Setting up event listener for account:", account);

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    const handleScoredEvent = (
      user: string,
      name: string,
      twitter: string,
      score: bigint
    ) => {
      // We add a check here to ensure we only update the UI for the correct user
      if (user.toLowerCase() === account.toLowerCase()) {
        console.log("🔥 Scored event received for our user!", {
          user,
          name,
          twitter,
          score: score.toString(),
        });

        setResult({
          name: name,
          twitter: twitter,
          score: score.toString(),
        });
        setStatus("✅ Success! Random number received.");
      } else {
        console.log("Ignoring event for a different user:", user);
      }
    };

    // --- DEBUGGING FIX: REMOVE THE FILTER ---
    // We listen for all "Scored" events. This bypasses any potential
    // issues with address checksums or filter mismatches.
    console.log(
      ">>>>> DEBUG: Listening for ALL 'Scored' events to bypass the filter. <<<<<"
    );
    contract.on("Scored", handleScoredEvent);

    // Make sure the cleanup function matches the listener we set up.
    return () => {
      console.log("🧹 Cleaning up generic 'Scored' event listener.");
      contract.off("Scored", handleScoredEvent);
    };
  }, [provider, account]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    setResult(null);
    setStatus("1/4: Preparing transaction...");
    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setStatus("2/4: Please approve the transaction in your wallet...");
      const tx = await contract.requestScore(name, twitter);
      setStatus("3/4: Transaction sent! Waiting for it to be mined...");
      await tx.wait();
      setStatus(
        "4/4: Transaction mined! Waiting for Chainlink VRF... (This can take a few minutes)"
      );
    } catch (err: unknown) {
      console.error("Transaction failed:", err);
      const errorMessage =
        (err as { reason?: string; message?: string }).reason ||
        (err as Error).message ||
        "An unknown error occurred.";
      setStatus(`❌ Error: ${errorMessage}`);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-md mx-auto p-8 bg-white border border-gray-200 rounded shadow-lg pt-20 text-gray-900">
        <div className="flex justify-end mb-4">
          {account ? (
            <p className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-mono">
              Connected: {truncateAddress(account)}
            </p>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <h1 className="text-2xl mb-4 font-bold">Get Your Random Score</h1>
        <p className="text-gray-600 mb-6">
          Submit your details to get a random score from 1-100 powered by
          Chainlink VRF.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium">
              Name
            </label>
            <input
              id="name"
              className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!account}
            />
          </div>
          <div>
            <label htmlFor="twitter" className="block mb-1 font-medium">
              Twitter Handle
            </label>
            <input
              id="twitter"
              className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              required
              disabled={!account}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            disabled={!account || status?.includes("Waiting")}
          >
            Submit to Contract
          </button>
        </form>
        {status && <p className="mt-4 text-sm font-semibold">{status}</p>}

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-xl font-bold text-green-800">Your Score!</h2>
            <div className="mt-2 space-y-1 text-gray-700">
              <p>
                <strong>Name:</strong> {result.name}
              </p>
              <p>
                <strong>Twitter:</strong> {result.twitter}
              </p>
              <p className="text-2xl font-mono bg-gray-100 p-2 text-center rounded">
                <strong>Random Score:</strong> {result.score}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <div className="w-64 h-32 overflow-hidden rounded">
          <img
            src="/chainlinkvrf.gif"
            alt="Chainlink VRF"
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center" }}
          />
        </div>
      </div>
    </div>
  );
}
