// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Test, console } from "forge-std/Test.sol";
import { CCIPLocalSimulatorFork, Register } from "@chainlink/local/src/ccip/CCIPLocalSimulatorFork.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { GovernanceCCIPRelay } from "contracts/ccip/GovernanceCCIPRelay.sol";
import { GovernanceCCIPReceiver } from "contracts/ccip/GovernanceCCIPReceiver.sol";
import { NumberUpdater } from "contracts/mocks/NumberUpdater.sol";

contract GovernanceReceiverTest is Test {
    CCIPLocalSimulatorFork public ccipLocalSimulatorFork;
    uint256 public ethereumMainnetForkId;
    uint256 public polygonMainnetForkId;

    // Addresses
		uint64 public ethereumMainnetChainSelector = 5009297550715157269;
    address public ethereumMainnetCcipRouterAddress = 0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D;
    uint64 public polygonMainnetChainSelector = 4051577828743386545;
		address public polygonMainnetCcipRouterAddress = 0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe;


    // Contracts
    GovernanceCCIPRelay public governanceRelay;
    GovernanceCCIPReceiver public governanceReceiver;
    NumberUpdater public numberUpdater;

    function setUp() public {
        // Create forks of both networks
        string memory ETHEREUM_MAINNET_RPC_URL = vm.envString("ETHEREUM_MAINNET_RPC_URL");
        string memory POLYGON_MAINNET_RPC_URL = vm.envString("POLYGON_MAINNET_RPC_URL");
        ethereumMainnetForkId = vm.createFork(ETHEREUM_MAINNET_RPC_URL);
        polygonMainnetForkId = vm.createFork(POLYGON_MAINNET_RPC_URL);

        // Initialize CCIP Local Simulator
        ccipLocalSimulatorFork = new CCIPLocalSimulatorFork();
				vm.makePersistent(address(ccipLocalSimulatorFork));
        ccipLocalSimulatorFork.setNetworkDetails(
            137,
            Register.NetworkDetails({
                chainSelector: polygonMainnetChainSelector,
                routerAddress: polygonMainnetCcipRouterAddress,
                linkAddress: address(0), // not needed for this test
                wrappedNativeAddress: address(0), // not needed for this test
                ccipBnMAddress: address(0), // not needed for this test
                ccipLnMAddress: address(0), // not needed for this test
                rmnProxyAddress: address(0), // not needed for this test
                registryModuleOwnerCustomAddress: address(0), // not needed for this test
                tokenAdminRegistryAddress: address(0) // not needed for this test
            })
        );
				vm.selectFork(ethereumMainnetForkId);
				address governanceRelayAddress = computeCreateAddress(
					address(this), vm.getNonce(address(this)) + 2
				);

        // Deploy NumberUpdater on Polygon
        vm.selectFork(polygonMainnetForkId);
        numberUpdater = new NumberUpdater(0); // Initialize with number = 0
				vm.makePersistent(address(numberUpdater));

        // Deploy GovernanceReceiver on Polygon
        governanceReceiver = new GovernanceCCIPReceiver(
						polygonMainnetCcipRouterAddress, // Router address
            ethereumMainnetChainSelector, // Chain selector
						governanceRelayAddress
				);
				vm.makePersistent(address(governanceReceiver));

        // Deploy GovernanceRelay on Ethereum
        vm.selectFork(ethereumMainnetForkId);
        governanceRelay = new GovernanceCCIPRelay(
            address(this), // Timelock (for testing purposes, use this contract)
            ethereumMainnetCcipRouterAddress,
            polygonMainnetChainSelector,
            address(governanceReceiver)
        );
				vm.makePersistent(address(governanceRelay));
    }

    function testCrossChainMessageRelayUpdateNumber() public {
        // Set up the source chain (Ethereum)
        vm.selectFork(ethereumMainnetForkId);

        // Prepare the message to update the number in NumberUpdater
        address target = address(numberUpdater); // Target address on Polygon
        bytes memory payload = abi.encodeWithSignature("updateNumber(uint256)", 42); // Update number to 42

        // Mock the CCIP router's getFee function
        uint256 fee = 1 ether;
        vm.mockCall(
            ethereumMainnetCcipRouterAddress,
            abi.encodeWithSelector(IRouterClient.getFee.selector),
            abi.encode(fee)
        );

        // Send the message via GovernanceRelay
        vm.deal(address(this), fee); // Fund the contract with enough Ether
        vm.expectEmit(true, true, true, true);
        emit GovernanceCCIPRelay.MessageRelayed(target, payload);
        governanceRelay.relayMessage{value: fee}(target, payload);

        // Route the message to Polygon
				vm.expectEmit(true, true, true, true);
        emit GovernanceCCIPReceiver.MessageExecuted(target, payload);
        ccipLocalSimulatorFork.switchChainAndRouteMessage(polygonMainnetForkId);

        // Verify the message was received and executed on Polygon
        vm.selectFork(polygonMainnetForkId);

        // Check that the number was updated in NumberUpdater
        assertEq(numberUpdater.number(), 42, "Number was not updated correctly");
    }
}

