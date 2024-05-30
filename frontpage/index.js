import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

// Function to convert Ethereum to pesos
const convertToPeso = async (ethAmount) => {
  // Replace 'YOUR_API_KEY' with your actual API key
  const apiKey = 'YOUR_API_KEY';
  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=php&apiKey=${apiKey}`);
  const data = await response.json();
  const exchangeRate = data.ethereum.php;
  const pesoAmount = ethAmount * exchangeRate;
  return pesoAmount.toFixed(2); // round to 2 decimal places
};

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transactions, setTransactions] = useState([]);
  const [pesoBalance, setPesoBalance] = useState(undefined);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const ethBalance = (await atm.getBalance()).toNumber();
      setBalance(ethBalance);
      const pesoAmount = await convertToPeso(ethBalance);
      setPesoBalance(pesoAmount);
    }
  };

  const deposit = async () => {
    if (atm) {
      let tx = await atm.deposit(1);
      await tx.wait();
      getBalance();
      addTransaction("Deposit", 1);
    }
  };

  const withdraw = async () => {
    if (atm) {
      let tx = await atm.withdraw(1);
      await tx.wait();
      getBalance();
      addTransaction("Withdraw", -1);
    }
  };

  const addTransaction = (type, amount) => {
    const newTransaction = { type, amount, timestamp: new Date().toLocaleString() };
    setTransactions([newTransaction, ...transactions]);
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount} className="connect-btn">Connect Metamask Wallet</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div className="user-details">
        <p className="account">Your Account: {account}</p>
        <p className="balance">Your Balance: {balance} ETH ({pesoBalance} PHP)</p>
        <div className="transaction-btns">
          <button onClick={deposit} className="deposit-btn">Deposit 1 ETH</button>
          <button onClick={withdraw} className="withdraw-btn">Withdraw 1 ETH</button>
        </div>
        <h2>Transaction History</h2>
        <ul className="transaction-list">
          {transactions.map((transaction, index) => (
            <li key={index} className="transaction-item">
              <span className="timestamp">{transaction.timestamp}</span>: {transaction.type} {Math.abs(transaction.amount)} ETH
            </li>
          ))}
        </ul>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <div className="full-screen">
      <main className="container">
        <header>
          <h1>Welcome to the Metacrafters ATM!</h1>
        </header>
        {initUser()}
      </main>
      <style jsx global>{`
        body {
          margin: 0; /* Remove default margin */
          padding: 0; /* Remove default padding */
          background-color: black; /* Set background color to black for the entire screen */
        }
        .full-screen {
          min-height: 100vh; /* Make sure the container covers the entire viewport height */
          display: flex; /* Use flexbox to center content vertically */
          justify-content: center; /* Center content horizontally */
          align-items: center; /* Center content vertically */
        }
        .container {
          text-align: center;
          color: white;
          font-family: Cambria, serif;
          padding: 20px;
        }
        .connect-btn, .deposit-btn, .withdraw-btn {
          background-color: #ffc107; /* Yellow color */
          color: black; /* Black text color */
          border: none;
          padding: 10px 20px;
          border-radius: 20px; /* Rounded corners */
          cursor: pointer;
          font-family: Cambria, serif;
          font-size: 16px;
          margin: 0 10px;
        }
        .connect-btn:hover, .deposit-btn:hover, .withdraw-btn:hover {
          background-color: #ffa000; /* Darker yellow on hover */
        }
        .user-details {
          margin-top: 20px;
        }
        .account {
          font-size: 18px;
          color: #fff;
          margin-bottom: 10px;
        }
        .balance {
          font-size: 16px;
          color: #fff;
          margin-bottom: 20px;
        }
        .transaction-btns {
          margin-top: 20px;
        }
        .transaction-list {
          list-style-type: none;
          padding: 0;
          text-align: center; /* Center text in the list */
          margin-top: 20px; /* Add margin at the top */
        }
        .transaction-item {
          margin-top: 10px;
          font-size: 14px;
          color: #ccc;
        }
        .timestamp {
          color: #888;
          margin-right: 5px;
        }
      `}</style>
    </div>
  );

}
