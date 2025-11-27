📘 GameVinMon — Technical Specification (SPEC.md)

Full technical documentation for the GameVinMon Web3 dApp on Monad.

1. Overview

GameVinMon is a decentralized Web3 application on Monad Mainnet featuring:

🔄 Swap VIN ↔ MON at a fixed 1:1 rate

🎲 On-chain Dice Game using VIN

💲 Real-time VIN/USD price (via CoinGecko)

🦊 MetaMask Web3 connection

🚀 Fully frontend-based (GitHub Pages)

Live dApp:
👉 https://gamevinmon.github.io/app

2. Blockchain Information
Monad Network
Field	Value
RPC	https://rpc.monad.xyz
Chain ID	143
Explorer	https://monadvision.com
3. VIN Token
Item	Value
Address	0x09166bFA4a40BAbC19CCCEc6A6154d9c058098EC
Decimals	18
ABI File	VINToken_ContractABI.json
Source	VINToken.sol

VIN is the main utility token used in Dice and Swap.

4. Swap Contract — VIN ↔ MON
Item	Value
Address	0xCdce3485752E7a7D4323f899FEe152D9F27e890B
ABI File	ContractABI_VinMonSwap.json
Source	VinMonSwap.sol
Rate	1 VIN = 1 MON (fixed)
Fee	Defined inside contract
ABI Functions Used

swapVinToMon(uint256 amount)

swapMonToVin(uint256 amount)

vinToken()

monToken()

5. Dice Contract — VIN Dice Game
Item	Value
Address	0xE9Ed2c2987da0289233A1a1AE24438A314Ad6B2f
ABI File	VinMonDice_ContractABI.json
Source	VinMonDice.sol
ABI Functions Used

play(bool isEven, uint256 amount)

getLastGame(address user)

Event: Played(address user, bool isEven, uint256 amount, bool win, uint256 payout)

VIN approval required before playing.

6. VIN Price Feed (USD)

VIN price is derived directly from MON price because:

1 VIN = 1 MON

API Endpoint
https://api.coingecko.com/api/v3/simple/price?ids=monad&vs_currencies=usd

Behavior

The header displays:
1 VIN = 1 MON ≈ X.XXXX USD

Auto-refresh every 60 seconds.

7. Assets (Images & Logos)

All image files stored in /app:

vinlogo.png

vin24.png

mon24.png

logo64.png

logo128.png

Used across Swap & Dice UI.

8. UI Architecture — Three Screens

The dApp uses three isolated screens, controlled entirely by JS:

Home ↔ Swap
Home ↔ Dice
Swap ↔ Home
Dice ↔ Home


Only one screen is visible at any time.

8.1 Home Screen (default)
Elements:

Logo + VIN price

“Connect Wallet” button

Buttons:

Swap VIN/MON

Play Dice

How-to instructions

Monad reminder (must switch network)

Behavior:

No wallet connection required until Swap or Dice is opened.

8.2 Swap Screen

Shown after user clicks Swap VIN/MON.

Elements:

Wallet status

VIN → MON or MON → VIN direction toggle

Input amount

Auto-calculated output

Balance display

MAX button

Approve button

Swap button

Network: Monad

Back to Home

Status message area

Rules:

Amount 0 disables Swap

Swap requires “Approve” if allowance insufficient

Correct ERC20 decimal handling (18 decimals)

Swap rate displayed: 1 VIN = 1 MON

Swap direction toggle updates icons + labels

8.3 Dice Screen

Shown after user clicks Play Dice.

Elements:

VIN balance

Bet amount input

Choose Even / Odd

Play button

Last game result

Game history

Back to Home

Rules:

Must connect wallet

Must hold enough VIN

Must approve VIN first (if needed)

Result and history pulled from events

8.4 Dice — Advanced Betting Controls

To provide a fast betting experience similar to professional gambling dApps, the Dice Screen includes utility betting buttons.

Utility Buttons
Button	Function
Repeat	Re-use the previous bet amount
×2 (Double)	Multiply current bet by 2
½ (Half)	Divide current bet by 2
Clear	Set bet amount to 0
Logic Rules

Cannot exceed user balance

Cannot go below 0

Repeat uses the last successful bet saved internally

Double/Half immediately update the input field

Clear empties the input instantly

UI Layout

Placed below the Bet Amount input:

[ Bet Input Field ]
[ Repeat ] [ ×2 ] [ ½ ] [ Clear ]

Purpose

Faster betting

Less typing

UX similar to casino-grade dApps

9. Directory Structure
/app
 ├── index.html
 ├── style.css
 ├── app.js
 ├── SPEC.md
 ├── README.md
 ├── vinlogo.png
 ├── vin24.png
 ├── mon24.png
 ├── logo64.png
 ├── logo128.png
 ├── ContractABI_VinMonSwap.json
 ├── VinMonDice_ContractABI.json
 ├── VINToken_ContractABI.json

10. Technology Stack
Component	Usage
HTML5	UI layout
CSS3	Styling
JavaScript ES6	Logic & events
Ethers.js v5.7	Web3 + Contract interaction
MetaMask	Wallet
CoinGecko API	Price feed
Monad	Blockchain
GitHub Pages	Hosting
11. dApp Flow Diagram
                 Home Screen
              /                \
       Swap VIN/MON          Play Dice
            |                    |
     Connect MetaMask      Connect MetaMask
            |                    |
      Swap Logic            Dice Logic
         (1:1)              (Even/Odd)

12. Footer Links
Smart Contracts

VIN Token

Swap VIN/MON

Dice Game

Community

Twitter: https://x.com/gamevinmon

Telegram: https://t.me/gamevinmon

GitHub: https://github.com/gamevinmon

Website: https://gamevinmon.github.io/app
