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
	enum ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Queued,
    Expired,
    Executed
  }

	  // Setup
	address user = address(0x51);
	address deployer = 0x570f581D23a2AB09FD1990279D9DB6f5DcE18F4A;
	address guardian = deployer;
	address arbitrumInbox = 0x6BEbC4925716945D46F0Ec336D5C2564F419682C;
  ETHVaultHandler ethVault = ETHVaultHandler(0x4bF5E0cdfC4F9fa542d63ff2020209c427bbD046);
  ArbitrumOrchestrator orchestrator = ArbitrumOrchestrator(0xb9CcDF5d90C461557DC3C0D8Fd7A782978FB8b4F);
	ArbitrumTreasury treasury = ArbitrumTreasury(0x464e8536e552Be1a969d6334D0A317C1e022abbb);
  TCAP jpegz = TCAP(0xf9DC37960adC96f347A55Aed9FB92Cb13eDe925b);
	GovernorBeta governorBeta = GovernorBeta(0xB1B50029de9deFC4ebE6ac1BAeB8fF15d1e46a02);
	Timelock timeLock = Timelock(0x6A56BbF8823794C1841c02061627E6349288403E);
	Ctx ctx = Ctx(0xec1a9F7B260BEA534B5e407Cc48ec1aEC2b65ad2);
	L1MessageRelayer l1MessageRelayer = L1MessageRelayer(0x30743989937AFCF2Ccd9205046289Fa67524bef8);
	L2MessageExecutor l2MessageExecutor = L2MessageExecutor(0x9a0A963ce5CD1C9e5Ef5df862b42143E82f6412C);
	L2MessageExecutorProxy l2MessageExecutorProxy = L2MessageExecutorProxy(0x4D51f466D4c6072d6F07A082ffD476bafB110Faf);
	L2AdminProxy l2AdminProxy = L2AdminProxy(0xD798E04687af04a4611727A69390b27De7633625);
	uint256 mainnetFork;
	uint256 arbitrumFork;

	function setUp() external {
		string memory MAINNET_RPC_URL = vm.envString("MAINNET_RPC_URL");
    string memory ARBITRUM_RPC_URL = vm.envString("ARBITRUM_RPC_URL");
		mainnetFork = vm.createFork(MAINNET_RPC_URL);
		arbitrumFork = vm.createFork(ARBITRUM_RPC_URL);
		vm.selectFork(mainnetFork);
		deal(address(timeLock), 100 ether);
		deal(user, 100 ether);
		deal({token: address(ctx), to: user, give: 500_000e18});
		vm.prank(user);
		ctx.delegate(user);
	}

	function testRelayerTimelockAddress() external {
		vm.selectFork(mainnetFork);
		assertEq(l1MessageRelayer.timeLock(), address(timeLock));
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

	function createAndExecuteGovernanceProposal(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas
  ) public {
    vm.startPrank(user);
    vm.roll(block.number + 100);
    governorBeta.propose(targets, values, signatures, calldatas, "");
    uint256 proposalID = governorBeta.latestProposalIds(user);
    vm.roll(block.number + governorBeta.votingDelay() + 1);
    governorBeta.castVote(proposalID, true);
    vm.roll(block.number + governorBeta.votingPeriod() + 1);
    governorBeta.queue(proposalID);
    vm.warp(block.timestamp + timeLock.delay() + 1 days);
    governorBeta.execute(proposalID);
    assertEq(
      uint256(governorBeta.state(proposalID)),
      uint256(ProposalState.Executed)
    );
    vm.stopPrank();

		vm.selectFork(arbitrumFork);
		vm.startPrank(AddressAliasHelper.applyL1ToL2Alias(address(l1MessageRelayer)));
		(address target, bytes memory payload,,,) = abi.decode(calldatas[0], (address, bytes, uint256, uint256, uint256));
		(bool success, ) = target.call(payload);
		require(success, "tx to arbitrum failed");
		vm.stopPrank();
  }

	function testSetMintFee() external {
		vm.selectFork(mainnetFork);
		uint256 newMintFee = 205;
		bytes memory _callData = abi.encodeWithSelector(
      orchestrator.setMintFee.selector,
      address(ethVault),
			newMintFee
    );
    bytes memory _payLoad = abi.encode(address(orchestrator), _callData);
    address[] memory targets = new address[](1);
    uint256[] memory values = new uint256[](1);
    string[] memory signatures = new string[](1);
    bytes[] memory calldatas = new bytes[](1);
    targets[0] = address(l1MessageRelayer);
    values[0] = 6105111510400;
    signatures[0] = "relayMessage(address,bytes,uint256,uint256,uint256)";
    calldatas[0] = abi.encode(
			address(l2MessageExecutorProxy),
			abi.encodeWithSelector(l2MessageExecutor.executeMessage.selector, _payLoad),
      uint256(166811510400),
      uint256(59383),
      uint256(100000000)
    );
		createAndExecuteGovernanceProposal(targets, values, signatures, calldatas);
		vm.selectFork(arbitrumFork);
		assertEq(ethVault.mintFee(), newMintFee);
	}

	function testSetRatio() external {
		vm.selectFork(mainnetFork);
		uint256 newVaultRatio = 500;
		bytes memory _callData = abi.encodeWithSelector(
      orchestrator.setRatio.selector,
      address(ethVault),
			newVaultRatio
    );
    bytes memory _payLoad = abi.encode(address(orchestrator), _callData);
    address[] memory targets = new address[](1);
    uint256[] memory values = new uint256[](1);
    string[] memory signatures = new string[](1);
    bytes[] memory calldatas = new bytes[](1);
    targets[0] = address(l1MessageRelayer);
    values[0] = 6105111510400;
    signatures[0] = "relayMessage(address,bytes,uint256,uint256,uint256)";
    calldatas[0] = abi.encode(
			address(l2MessageExecutorProxy),
			abi.encodeWithSelector(l2MessageExecutor.executeMessage.selector, _payLoad),
      uint256(166811510400),
      uint256(59383),
      uint256(100000000)
    );
		createAndExecuteGovernanceProposal(targets, values, signatures, calldatas);
		vm.selectFork(arbitrumFork);
		assertEq(ethVault.ratio(), newVaultRatio);
	}

}
