import React, { useEffect, useState } from "react";
import { Contract, BrowserProvider, parseEther } from "ethers";
import { contractABI, contractAddress } from "../utils/constant";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const createEthereumContract = async () => {
  if (!ethereum) throw new Error("Ethereum object not found");

  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  return new Contract(contractAddress, contractABI, signer);
};

export const TransactionsProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount") || 0
  );
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) throw new Error("Ethereum is not present");

      const transactionsContract = await createEthereumContract();
      const availableTransactions = await transactionsContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map((tx) => ({
        addressTo: tx.receiver,
        addressFrom: tx.sender,
        timestamp: new Date(tx.timestamp.toNumber() * 1000).toLocaleString(),
        message: tx.message,
        keyword: tx.keyword,
        amount: parseInt(tx.amount._hex, 16) / 10 ** 18,
      }));

      setTransactions(structuredTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");
  
      const accounts = await ethereum.request({ method: "eth_accounts" });
  
      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found. Wallet disconnected.");
        setCurrentAccount(""); // Reset the account when disconnected
      }
  
      // Listen for account changes (e.g., user disconnects or switches accounts)
      ethereum.on("accountsChanged", (newAccounts) => {
        if (newAccounts.length === 0) {
          console.log("Wallet disconnected.");
          setCurrentAccount(""); // Clear state
        } else {
          setCurrentAccount(newAccounts[0]); // Update to new account
          getAllTransactions(); // Fetch transactions for new account
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  

  const checkIfTransactionsExist = async () => {
    try {
      if (!ethereum) return;
      const provider = new BrowserProvider(ethereum);
      const transactionsContract = new Contract(contractAddress, contractABI, provider);
      console.log("Checking transactions...");
      console.log("Current transaction count:", transactionCount);
      console.log(transactionsContract);
      const currentTransactionCount = await transactionsContract.getTransactionCount();

      setTransactionCount(currentTransactionCount.toNumber()); // Update state
      localStorage.setItem("transactionCount", currentTransactionCount);
    } catch (error) {
      console.error("Error checking transactions:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");
      if (!currentAccount) return alert("Wallet is not connected. Please connect again.");
  
      const { addressTo, amount, keyword, message } = formData;
      const transactionsContract = createEthereumContract();
      const parsedAmount = parseEther(amount);
  
      const provider = new BrowserProvider(ethereum);
      const signer = provider.getSigner();
  
      const tx = (await signer).sendTransaction({
        from: currentAccount,
        to: addressTo,
        gas: "0x5208",
        value: parsedAmount._hex,
      });
  
      const transactionHash = await transactionsContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );
  
      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      console.log(`Success - ${transactionHash.hash}`);
      setIsLoading(false);
  
      const transactionsCount = await transactionsContract.getTransactionCount();
      setTransactionCount(transactionsCount.toNumber());
  
      window.location.reload();
    } catch (error) {
      console.log(error);
      throw new Error("Transaction failed.");
    }
  };
  

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, [transactionCount]);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
