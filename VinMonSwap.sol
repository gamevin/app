// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Fixed rate swap 1 VIN = 1 MON (MON is the native coin on Monad).
 * - No owner, no withdraw functions.
 * - Everyone (including deployer) can only get VIN or MON via swap.
 * - No fee, users only pay gas fee to the network.
 * - Contract holds VIN (ERC20) and MON (native) as liquidity.
 */
contract VinMonSwap {
    IERC20 public immutable vinToken;

    event SwapMonForVin(address indexed user, uint256 monIn, uint256 vinOut);
    event SwapVinForMon(address indexed user, uint256 vinIn, uint256 monOut);

    constructor(address _vinToken) {
        require(_vinToken != address(0), "Invalid VIN token");
        vinToken = IERC20(_vinToken);
    }

    // View VIN balance held by this contract
    function getVinReserve() external view returns (uint256) {
        return vinToken.balanceOf(address(this));
    }

    // View MON (native) balance held by this contract
    function getMonReserve() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * Swap MON -> VIN
     * - User sends MON (msg.value)
     * - Receives the same amount of VIN (1:1, same 18 decimals)
     */
    function swapMonForVin() external payable {
        uint256 monAmount = msg.value;
        require(monAmount > 0, "Amount must be > 0");

        uint256 vinAmount = monAmount; // 1:1
        uint256 vinBalance = vinToken.balanceOf(address(this));
        require(vinBalance >= vinAmount, "Insufficient VIN in contract");

        bool success = vinToken.transfer(msg.sender, vinAmount);
        require(success, "VIN transfer failed");

        emit SwapMonForVin(msg.sender, monAmount, vinAmount);
    }

    /**
     * Swap VIN -> MON
     * - User calls this function with vinAmount
     * - Contract pulls VIN from the user (user must approve first)
     * - Sends back the same amount of MON (1:1)
     */
    function swapVinForMon(uint256 vinAmount) external {
        require(vinAmount > 0, "Amount must be > 0");

        uint256 monAmount = vinAmount; // 1:1
        require(address(this).balance >= monAmount, "Insufficient MON in contract");

        bool success = vinToken.transferFrom(msg.sender, address(this), vinAmount);
        require(success, "VIN transfer failed");

        (bool sent, ) = msg.sender.call{value: monAmount}("");
        require(sent, "MON transfer failed");

        emit SwapVinForMon(msg.sender, vinAmount, monAmount);
    }

    // Allow the contract to receive MON directly
    receive() external payable {}
}
