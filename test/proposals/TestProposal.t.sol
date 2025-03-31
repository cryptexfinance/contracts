// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console2} from "forge-std/Test.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {GovernanceCCIPRelay, IGovernanceCCIPRelay} from "contracts/ccip/GovernanceCCIPRelay.sol";
import {GovernanceCCIPReceiver, IGovernanceCCIPReceiver} from "contracts/ccip/GovernanceCCIPReceiver.sol";

import {IGovernorBeta} from "../interfaces/IGovernorBeta.sol";
import {ITimelock} from "../interfaces/ITimelock.sol";
import {ICtx} from "../interfaces/ICtx.sol";


contract GovernanceCCIPIntegrationTest is Test {
  uint256 public ethereumMainnetForkId;

  ICtx ctx = ICtx(0x321C2fE4446C7c963dc41Dd58879AF648838f98D);
  IGovernorBeta public governorBeta = IGovernorBeta(0x874C5D592AfC6803c3DD60d6442357879F196d5b);
  ITimelock public timelock = ITimelock(0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8);

  address public user = address(0x51);
  address public owner = address(0x52);

  function setUp() public {
    // Create forks of both networks
    string memory ETHEREUM_MAINNET_RPC_URL = vm.envString(
      "ETHEREUM_MAINNET_RPC_URL"
    );
    ethereumMainnetForkId = vm.createFork(ETHEREUM_MAINNET_RPC_URL);
    vm.selectFork(ethereumMainnetForkId);
		deal(address(ctx), user, 100_000_000 ether);
		vm.prank(user);
		ctx.delegate(user);
		vm.makePersistent(user);

    // Deploy GovernanceRelay on Ethereum
//    vm.selectFork(ethereumMainnetForkId);
//    address timelockComputedAddress = computeCreateAddress(
//      address(user),
//      vm.getNonce(user) + 1
//    );
//    vm.startPrank(user);
//    address ctxAddress = deployCode(
//      "Ctx.sol",
//      abi.encode(user, user, block.timestamp)
//    );
//    ctx = ICtx(ctxAddress);
//    address GovernorBetaComputedAddress = computeCreateAddress(
//      address(user),
//      vm.getNonce(user) + 1
//    );
//    address timeLockAddress = deployCode(
//      "Timelock.sol",
//      abi.encode(GovernorBetaComputedAddress, 2 days)
//    );
//    timelock = ITimelock(timeLockAddress);
//    address governorBetaAddress = deployCode(
//      "GovernorBeta.sol:GovernorBeta",
//      abi.encode(address(timelock), ctx, user)
//    );
//    governorBeta = IGovernorBeta(governorBetaAddress);
//    ctx.delegate(user);
//    vm.stopPrank();
//    vm.deal(timeLockAddress, 10 ether);
//    vm.makePersistent(address(governanceRelay));
//    vm.makePersistent(ctxAddress);
//    vm.makePersistent(timeLockAddress);
//    vm.makePersistent(governorBetaAddress);
  }

	function testCIP36() external {
		vm.selectFork(ethereumMainnetForkId);
		address[] memory targets = new address[](1);
    uint256[] memory values = new uint256[](1);
    string[] memory signatures = new string[](1);
    bytes[] memory calldatas = new bytes[](1);
		string memory description;

		address subDAOMultisig = 0x41187c70eB8eeEfDaEd4ED0bFF20005C53c3a7DD;

		targets[0] = 0x321C2fE4446C7c963dc41Dd58879AF648838f98D;
		values[0] = 0;
		signatures[0] = "transfer(address,uint256)";
		calldatas[0] = hex"00000000000000000000000041187c70eb8eeefdaed4ed0bff20005c53c3a7dd000000000000000000000000000000000000000000001a784379d99db4200000";
		description = "CIP-36: Regulatory Advocacy & Public Affairs Strategy";
		uint256 oldBalance = ctx.balanceOf(subDAOMultisig);
		createAndExecuteGovernanceProposal(
			targets,
			values,
			signatures,
			calldatas,
			description
		);
		uint256 newBalance = ctx.balanceOf(subDAOMultisig);
		assertEq(newBalance - oldBalance, 125_000 ether);
	}

  function createAndExecuteGovernanceProposal(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
		string memory description
  ) internal {
    vm.startPrank(user);
    vm.roll(block.number + 100);
    governorBeta.propose(targets, values, signatures, calldatas, description);
    uint256 proposalID = governorBeta.latestProposalIds(user);
    vm.roll(block.number + governorBeta.votingDelay() + 1);
    governorBeta.castVote(proposalID, true);
    vm.roll(block.number + governorBeta.votingPeriod() + 1);
    governorBeta.queue(proposalID);
    vm.warp(block.timestamp + timelock.delay() + 1 days);
    governorBeta.execute(proposalID);
    assertEq(
      uint256(governorBeta.state(proposalID)),
      uint256(IGovernorBeta.ProposalState.Executed)
    );
    vm.stopPrank();
  }
}
