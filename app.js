/* ============================================================
   GameVinMon — app.js
   Full Version (Segment 1)
   - Network setup
   - Contract addresses
   - ABI import utilities
   - DOM helpers
   - Format helpers
   ============================================================ */

// ============ NETWORK & CONSTANTS ============
const MONAD_RPC = "https://rpc.monad.xyz";
const CHAIN_ID = 143;

// Contract addresses (fixed)
const VIN_TOKEN_ADDRESS = "0x09166bFA4a40BAbC19CCCEc6A6154d9c058098EC";
const SWAP_CONTRACT_ADDRESS = "0xCdce3485752E7a7D4323f899FEe152D9F27e890B";
const DICE_CONTRACT_ADDRESS = "0xE9Ed2c2987da0289233A1a1AE24438A314Ad6B2f";

const VIN_DECIMALS = 18;

// ============ ABI IMPORT PLACEHOLDER (loaded later) ============
let vinTokenABI = null;
let swapContractABI = null;
let diceContractABI = null;

// ============ ETHERS OBJECTS ============
let providerRead = null;     // read-only provider
let provider = null;         // injected by MetaMask
let signer = null;

let vinRead = null;
let vinWrite = null;

let swapRead = null;
let swapWrite = null;

let diceRead = null;
let diceWrite = null;

// ============ GLOBAL STATES ============
let currentAccount = null;

let vinBalanceBN = null;
let monBalanceBN = null;

let vinUsdPrice = null;
let monUsdPrice = null;

let lastDiceGame = null;
let diceInFlight = false;
let lastBetAmountBN = null;

// ============ BASIC DOM HELPERS ============
function $(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}

// ============ NUMBER FORMAT HELPERS ============
function formatVin(bn) {
  if (!bn) return "-";
  try {
    const num = parseFloat(ethers.utils.formatUnits(bn, VIN_DECIMALS));
    if (!isFinite(num)) return "-";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  } catch {
    return "-";
  }
}

function formatMon(bn) {
  if (!bn) return "-";
  try {
    const num = parseFloat(ethers.utils.formatEther(bn));
    if (!isFinite(num)) return "-";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  } catch {
    return "-";
  }
}

// Format USD Display
function formatUsd(num) {
  if (!num || !isFinite(num)) return "-";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

// ============ INITIAL READ PROVIDER ============
function initReadProvider() {
  if (!providerRead) {
    providerRead = new ethers.providers.JsonRpcProvider(MONAD_RPC);
  }
}

