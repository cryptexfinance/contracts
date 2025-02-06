// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import { console } from "forge-std/Test.sol";
import { GovernanceCCIPReceiver } from "contracts/ccip/GovernanceCCIPReceiver.sol";
import { GovernanceCCIPRelay } from "contracts/ccip/GovernanceCCIPRelay.sol";
import { Register } from "@chainlink/local/src/ccip/CCIPLocalSimulatorFork.sol";

contract Deploy is Script {
    uint64 public ethereumSepoliaChainSelector = 16015286601757825753;
    address public ethereumSepoliaCcipRouterAddress = 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59;
    address public baseSepoliaCcipRouterAddress = 0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93;

    function run() public {
				uint256 sepolia_pk = vm.envUint("SEPOLIA_PRIVATE_KEY");
				address sepolia_deployer = vm.addr(sepolia_pk);
				vm.createSelectFork(vm.envString("SEPOLIA_MAINNET_RPC_URL"));
				uint256 nonce = vm.getNonce(sepolia_deployer);
				address governanceRelayAddress = computeCreateAddress(
					sepolia_deployer,
					nonce
				);
				console.log("computed governanceRelayAddress", governanceRelayAddress);
				// Compute GovernanceRelay contract address (for Mainnet deployment)
				vm.createSelectFork(vm.envString("BASE_SEPOLIA_MAINNET_RPC_URL"));
				uint256 base_sepolia_pk = vm.envUint("BASE_SEPOLIA_PRIVATE_KEY");


        vm.startBroadcast(base_sepolia_pk);
        GovernanceCCIPReceiver governanceReceiver = new GovernanceCCIPReceiver(
            baseSepoliaCcipRouterAddress,
            ethereumSepoliaChainSelector,
            governanceRelayAddress
        );

        console.log("GovernanceCCIPReceiver deployed at:", address(governanceReceiver));

        vm.stopBroadcast();
    }
}
