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
		uint64 public baseSepoliaChainSelector = 10344971235874465080;
    address public baseSepoliaCcipRouterAddress = 0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93;
		address public baseSepoliaGovernanceReceiver = 0x6489641a0E14315103A87fEF87608FDd48da1631;
		GovernanceCCIPRelay public governanceRelayer = GovernanceCCIPRelay(payable(0xc5508aFda5BBb0b945e193D43A554DE61e258a66));
		address public governanceReceiver = 0x6489641a0E14315103A87fEF87608FDd48da1631;
		address public numberUpdater = 0x829e2df8BdBB47b76523fd490c8De27da72458B3;

    function run() public {
				uint256 sepolia_pk = vm.envUint("SEPOLIA_PRIVATE_KEY");
				vm.createSelectFork(vm.envString("SEPOLIA_MAINNET_RPC_URL"));

        vm.startBroadcast(sepolia_pk);

				address target = numberUpdater;
        bytes memory payload = abi.encodeWithSignature("updateNumber(uint256)", 42);
				governanceRelayer.relayMessage{value: 1 ether}(target, payload);
        vm.stopBroadcast();
    }
}
