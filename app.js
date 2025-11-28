// app.js - GameVinMon dApp logic
// Network: Monad (chainId 143)
// Token VIN: 0x09166bFA4a40BAbC19CCCEc6A6154d9c058098EC
// Swap: 0xCdce3485752E7a7D4323f899FEe152D9F27e890B
// Dice: 0xE9Ed2c2987da0289233A1a1AE24438A314Ad6B2f

(() => {
  const RPC_URL = "https://rpc.monad.xyz";
  const MONAD_CHAIN_ID_DEC = 143;
  const MONAD_CHAIN_ID_HEX = "0x8f"; // 143 in hex

  const VIN_TOKEN_ADDRESS = "0x09166bFA4a40BAbC19CCCEc6A6154d9c058098EC";
  const SWAP_CONTRACT_ADDRESS = "0xCdce3485752E7a7D4323f899FEe152D9F27e890B";
  const DICE_CONTRACT_ADDRESS = "0xE9Ed2c2987da0289233A1a1AE24438A314Ad6B2f";

  const VIN_DECIMALS = 18;

  // ===== ABIs =====
  const VIN_TOKEN_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "allowance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientAllowance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSpender",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const SWAP_CONTRACT_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_vinToken",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "monIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "vinOut",
          "type": "uint256"
        }
      ],
      "name": "SwapMonForVin",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "vinIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "monOut",
          "type": "uint256"
        }
      ],
      "name": "SwapVinForMon",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "getMonReserve",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVinReserve",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "swapMonForVin",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "vinAmount",
          "type": "uint256"
        }
      ],
      "name": "swapVinForMon",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "vinToken",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ];

  const DICE_CONTRACT_ABI = [
    {
      "inputs": [
        {
          "internalType": "contract IERC20",
          "name": "_vin",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "guessEven",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "resultEven",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "win",
          "type": "bool"
        }
      ],
      "name": "Played",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "MIN_BET",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "bankroll",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "guessEven",
          "type": "bool"
        }
      ],
      "name": "play",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "vin",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // ===== Global state =====
  let readProvider = null;      // JsonRpcProvider (read-only)
  let web3Provider = null;      // Web3Provider from MetaMask
  let signer = null;
  let currentAccount = null;

  let vinRead = null;
  let vinWrite = null;
  let swapRead = null;
  let swapWrite = null;
  let diceRead = null;
  let diceWrite = null;

  // Cache balances
  let vinBalanceBN = null;
  let monBalanceBN = null;

  // Swap direction: 'vin-to-mon' or 'mon-to-vin'
  let swapDirection = "vin-to-mon";

  // Dice state
  let lastDiceBetInput = null; // the last bet amount user used
  let lastDiceGame = null;     // last game result in this session
  let currentGuessEven = true; // true = Even, false = Odd

  // ===== DOM helpers =====
  function $(id) {
    return document.getElementById(id);
  }

  function shortenAddress(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function setNetworkDot(status) {
    // status: "disconnected" | "wrong" | "ok"
    const indicator = document.querySelector(".network-indicator .dot");
    if (!indicator) return;
    if (status === "ok") {
      indicator.style.background = "#22c55e"; // green
    } else if (status === "wrong") {
      indicator.style.background = "#f97316"; // orange
    } else {
      indicator.style.background = "#9ca3af"; // gray
    }
  }

  function formatVin(bn) {
    if (!bn) return "-";
    try {
      const v = ethers.utils.formatUnits(bn, VIN_DECIMALS);
      const num = Number(v);
      if (num === 0) return "0";
      if (num < 0.0001) return "<0.0001";
      return num.toFixed(4);
    } catch {
      return "-";
    }
  }

  function formatMon(bn) {
    if (!bn) return "-";
    try {
      const v = ethers.utils.formatEther(bn);
      const num = Number(v);
      if (num === 0) return "0";
      if (num < 0.0001) return "<0.0001";
      return num.toFixed(4);
    } catch {
      return "-";
    }
  }

  // ===== Screen navigation =====
  function showScreen(screenId) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((s) => s.classList.remove("screen-active"));

    const target = $(screenId);
    if (target) {
      target.classList.add("screen-active");
    }

    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((btn) => {
      if (btn.dataset.screenTarget === screenId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function goHome() {
    showScreen("home-screen");
  }
  function goSwap() {
    showScreen("swap-screen");
  }
  function goDice() {
    showScreen("dice-screen");
  }

  // ===== Init read-only provider =====
  function initReadProvider() {
    if (typeof ethers === "undefined") {
      console.error("Ethers.js library is not loaded.");
      alert("Ethers.js library is not loaded. Please check your internet connection or the script tag.");
      return;
    }
    readProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
    vinRead = new ethers.Contract(VIN_TOKEN_ADDRESS, VIN_TOKEN_ABI, readProvider);
    swapRead = new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_CONTRACT_ABI, readProvider);
    diceRead = new ethers.Contract(DICE_CONTRACT_ADDRESS, DICE_CONTRACT_ABI, readProvider);

    // Load MIN_BET & pool for Dice
    loadMinBet();
    refreshDicePool();
  }

  async function loadMinBet() {
    const el = $("diceMinInfo");
    if (!diceRead || !el) return;

    try {
      el.textContent = "Loading minimum bet from contract...";
      const minBetBN = await diceRead.MIN_BET();
      const minBetStr = ethers.utils.formatUnits(minBetBN, VIN_DECIMALS);
      el.textContent = `Minimum bet: ${Number(minBetStr).toFixed(4)} VIN`;
    } catch (err) {
      console.error("Error loading MIN_BET:", err);
      el.textContent = "Minimum bet: failed to load, please try again.";
    }
  }

  async function refreshDicePool() {
    const el = $("dicePoolVin");
    if (!diceRead || !el) return;

    try {
      el.textContent = "Loading...";
      const poolBN = await diceRead.bankroll();
      const poolStr = ethers.utils.formatUnits(poolBN, VIN_DECIMALS);
      el.textContent = `${Number(poolStr).toFixed(4)} VIN`;
    } catch (err) {
      console.error("Error loading bankroll:", err);
      el.textContent = "N/A";
    }
  }

  function updateDicePlayerInfo() {
    if (!currentAccount) {
      setText("diceWalletAddressShort", "Not connected");
      setText("diceVinBalance", "-");
      setText("diceMonBalance", "-");
      return;
    }
    setText("diceWalletAddressShort", shortenAddress(currentAccount));
    setText("diceVinBalance", `${formatVin(vinBalanceBN)} VIN`);
    setText("diceMonBalance", `${formatMon(monBalanceBN)} MON`);
  }

  // ===== Connect wallet =====
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask (or compatible wallet) is not installed.");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      signer = web3Provider.getSigner();

      const network = await web3Provider.getNetwork();
      if (network.chainId !== MONAD_CHAIN_ID_DEC) {
        setNetworkDot("wrong");
        setText("networkName", `Wrong network (chainId ${network.chainId})`);
        setText("networkNameHome", `Wrong network (chainId ${network.chainId})`);

        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MONAD_CHAIN_ID_HEX }]
          });
        } catch (switchError) {
          console.warn("User did not switch network:", switchError);
          alert("Please switch MetaMask to Monad Mainnet (chainId 143).");
        }
      }

      const accounts = await web3Provider.listAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts");
      }

      currentAccount = accounts[0];

      // Init write contracts
      vinWrite = new ethers.Contract(VIN_TOKEN_ADDRESS, VIN_TOKEN_ABI, signer);
      swapWrite = new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_CONTRACT_ABI, signer);
      diceWrite = new ethers.Contract(DICE_CONTRACT_ADDRESS, DICE_CONTRACT_ABI, signer);

      // Update UI
      setText("walletAddressShort", shortenAddress(currentAccount));
      setText("networkName", "Connected (Monad)");
      setText("networkNameHome", "Connected (Monad)");
      setNetworkDot("ok");
      $("connectButton").textContent = "Connected";

      await refreshBalances();
      await refreshDicePool();

      // Listen to wallet events
      setupWalletEventListeners();
    } catch (err) {
      console.error("Error connecting wallet:", err);
      alert("Failed to connect wallet. See console for details.");
    }
  }

  function setupWalletEventListeners() {
    if (!window.ethereum) return;

    window.ethereum.removeAllListeners && window.ethereum.removeAllListeners("accountsChanged");
    window.ethereum.removeAllListeners && window.ethereum.removeAllListeners("chainChanged");

    window.ethereum.on("accountsChanged", async (accounts) => {
      if (!accounts || accounts.length === 0) {
        currentAccount = null;
        signer = null;
        vinWrite = null;
        swapWrite = null;
        diceWrite = null;
        setText("walletAddressShort", "Not connected");
        setText("vinBalance", "-");
        setText("monBalance", "-");
        setText("networkName", "Not connected");
        setText("networkNameHome", "Not connected");
        setNetworkDot("disconnected");
        $("connectButton").textContent = "Connect Wallet";

        setText("diceWalletAddressShort", "Not connected");
        setText("diceVinBalance", "-");
        setText("diceMonBalance", "-");
        return;
      }
      currentAccount = accounts[0];
      signer = web3Provider.getSigner();
      vinWrite = new ethers.Contract(VIN_TOKEN_ADDRESS, VIN_TOKEN_ABI, signer);
      swapWrite = new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_CONTRACT_ABI, signer);
      diceWrite = new ethers.Contract(DICE_CONTRACT_ADDRESS, DICE_CONTRACT_ABI, signer);
      setText("walletAddressShort", shortenAddress(currentAccount));
      await refreshBalances();
      await refreshDicePool();
    });

    window.ethereum.on("chainChanged", async (chainIdHex) => {
      const chainIdDec = parseInt(chainIdHex, 16);
      if (chainIdDec !== MONAD_CHAIN_ID_DEC) {
        setNetworkDot("wrong");
        setText("networkName", `Wrong network (chainId ${chainIdDec})`);
        setText("networkNameHome", `Wrong network (chainId ${chainIdDec})`);
      } else {
        setNetworkDot("ok");
        setText("networkName", "Connected (Monad)");
        setText("networkNameHome", "Connected (Monad)");
      }
      web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      signer = web3Provider.getSigner();
      vinWrite = new ethers.Contract(VIN_TOKEN_ADDRESS, VIN_TOKEN_ABI, signer);
      swapWrite = new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_CONTRACT_ABI, signer);
      diceWrite = new ethers.Contract(DICE_CONTRACT_ADDRESS, DICE_CONTRACT_ABI, signer);
      await refreshBalances();
      await refreshDicePool();
    });
  }

  // ===== Balances =====
  async function refreshBalances() {
    if (!currentAccount || !web3Provider) {
      setText("vinBalance", "-");
      setText("monBalance", "-");
      setText("fromBalanceLabel", "Balance: -");
      setText("toBalanceLabel", "Balance: -");
      updateDicePlayerInfo();
      return;
    }

    try {
      // VIN balance
      vinBalanceBN = await vinRead.balanceOf(currentAccount);
      setText("vinBalance", formatVin(vinBalanceBN));

      // MON native balance
      monBalanceBN = await web3Provider.getBalance(currentAccount);
      setText("monBalance", formatMon(monBalanceBN));

      updateSwapBalanceLabels();
      updateDicePlayerInfo();
    } catch (err) {
      console.error("Error refreshing balances:", err);
    }
  }

  function updateSwapBalanceLabels() {
    let fromLabel = "Balance: -";
    let toLabel = "Balance: -";

    if (swapDirection === "vin-to-mon") {
      fromLabel = `Balance: ${formatVin(vinBalanceBN)} VIN`;
      toLabel = `Balance: ${formatMon(monBalanceBN)} MON`;
    } else {
      fromLabel = `Balance: ${formatMon(monBalanceBN)} MON`;
      toLabel = `Balance: ${formatVin(vinBalanceBN)} VIN`;
    }

    setText("fromBalanceLabel", fromLabel);
    setText("toBalanceLabel", toLabel);
  }

  // ===== Swap logic =====
  function setSwapDirection(direction) {
    swapDirection = direction;

    const tabVinToMon = $("tabVinToMon");
    const tabMonToVin = $("tabMonToVin");
    const fromToken = $("swapFromToken");
    const toToken = $("swapToToken");

    if (direction === "vin-to-mon") {
      tabVinToMon.classList.add("active");
      tabMonToVin.classList.remove("active");
      fromToken.textContent = "VIN";
      toToken.textContent = "MON";
    } else {
      tabVinToMon.classList.remove("active");
      tabMonToVin.classList.add("active");
      fromToken.textContent = "MON";
      toToken.textContent = "VIN";
    }

    const fromInput = $("swapFromAmount");
    const toInput = $("swapToAmount");
    if (fromInput) fromInput.value = "";
    if (toInput) toInput.value = "";

    updateSwapBalanceLabels();
    setText("swapStatus", "Ready to swap.");
  }

  function onSwapAmountInput() {
    const fromInput = $("swapFromAmount");
    const toInput = $("swapToAmount");
    if (!fromInput || !toInput) return;

    const v = fromInput.value.trim();
    if (!v) {
      toInput.value = "";
      return;
    }
    toInput.value = v; // 1:1
  }

  function onSwapMax() {
    const fromInput = $("swapFromAmount");
    if (!fromInput) return;

    if (swapDirection === "vin-to-mon") {
      fromInput.value = vinBalanceBN
        ? ethers.utils.formatUnits(vinBalanceBN, VIN_DECIMALS)
        : "";
    } else {
      fromInput.value = monBalanceBN
        ? ethers.utils.formatEther(monBalanceBN)
        : "";
    }
    onSwapAmountInput();
  }

  async function onSwapAction() {
    if (!currentAccount || !signer || !vinWrite || !swapWrite) {
      alert("Please connect your wallet first.");
      return;
    }

    const fromInput = $("swapFromAmount");
    if (!fromInput) return;

    const raw = fromInput.value.trim();
    if (!raw || Number(raw) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const statusEl = $("swapStatus");
    try {
      if (swapDirection === "vin-to-mon") {
        // VIN -> MON
        const amountBN = ethers.utils.parseUnits(raw, VIN_DECIMALS);
        statusEl.textContent = "Checking VIN allowance...";

        const allowance = await vinWrite.allowance(currentAccount, SWAP_CONTRACT_ADDRESS);

        if (allowance.lt(amountBN)) {
          statusEl.textContent = "Sending approval transaction for VIN...";
          const txApprove = await vinWrite.approve(SWAP_CONTRACT_ADDRESS, amountBN);
          await txApprove.wait();
        }

        statusEl.textContent = "Swapping VIN for MON...";
        const tx = await swapWrite.swapVinForMon(amountBN);
        await tx.wait();

        statusEl.textContent = "Swap VIN → MON completed.";
      } else {
        // MON -> VIN
        const amountBN = ethers.utils.parseEther(raw);
        statusEl.textContent = "Swapping MON for VIN...";

        const tx = await swapWrite.swapMonForVin({
          value: amountBN
        });
        await tx.wait();

        statusEl.textContent = "Swap MON → VIN completed.";
      }

      await refreshBalances();
      await refreshDicePool();
      onSwapAmountInput();
    } catch (err) {
      console.error("Swap error:", err);
      statusEl.textContent = "Swap failed. See console for details.";
      alert("Swap failed. Please check console for details.");
    }
  }

  // ===== Dice logic =====
  function setGuess(isEven) {
    currentGuessEven = isEven;
    const btnEven = $("guessEvenButton");
    const btnOdd = $("guessOddButton");
    if (!btnEven || !btnOdd) return;

    if (isEven) {
      btnEven.classList.add("active");
      btnOdd.classList.remove("active");
    } else {
      btnEven.classList.remove("active");
      btnOdd.classList.add("active");
    }
  }

  function diceMax() {
    const input = $("diceBetAmount");
    if (!input) return;
    input.value = vinBalanceBN
      ? ethers.utils.formatUnits(vinBalanceBN, VIN_DECIMALS)
      : "";
  }

  function diceRepeat() {
    const input = $("diceBetAmount");
    if (!input || !lastDiceBetInput) return;
    input.value = lastDiceBetInput;
  }

  function diceHalf() {
    const input = $("diceBetAmount");
    if (!input || !input.value.trim()) return;
    const v = Number(input.value);
    if (!isFinite(v) || v <= 0) return;
    input.value = (v / 2).toString();
  }

  function diceDouble() {
    const input = $("diceBetAmount");
    if (!input || !input.value.trim()) return;
    const v = Number(input.value);
    if (!isFinite(v) || v <= 0) return;
    input.value = (v * 2).toString();
  }

  function diceClear() {
    const input = $("diceBetAmount");
    if (input) input.value = "";
  }

  function updateDiceLastResultUI() {
    if (!lastDiceGame) {
      setText("diceLastResult", "-");
      setText("diceLastOutcome", "-");
      setText("diceLastWinLoss", "-");
      setText("diceLastPayout", "-");
      return;
    }

    setText("diceLastResult", lastDiceGame.resultEven ? "Even" : "Odd");
    setText(
      "diceLastOutcome",
      lastDiceGame.guessEven ? "You guessed Even" : "You guessed Odd"
    );
    setText("diceLastWinLoss", lastDiceGame.win ? "Win" : "Lose");
    setText("diceLastPayout", lastDiceGame.payoutVin);
  }

  async function onDicePlay() {
    if (!currentAccount || !signer || !vinWrite || !diceWrite) {
      alert("Please connect your wallet first.");
      return;
    }

    const input = $("diceBetAmount");
    const statusEl = $("diceStatus");
    if (!input || !statusEl) return;

    const raw = input.value.trim();
    if (!raw || Number(raw) <= 0) {
      alert("Please enter a valid bet amount.");
      return;
    }

    try {
      const amountBN = ethers.utils.parseUnits(raw, VIN_DECIMALS);

      statusEl.textContent = "Checking VIN allowance for Dice...";
      const allowance = await vinWrite.allowance(currentAccount, DICE_CONTRACT_ADDRESS);
      if (allowance.lt(amountBN)) {
        statusEl.textContent = "Sending approval transaction for Dice...";
        const txApprove = await vinWrite.approve(DICE_CONTRACT_ADDRESS, amountBN);
        await txApprove.wait();
      }

      statusEl.textContent = "Sending Dice play transaction...";
      lastDiceBetInput = raw;

      const tx = await diceWrite.play(amountBN, currentGuessEven);
      const receipt = await tx.wait();

      statusEl.textContent = "Dice transaction confirmed. Updating result...";

      const iface = diceWrite.interface;
      let playedEvent = null;

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === "Played") {
            playedEvent = parsed;
            break;
          }
        } catch (_) {
          // Not a Dice log
        }
      }

      if (playedEvent) {
        const { player, amount, guessEven, resultEven, win } = playedEvent.args;
        const amountVinStr = Number(
          ethers.utils.formatUnits(amount, VIN_DECIMALS)
        ).toFixed(4);
        const payoutVinStr = win
          ? (Number(amountVinStr) * 2).toFixed(4)
          : "0.0000";

        lastDiceGame = {
          player,
          amountVin: amountVinStr + " VIN",
          guessEven,
          resultEven,
          win,
          payoutVin: payoutVinStr + " VIN"
        };

        updateDiceLastResultUI();
      } else {
        console.warn("No Played event found in transaction logs.");
      }

      statusEl.textContent = "Dice game completed. See last result on the right.";
      await refreshBalances();
      await refreshDicePool();
    } catch (err) {
      console.error("Dice play error:", err);
      statusEl.textContent = "Dice game failed. See console for details.";
      alert("Dice game failed. Please check console for details.");
    }
  }

  function onDiceRefreshLast() {
    if (!lastDiceGame) {
      alert("No game played in this session yet.");
      return;
    }
    updateDiceLastResultUI();
  }

  // ===== Init app =====
  function initApp() {
    if (typeof ethers === "undefined") {
      console.error("Ethers.js library is not loaded.");
      alert("Ethers.js library is not loaded. Please check your internet connection or the script tag.");
      return;
    }

    initReadProvider();
    setGuess(true); // default Even

    // Nav buttons
    const navHome = $("navHome");
    const navSwap = $("navSwap");
    const navDice = $("navDice");
    if (navHome) navHome.addEventListener("click", () => goHome());
    if (navSwap) navSwap.addEventListener("click", () => goSwap());
    if (navDice) navDice.addEventListener("click", () => goDice());

    // Hero buttons
    const goToSwapBtn = $("goToSwap");
    const goToDiceBtn = $("goToDice");
    if (goToSwapBtn) goToSwapBtn.addEventListener("click", () => goSwap());
    if (goToDiceBtn) goToDiceBtn.addEventListener("click", () => goDice());

    // Connect button
    const connectBtn = $("connectButton");
    if (connectBtn) connectBtn.addEventListener("click", connectWallet);

    // Refresh balances
    const refreshBtn = $("refreshBalances");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshBalances);

    // Swap tabs
    const tabVinToMon = $("tabVinToMon");
    const tabMonToVin = $("tabMonToVin");
    if (tabVinToMon) tabVinToMon.addEventListener("click", () => setSwapDirection("vin-to-mon"));
    if (tabMonToVin) tabMonToVin.addEventListener("click", () => setSwapDirection("mon-to-vin"));

    // Swap inputs
    const swapFromAmount = $("swapFromAmount");
    const swapMaxButton = $("swapMaxButton");
    if (swapFromAmount) swapFromAmount.addEventListener("input", onSwapAmountInput);
    if (swapMaxButton) swapMaxButton.addEventListener("click", onSwapMax);

    const swapActionButton = $("swapActionButton");
    if (swapActionButton) swapActionButton.addEventListener("click", onSwapAction);

    // Dice guess buttons
    const guessEvenBtn = $("guessEvenButton");
    const guessOddBtn = $("guessOddButton");
    if (guessEvenBtn) guessEvenBtn.addEventListener("click", () => setGuess(true));
    if (guessOddBtn) guessOddBtn.addEventListener("click", () => setGuess(false));

    // Dice tool buttons
    const diceMaxBtn = $("diceMaxButton");
    const diceRepeatBtn = $("diceRepeatButton");
    const diceHalfBtn = $("diceHalfButton");
    const diceDoubleBtn = $("diceDoubleButton");
    const diceClearBtn = $("diceClearButton");
    if (diceMaxBtn) diceMaxBtn.addEventListener("click", diceMax);
    if (diceRepeatBtn) diceRepeatBtn.addEventListener("click", diceRepeat);
    if (diceHalfBtn) diceHalfBtn.addEventListener("click", diceHalf);
    if (diceDoubleBtn) diceDoubleBtn.addEventListener("click", diceDouble);
    if (diceClearBtn) diceClearBtn.addEventListener("click", diceClear);

    // Dice play & refresh
    const dicePlayBtn = $("dicePlayButton");
    const diceRefreshLastBtn = $("diceRefreshLast");
    if (dicePlayBtn) dicePlayBtn.addEventListener("click", onDicePlay);
    if (diceRefreshLastBtn) diceRefreshLastBtn.addEventListener("click", onDiceRefreshLast);

    // Default
    showScreen("home-screen");
    setSwapDirection("vin-to-mon");
    setNetworkDot("disconnected");
    updateDicePlayerInfo();
  }

  document.addEventListener("DOMContentLoaded", initApp);
})();
