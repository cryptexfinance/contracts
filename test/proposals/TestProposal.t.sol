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
  IGovernorBeta public governorBeta =
    IGovernorBeta(0x874C5D592AfC6803c3DD60d6442357879F196d5b);
  ITimelock public timelock =
    ITimelock(0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8);

  address public user = address(0x51);
  address public owner = address(0x52);

  function setUp() public {
    string memory ETHEREUM_MAINNET_RPC_URL = vm.envString(
      "ETHEREUM_MAINNET_RPC_URL"
    );
    ethereumMainnetForkId = vm.createFork(ETHEREUM_MAINNET_RPC_URL);
    vm.selectFork(ethereumMainnetForkId);
    deal(address(ctx), user, 100_000_000 ether);
    vm.prank(user);
    ctx.delegate(user);
    vm.makePersistent(user);
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
    calldatas[
      0
    ] = hex"00000000000000000000000041187c70eb8eeefdaed4ed0bff20005c53c3a7dd000000000000000000000000000000000000000000001a784379d99db4200000";
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

	function testCIP37() external {
		vm.selectFork(ethereumMainnetForkId);
    address[] memory targets = new address[](1);
    uint256[] memory values = new uint256[](1);
    string[] memory signatures = new string[](1);
    bytes[] memory calldatas = new bytes[](1);
    string memory description;

    address teamMultisig = 0xa70b638B70154EdfCbb8DbbBd04900F328F32c35;

    targets[0] = 0x321C2fE4446C7c963dc41Dd58879AF648838f98D;
    values[0] = 0;
    signatures[0] = "transfer(address,uint256)";
    calldatas[
      0
    ] = hex"000000000000000000000000a70b638b70154edfcbb8dbbbd04900f328f32c35000000000000000000000000000000000000000000001969368974c05b000000";
    description = "CIP-37: Supplemental Treasury Transfer to Sustain Q2 2025 Operations";
    uint256 oldBalance = ctx.balanceOf(teamMultisig);
    createAndExecuteGovernanceProposal(
      targets,
      values,
      signatures,
      calldatas,
      description
    );
    uint256 newBalance = ctx.balanceOf(teamMultisig);
    assertEq(newBalance - oldBalance, 120_000 ether);
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
