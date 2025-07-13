"use client";
import { useState, createContext, useContext, ReactNode, useMemo } from "react";
// --- CHANGE 1: Import Eip1193Provider from ethers ---
import { ethers, BrowserProvider, Signer, Eip1193Provider } from "ethers";

// --- CHANGE 2: Use the specific Eip1193Provider type instead of 'any' ---
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

// Define the shape of our context data
interface Web3ContextType {
  account: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  connectWallet: () => Promise<void>;
}

// Create the context with a default null value
const Web3Context = createContext<Web3ContextType | null>(null);

// Create the Provider component
export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);

  // Function to connect the wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // The rest of this code works as is, because window.ethereum now has a proper type
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        const walletSigner = await browserProvider.getSigner();

        setProvider(browserProvider);
        setSigner(walletSigner);
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert("Failed to connect wallet. Please try again.");
      }
    } else {
      alert("Please install a web3 wallet like MetaMask.");
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      account,
      provider,
      signer,
      connectWallet,
    }),
    [account, provider, signer]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

// Custom hook to easily use our context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
