// app.js – GameVinMon
// Swap MON ↔ VIN (1:1) + VIN Dice (Even / Odd)
// Requirements: MetaMask + Monad network (chainId = 143)
// Uses ethers.js v5.7.2 (already loaded in index.html)

;(function () {
  "use strict";

  // ==========================
  //  Config & Constants
  // ==========================

  const MONAD_CHAIN_ID_HEX = "0x8f"; // 143 decimal
  const MONAD_CHAIN_ID_DEC = 143;

  const RPC_URL = "https://rpc.monad.xyz"; // read-only provider

  // Contract addresses (must match index.html)
  const VIN_TOKEN_ADDRESS =
    "0x09166bFA4a40BAbC19CCCEc6A6154d9c058098EC";
  const SWAP_CONTRACT_ADDRESS =
    "0xCdce3485752E7a7D4323f899FEe152D9F27e890B";
  const DICE_CONTRACT_ADDRESS =
    "0xE9Ed2c2987da0289233A1a1AE24438A314Ad6B2f";

  // VIN has 18 decimals
  const VIN_DECIMALS = 18;

  // Minimum Dice bet (VIN)
  const DICE_MIN_BET_VIN = "0.01";

  // Swap directions
  const DIRECTION_MON_TO_VIN = "MON_TO_VIN";
  const DIRECTION_VIN_TO_MON = "VIN_TO_MON";

  let swapDirection = DIRECTION_MON_TO_VIN;

  // ethers objects
  const readProvider = new ethers.providers.JsonRpcProvider(
    RPC_URL,
    MONAD_CHAIN_ID_DEC
  );
  let provider = null; // Web3Provider from MetaMask
  let signer = null;
  let currentAccount = null;

  // ==========================
  //  ABIs
  // ==========================

  // Minimal ERC20 ABI
  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  ];

  // Swap contract similar to VIN/BNB fixed rate:
  // - swapBNBForVIN() payable     => here treat "BNB" as MON (native token)
  // - swapVINForBNB(uint256)      => VIN -> MON
  const SWAP_ABI = [
    "function VIN_TO_BNB_RATE() view returns (uint256)",
    "function RATE_DIVISOR() view returns (uint256)",
    "function swapBNBForVIN() payable", // MON -> VIN
    "function swapVINForBNB(uint256 vinAmount)", // VIN -> MON
    "function depositVIN(uint256 amount)",
    "function withdrawVIN(uint256 amount)",
    "function depositBNB() payable",
    "function withdrawBNB(uint256 amount)",
  ];

  // Dice contract (VIN) – assumed interface:
  //   bet(bool isEven, uint256 amount)
  //   event BetResult(address player, bool isEven, uint256 amount, bool won, uint256 payout)
  const DICE_ABI = [
    "function bet(bool isEven, uint256 amount) external",
    "event BetResult(address indexed player, bool isEven, uint256 amount, bool won, uint256 payout)",
  ];

  // ==========================
  //  DOM Elements
  // ==========================

  const els = {};

  function cacheDom() {
    // Top nav
    els.networkStatus = document.getElementById("networkStatus");
    els.networkName = document.getElementById("networkName");
    els.connectButton = document.getElementById("connectButton");

    // Info bar
    els.vinPriceUsd = document.getElementById("vinPriceUsd");

    // Views
    els.views = {
      home: document.getElementById("home-view"),
      swap: document.getElementById("swap-view"),
      dice: document.getElementById("dice-view"),
    };

    // Buttons that switch views (data-view="home|swap|dice")
    els.viewButtons = document.querySelectorAll("[data-view]");

    // Token info buttons
    els.copyVinAddress = document.getElementById("copyVinAddress");
    els.addVinToMetamask = document.getElementById("addVinToMetamask");

    // Swap view
    els.fromTokenIcon = document.getElementById("fromTokenIcon");
    els.fromTokenSymbol = document.getElementById("fromTokenSymbol");
    els.toTokenIcon = document.getElementById("toTokenIcon");
    els.toTokenSymbol = document.getElementById("toTokenSymbol");

    els.fromAmount = document.getElementById("fromAmount");
    els.toAmount = document.getElementById("toAmount");
    els.maxFromButton = document.getElementById("maxFromButton");
    els.fromBalance = document.getElementById("fromBalance");
    els.toBalance = document.getElementById("toBalance");

    els.swapRateText = document.getElementById("swapRateText");
    els.switchDirection = document.getElementById("switchDirection");
    els.approveButton = document.getElementById("approveButton");
    els.swapButton = document.getElementById("swapButton");
    els.swapStatus = document.getElementById("swapStatus");

    els.monReserve = document.getElementById("monReserve");
    els.vinReserve = document.getElementById("vinReserve");

    // Dice view
    els.vinBalance = document.getElementById("vinBalance");
    els.diceBankroll = document.getElementById("diceBankroll");
    els.diceAmount = document.getElementById("diceAmount");
    els.minBetText = document.getElementById("minBetText");
    els.betEvenButton = document.getElementById("betEvenButton");
    els.betOddButton = document.getElementById("betOddButton");
    els.diceStatus = document.getElementById("diceStatus");
    els.diceLastResult = document.getElementById("diceLastResult");
  }

  // ==========================
  //  Helpers
  // ==========================

  function formatAddress(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  function formatAmount(value, decimals = 4) {
    if (value == null || value === "–") return "–";
    const num = Number(value);
    if (!isFinite(num)) return "–";
    if (num === 0) return "0";
    if (num < 10 ** -decimals) return "<" + 10 ** -decimals;
    return num.toFixed(decimals);
  }

  function setStatus(el, msg, isError = false) {
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = isError ? "#b91c1c" : "#6b7280";
  }

  function getVinContract(readOnly = false) {
    const base = readOnly || !signer ? readProvider : signer;
    return new ethers.Contract(VIN_TOKEN_ADDRESS, ERC20_ABI, base);
  }

  function getSwapContract(readOnly = false) {
    const base = readOnly || !signer ? readProvider : signer;
    return new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_ABI, base);
  }

  function getDiceContract(readOnly = false) {
    const base = readOnly || !signer ? readProvider : signer;
    return new ethers.Contract(DICE_CONTRACT_ADDRESS, DICE_ABI, base);
  }

  // ==========================
  //  View Handling
  // ==========================

  function showView(name) {
    Object.entries(els.views).forEach(([key, el]) => {
      if (!el) return;
      if (key === name) {
        el.classList.add("active-view");
        el.classList.remove("hidden-view");
      } else {
        el.classList.remove("active-view");
        el.classList.add("hidden-view");
      }
    });
  }

  // ==========================
  //  Wallet & Network
  // ==========================

  async function connectWallet() {
    if (!window.ethereum) {
      alert(
        "MetaMask (or another EVM wallet) is not detected. Please install it first."
      );
      return;
    }

    try {
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const accounts = await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      currentAccount = ethers.utils.getAddress(accounts[0]);

      els.connectButton.textContent = formatAddress(currentAccount);

      await ensureMonadNetwork();
      await updateNetworkInfo();
      await refreshAllBalances();
    } catch (err) {
      console.error("connectWallet error:", err);
      alert("Failed to connect wallet. Please check the console for details.");
    }
  }

  async function ensureMonadNetwork() {
    if (!provider) return;
    const net = await provider.getNetwork();
    if (net.chainId === MONAD_CHAIN_ID_DEC) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_CHAIN_ID_HEX }],
      });
    } catch (switchErr) {
      console.warn("Network switch failed:", switchErr);
      // If Monad is not added to MetaMask yet, user must add it manually.
    }
  }

  async function updateNetworkInfo() {
    if (!provider) {
      els.networkName.textContent = "Not connected";
      return;
    }
    const net = await provider.getNetwork();
    if (net.chainId === MONAD_CHAIN_ID_DEC) {
      els.networkName.textContent = "Monad";
    } else {
      els.networkName.textContent = `Wrong network (chainId: ${net.chainId})`;
    }
  }

  function attachWalletEvents() {
    if (!window.ethereum) return;

    window.ethereum.on("accountsChanged", async (accounts) => {
      if (!accounts || accounts.length === 0) {
        currentAccount = null;
        signer = null;
        els.connectButton.textContent = "Connect Wallet";
        await refreshAllBalances();
        return;
      }
      currentAccount = ethers.utils.getAddress(accounts[0]);
      signer = provider.getSigner();
      els.connectButton.textContent = formatAddress(currentAccount);
      await refreshAllBalances();
    });

    window.ethereum.on("chainChanged", async () => {
      window.location.reload();
    });
  }

  // ==========================
  //  Price: VIN ≈ MON (via CoinGecko)
  // ==========================

  async function loadVinPriceEstimate() {
    // Try to fetch MON price from CoinGecko and treat VIN ≈ MON
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=monad&vs_currencies=usd"
      );
      if (!res.ok) throw new Error("Failed to fetch price");
      const data = await res.json();
      const price = data?.monad?.usd;
      if (typeof price === "number") {
        els.vinPriceUsd.textContent = `≈ ${price.toFixed(4)} USD (via MON)`;
      }
    } catch (err) {
      console.warn("loadVinPriceEstimate error:", err);
      // Keep default "– USD" if it fails
    }
  }

  // ==========================
  //  Copy & Add VIN to MetaMask
  // ==========================

  async function copyVinAddress() {
    try {
      await navigator.clipboard.writeText(VIN_TOKEN_ADDRESS);
      alert("VIN contract address copied to clipboard.");
    } catch (err) {
      console.warn("Clipboard error:", err);
      alert(
        "Failed to copy address. Please copy it manually:\n" +
          VIN_TOKEN_ADDRESS
      );
    }
  }

  async function addVinToMetaMask() {
    if (!window.ethereum) {
      alert("MetaMask is required to add VIN as a custom token.");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: VIN_TOKEN_ADDRESS,
            symbol: "VIN",
            decimals: VIN_DECIMALS,
            image: location.origin + "/vinlogo.png",
          },
        },
      });
    } catch (err) {
      console.error("addVinToMetaMask error:", err);
      alert("Failed to add VIN to MetaMask.");
    }
  }

  // ==========================
  //  Swap UI & Logic
  // ==========================

  function updateSwapDirectionUI() {
    if (swapDirection === DIRECTION_MON_TO_VIN) {
      els.fromTokenSymbol.textContent = "MON";
      els.fromTokenIcon.src = "mon24.png";
      els.fromTokenIcon.alt = "MON";

      els.toTokenSymbol.textContent = "VIN";
      els.toTokenIcon.src = "vin24.png";
      els.toTokenIcon.alt = "VIN";

      els.approveButton.classList.add("hidden");
      els.swapButton.textContent = "Swap MON → VIN";
      els.swapRateText.textContent = "1 MON = 1 VIN";
    } else {
      els.fromTokenSymbol.textContent = "VIN";
      els.fromTokenIcon.src = "vin24.png";
      els.fromTokenIcon.alt = "VIN";

      els.toTokenSymbol.textContent = "MON";
      els.toTokenIcon.src = "mon24.png";
      els.toTokenIcon.alt = "MON";

      els.approveButton.classList.remove("hidden");
      els.swapButton.textContent = "Swap VIN → MON";
      els.swapRateText.textContent = "1 VIN = 1 MON";
    }

    updateToAmountFromInput();
    refreshSwapSideBalances().catch(console.error);
  }

  function updateToAmountFromInput() {
    const val = els.fromAmount.value.trim();
    if (!val) {
      els.toAmount.value = "";
      return;
    }
    // Fixed 1:1 rate → mirror the value
    els.toAmount.value = val;
  }

  async function refreshPoolReserves() {
    try {
      const vin = getVinContract(true);
      const [vinBal, monBal] = await Promise.all([
        vin.balanceOf(SWAP_CONTRACT_ADDRESS),
        readProvider.getBalance(SWAP_CONTRACT_ADDRESS),
      ]);

      els.vinReserve.textContent = formatAmount(
        ethers.utils.formatUnits(vinBal, VIN_DECIMALS),
        4
      );
      els.monReserve.textContent = formatAmount(
        ethers.utils.formatEther(monBal),
        4
      );
    } catch (err) {
      console.warn("refreshPoolReserves error:", err);
      els.vinReserve.textContent = "–";
      els.monReserve.textContent = "–";
    }
  }

  async function refreshSwapSideBalances() {
    if (!currentAccount || !provider) {
      els.fromBalance.textContent = "–";
      els.toBalance.textContent = "–";
      return;
    }

    try {
      const vin = getVinContract();
      const [monBal, vinBal] = await Promise.all([
        provider.getBalance(currentAccount),
        vin.balanceOf(currentAccount),
      ]);

      const monStr = formatAmount(ethers.utils.formatEther(monBal), 4);
      const vinStr = formatAmount(
        ethers.utils.formatUnits(vinBal, VIN_DECIMALS),
        4
      );

      if (swapDirection === DIRECTION_MON_TO_VIN) {
        els.fromBalance.textContent = monStr;
        els.toBalance.textContent = vinStr;
      } else {
        els.fromBalance.textContent = vinStr;
        els.toBalance.textContent = monStr;
      }
    } catch (err) {
      console.warn("refreshSwapSideBalances error:", err);
      els.fromBalance.textContent = "–";
      els.toBalance.textContent = "–";
    }
  }

  async function handleMaxFrom() {
    if (!currentAccount || !provider) {
      alert("Please connect your wallet first.");
      return;
    }

    if (swapDirection === DIRECTION_MON_TO_VIN) {
      // Use ~95% of MON to keep some for gas
      const bal = await provider.getBalance(currentAccount);
      const balEth = parseFloat(ethers.utils.formatEther(bal));
      if (!isFinite(balEth) || balEth <= 0) return;
      const max = Math.max(balEth * 0.95, 0).toString();
      els.fromAmount.value = max;
    } else {
      // VIN: use full balance
      const vin = getVinContract();
      const bal = await vin.balanceOf(currentAccount);
      const vinVal = ethers.utils.formatUnits(bal, VIN_DECIMALS);
      els.fromAmount.value = vinVal;
    }

    updateToAmountFromInput();
  }

  async function ensureVinAllowance(spender, requiredAmountBig) {
    if (!currentAccount || !provider) {
      throw new Error("Wallet is not connected.");
    }
    const vin = getVinContract();
    const currentAllowance = await vin.allowance(currentAccount, spender);
    if (currentAllowance.gte(requiredAmountBig)) {
      return;
    }

    const tx = await vin.approve(spender, ethers.constants.MaxUint256);
    await tx.wait();
  }

  async function approveForCurrentSwap() {
    try {
      if (!currentAccount || !provider) {
        alert("Please connect your wallet first.");
        return;
      }
      if (swapDirection !== DIRECTION_VIN_TO_MON) return;

      const amountStr = els.fromAmount.value.trim();
      if (!amountStr || Number(amountStr) <= 0) {
        alert("Please enter the amount of VIN you want to swap.");
        return;
      }

      const amountBig = ethers.utils.parseUnits(amountStr, VIN_DECIMALS);
      setStatus(els.swapStatus, "Approving VIN for swap…");
      await ensureVinAllowance(SWAP_CONTRACT_ADDRESS, amountBig);
      setStatus(
        els.swapStatus,
        "Approve successful. You can now perform the swap."
      );
    } catch (err) {
      console.error("approveForCurrentSwap error:", err);
      setStatus(
        els.swapStatus,
        "Approve failed or was rejected by the user.",
        true
      );
    }
  }

  async function performSwap() {
    try {
      if (!currentAccount || !provider || !signer) {
        alert("Please connect your wallet first.");
        return;
      }

      const amountStr = els.fromAmount.value.trim();
      if (!amountStr || Number(amountStr) <= 0) {
        alert("Please enter a valid amount to swap.");
        return;
      }

      const swap = getSwapContract();
      setStatus(els.swapStatus, "Sending swap transaction…");

      if (swapDirection === DIRECTION_MON_TO_VIN) {
        // MON -> VIN
        const value = ethers.utils.parseEther(amountStr);
        const tx = await swap.swapBNBForVIN({ value });
        await tx.wait();
        setStatus(els.swapStatus, "Swap MON → VIN successful ✅");
      } else {
        // VIN -> MON
        const amountBig = ethers.utils.parseUnits(amountStr, VIN_DECIMALS);
        await ensureVinAllowance(SWAP_CONTRACT_ADDRESS, amountBig);

        const tx = await swap.swapVINForBNB(amountBig);
        await tx.wait();
        setStatus(els.swapStatus, "Swap VIN → MON successful ✅");
      }

      els.fromAmount.value = "";
      els.toAmount.value = "";

      await Promise.all([
        refreshSwapSideBalances(),
        refreshPoolReserves(),
        refreshVinBalanceOnly(),
      ]);
    } catch (err) {
      console.error("performSwap error:", err);
      setStatus(
        els.swapStatus,
        "Swap transaction failed or was rejected.",
        true
      );
    }
  }

  // ==========================
  //  Dice Logic
  // ==========================

  async function refreshVinBalanceOnly() {
    if (!currentAccount || !provider) {
      els.vinBalance.textContent = "–";
      return;
    }
    try {
      const vin = getVinContract();
      const bal = await vin.balanceOf(currentAccount);
      els.vinBalance.textContent = formatAmount(
        ethers.utils.formatUnits(bal, VIN_DECIMALS),
        4
      );
    } catch (err) {
      console.warn("refreshVinBalanceOnly error:", err);
      els.vinBalance.textContent = "–";
    }
  }

  async function refreshDiceBankroll() {
    try {
      const vin = getVinContract(true);
      const bal = await vin.balanceOf(DICE_CONTRACT_ADDRESS);
      els.diceBankroll.textContent = formatAmount(
        ethers.utils.formatUnits(bal, VIN_DECIMALS),
        4
      );
    } catch (err) {
      console.warn("refreshDiceBankroll error:", err);
      els.diceBankroll.textContent = "–";
    }
  }

  async function handleDiceBet(isEven) {
    try {
      if (!currentAccount || !provider || !signer) {
        alert("Please connect your wallet first.");
        return;
      }

      const amountStr = els.diceAmount.value.trim();
      if (!amountStr || Number(amountStr) <= 0) {
        alert("Please enter the VIN amount you want to bet.");
        return;
      }

      const minBet = parseFloat(DICE_MIN_BET_VIN);
      if (Number(amountStr) < minBet) {
        alert(`Minimum bet is ${DICE_MIN_BET_VIN} VIN.`);
        return;
      }

      const amountBig = ethers.utils.parseUnits(amountStr, VIN_DECIMALS);

      // Ensure VIN allowance for Dice
      const vin = getVinContract();
      const allowance = await vin.allowance(
        currentAccount,
        DICE_CONTRACT_ADDRESS
      );
      if (allowance.lt(amountBig)) {
        setStatus(els.diceStatus, "Approving VIN for Dice…");
        const approveTx = await vin.approve(
          DICE_CONTRACT_ADDRESS,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
      }

      const dice = getDiceContract();
      setStatus(els.diceStatus, "Sending bet transaction…");

      // bet(bool isEven, uint256 amount)
      const tx = await dice.bet(isEven, amountBig);
      const receipt = await tx.wait();

      let resultText = `Bet ${
        isEven ? "EVEN" : "ODD"
      } with ${amountStr} VIN → confirmed.`;

      // Try to parse BetResult event (optional)
      try {
        const iface = new ethers.utils.Interface(DICE_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === "BetResult") {
              const won = parsed.args.won;
              const payout = parsed.args.payout;
              const payoutStr = ethers.utils.formatUnits(
                payout,
                VIN_DECIMALS
              );
              if (won) {
                resultText = `You WON! Payout: ${payoutStr} VIN 🎉`;
              } else {
                resultText = "You LOST. Better luck next time.";
              }
              break;
            }
          } catch (e) {
            // ignore single-log parse failures
          }
        }
      } catch (e) {
        // ignore parsing errors
      }

      setStatus(els.diceStatus, "Bet successful ✅");
      els.diceLastResult.textContent = resultText;

      await Promise.all([
        refreshVinBalanceOnly(),
        refreshDiceBankroll(),
      ]);
    } catch (err) {
      console.error("handleDiceBet error:", err);
      setStatus(
        els.diceStatus,
        "Bet transaction failed or was rejected.",
        true
      );
    }
  }

  // ==========================
  //  Refresh All
  // ==========================

  async function refreshAllBalances() {
    await Promise.all([
      refreshSwapSideBalances(),
      refreshPoolReserves(),
      refreshVinBalanceOnly(),
      refreshDiceBankroll(),
    ]);
  }

  // ==========================
  //  Event Listeners
  // ==========================

  function setupEventListeners() {
    // Connect wallet
    els.connectButton.addEventListener("click", connectWallet);

    // View switching
    els.viewButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-view");
        if (!target) return;
        showView(target);

        if (target === "swap") {
          refreshSwapSideBalances().catch(console.error);
        } else if (target === "dice") {
          refreshVinBalanceOnly().catch(console.error);
          refreshDiceBankroll().catch(console.error);
        }
      });
    });

    // Copy VIN & add token
    els.copyVinAddress.addEventListener("click", copyVinAddress);
    els.addVinToMetamask.addEventListener("click", addVinToMetaMask);

    // Swap inputs
    els.fromAmount.addEventListener("input", updateToAmountFromInput);
    els.maxFromButton.addEventListener("click", () => {
      handleMaxFrom().catch(console.error);
    });

    // Swap direction toggle
    els.switchDirection.addEventListener("click", () => {
      swapDirection =
        swapDirection === DIRECTION_MON_TO_VIN
          ? DIRECTION_VIN_TO_MON
          : DIRECTION_MON_TO_VIN;
      updateSwapDirectionUI();
    });

    // Approve & Swap
    els.approveButton.addEventListener("click", () => {
      approveForCurrentSwap().catch(console.error);
    });
    els.swapButton.addEventListener("click", () => {
      performSwap().catch(console.error);
    });

    // Dice
    els.minBetText.textContent = `${DICE_MIN_BET_VIN} VIN`;
    els.betEvenButton.addEventListener("click", () => {
      handleDiceBet(true).catch(console.error);
    });
    els.betOddButton.addEventListener("click", () => {
      handleDiceBet(false).catch(console.error);
    });
  }

  // ==========================
  //  Init
  // ==========================

  async function init() {
    cacheDom();
    setupEventListeners();
    attachWalletEvents();

    // Initial swap direction
    updateSwapDirectionUI();

    // Price estimate
    loadVinPriceEstimate().catch(console.error);

    // Read-only data
    refreshAllBalances().catch(console.error);

    // If MetaMask is available, try to detect already-connected account
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const accounts = await provider.listAccounts();
      if (accounts && accounts.length > 0) {
        signer = provider.getSigner();
        currentAccount = ethers.utils.getAddress(accounts[0]);
        els.connectButton.textContent = formatAddress(currentAccount);
        await ensureMonadNetwork();
        await updateNetworkInfo();
        await refreshAllBalances();
      } else {
        await updateNetworkInfo();
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
