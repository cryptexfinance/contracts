// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import { console } from "forge-std/Test.sol";
import { NumberUpdater } from "contracts/mocks/NumberUpdater.sol";

contract Deploy is Script {

    function run() public {
				vm.createSelectFork(vm.envString("BASE_SEPOLIA_MAINNET_RPC_URL"));
				uint256 base_sepolia_pk = vm.envUint("BASE_SEPOLIA_PRIVATE_KEY");

        vm.startBroadcast(base_sepolia_pk);
        NumberUpdater numberUpdater = new NumberUpdater(0);

        console.log("NumberUpdater deployed at:", address(numberUpdater));

        vm.stopBroadcast();
    }
}
