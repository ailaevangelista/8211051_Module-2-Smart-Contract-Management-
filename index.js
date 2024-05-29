import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [depositAmount, setDepositAmount] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState(1);
  const [loading, setLoading] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (accounts) => {
    if (accounts.length > 0) {
      console.log("Account connected: ", accounts[0]);
      setAccount(accounts[0]);
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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const balance = await atm.getBalance();
      setBalance(balance.toNumber());
    }
  };

  const deposit = async () => {
    if (atm) {
      setLoading(true);
      try {
        const tx = await atm.deposit(depositAmount);
        await tx.wait();
        getBalance();
        setLoading(false);
      } catch (error) {
        console.error("Error depositing:", error);
        setLoading(false);
      }
    }
  };

  const withdraw = async () => {
    if (atm) {
      setLoading(true);
      try {
        const tx = await atm.withdraw(withdrawAmount);
        await tx.wait();
        getBalance();
        setLoading(false);
      } catch (error) {
        console.error("Error withdrawing:", error);
        setLoading(false);
      }
    }
  };

  const handleDepositInputChange = (event) => {
    setDepositAmount(event.target.value);
  };

  const handleWithdrawInputChange = (event) => {
    setWithdrawAmount(event.target.value);
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Metacrafters ATM!</h1>
      </header>
      <div className="content">
        {ethWallet && account ? (
          <div className="user-info">
            <p>Your Account: {account}</p>
            <p>Your Balance: {balance}</p>
          </div>
        ) : (
          <button className="connect-button" onClick={connectAccount}>
            Connect your Metamask wallet
          </button>
        )}
        <div className="transaction">
          <div className="deposit">
            <label htmlFor="depositAmount">Deposit Amount:</label>
            <input
              type="number"
              id="depositAmount"
              value={depositAmount}
              onChange={handleDepositInputChange}
              disabled={loading}
            />
            <button className="deposit-button" onClick={deposit} disabled={loading}>
              Deposit
            </button>
          </div>
          <div className="withdraw">
            <label htmlFor="withdrawAmount">Withdraw Amount:</label>
            <input
              type="number"
              id="withdrawAmount"
              value={withdrawAmount}
              onChange={handleWithdrawInputChange}
              disabled={loading}
            />
            <button className="withdraw-button" onClick={withdraw} disabled={loading}>
              Withdraw
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .container {
          text-align: center;
          padding: 20px;
          background-color: khaki; /* Khaki background */
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        header {
          color: #333;
          margin-bottom: 20px;
        }

        .content {
          background-color: #fff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          width: 300px;
        }

        .user-info {
          margin-bottom: 20px;
        }

        .connect-button {
          background-color: #007bff;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .connect-button:hover {
          background-color: #0056b3;
        }

        .transaction {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        label {
          font-weight: bold;
          margin-right: 10px;
        }

        input {
          padding: 8px;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: 100px;
          margin-bottom: 10px;
        }

        .deposit-button,
        .withdraw-button {
          background-color: #28a745;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .deposit-button:hover,
        .withdraw-button:hover {
          background-color: #218838;
        }

        .deposit-button:disabled,
        .withdraw-button:disabled {
          background-color: #ccc;
          color: #666;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}
