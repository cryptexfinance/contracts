// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;
pragma abicoder v2;

import "forge-std/Test.sol";
import "../../contracts/ETHVaultHandler.sol";
import "../../contracts/TCAP.sol";
import "../../contracts/governance/GovernorBeta.sol";
import "../../contracts/governance/Timelock.sol";
import "../../contracts/governance/Ctx.sol";
import "../../contracts/arbitrum/AddressAliasHelper.sol";
import "../../contracts/arbitrum/ArbitrumOrchestrator.sol";
import "../../contracts/arbitrum/ArbitrumTreasury.sol";
import "../../contracts/arbitrum/L1MessageRelayer.sol";
import "../../contracts/arbitrum/L2MessageExecutorProxy.sol";
import "../../contracts/arbitrum/L2MessageExecutor.sol";
import "../../contracts/arbitrum/L2AdminProxy.sol";



contract JPEGZBridgeFork is Test {
	  // Setup
	address deployer = 0x570f581D23a2AB09FD1990279D9DB6f5DcE18F4A;
	address guardian = deployer;
	address arbitrumInbox = 0x6BEbC4925716945D46F0Ec336D5C2564F419682C;
  ETHVaultHandler ethVault = ETHVaultHandler(0x5817b69BE6E130B59843fa82515318C6Df84B071);
  ArbitrumOrchestrator orchestrator = ArbitrumOrchestrator(0x9f8abf6e69C465bB432CA36F99C198c896a703BD);
	ArbitrumTreasury treasury = ArbitrumTreasury(0xbb7558d77F65f6b5B90525A9BbD7cf2bd208f587);
  TCAP jpegz = TCAP(0xaC1A2Bf3Db803F9FFC8EC39EA26c70622A0ed461);
	GovernorBeta governance = GovernorBeta(0x831f5eC3cAc0De0d5211E6b8B1eFdcecac91cF39);
	Timelock timelock = Timelock(0x00531065Af9ED99b19BD21997b3c2B6C13498f26);
	Ctx ctx = Ctx(0xc1BF30f5aD5Cd8829DebA7Bc48ed7a6fDc3e618B);
	L1MessageRelayer l1MessageRelayer = L1MessageRelayer(0x447B9948464593e1235601157063c495b115e02e);
	L2MessageExecutor l2MessageExecutor = L2MessageExecutor(0xd5A753D7F0E04b7caa14e7300A2c62A4e4d0F5b6);
	L2MessageExecutorProxy l2MessageExecutorProxy = L2MessageExecutorProxy(0xFEB4D2ffA65FF94C4E532d0e59a06Db132432b81);
	L2AdminProxy l2AdminProxy = L2AdminProxy(0x05e48AD71E7456a85acE8796c05538a283430FF3);
	uint256 mainnetFork;
	uint256 arbitrumFork;

	function setUp() external {
		string memory MAINNET_RPC_URL = vm.envString("MAINNET_RPC_URL");
    string memory ARBITRUM_RPC_URL = vm.envString("ARBITRUM_RPC_URL");
		mainnetFork = vm.createFork(MAINNET_RPC_URL);
		arbitrumFork = vm.createFork(ARBITRUM_RPC_URL);
	}

	function testRelayerTimelockAddress() external {
		vm.selectFork(mainnetFork);
		assertEq(l1MessageRelayer.timeLock(), address(timelock));
	}

	function testRelayerOwner() external {
		vm.selectFork(mainnetFork);
		assertEq(l1MessageRelayer.owner(), deployer);
	}

	function testRelayerInboxAddress() external {
		vm.selectFork(mainnetFork);
		assertEq(address(l1MessageRelayer.inbox()), arbitrumInbox);
	}

	function testAdminProxyOwner() external {
		vm.selectFork(arbitrumFork);
		assertEq(l2AdminProxy.owner(), AddressAliasHelper.applyL1ToL2Alias(address(l1MessageRelayer)));
	}

	function testL2ExecutorProxyAdmin() external {
		vm.selectFork(arbitrumFork);
		vm.prank(address(l2AdminProxy));
		assertEq(l2MessageExecutorProxy.admin(), address(l2AdminProxy));
	}

	function testL2ExecutorProxyRelayer() external {
		vm.selectFork(arbitrumFork);
		bytes memory message = Address.functionCall(
      address(l2MessageExecutorProxy),
      abi.encodeWithSelector(l2MessageExecutor.l1MessageRelayer.selector)
    );
		assertEq(abi.decode(message, (address)), address(l1MessageRelayer));
	}

	function testOrchestratorOwner() external {
		vm.selectFork(arbitrumFork);
		assertEq(orchestrator.owner(), address(l2MessageExecutorProxy));
	}

	function testOrchestratorGuardian() external {
		vm.selectFork(arbitrumFork);
		assertEq(orchestrator.guardian(), guardian);
	}

	function testTreasuryOwner() external {
		vm.selectFork(arbitrumFork);
		assertEq(treasury.owner(), address(l2MessageExecutorProxy));
	}
	
}
