import { expect } from "chai";
import { Contract, constants, utils } from "ethers";
import hre, { waffle } from "hardhat";

import { governanceFixture } from "../governance/fixtures";
import { DELAY } from "../governance/utils";
import { deployContract } from "../utils"

const [wallet, acc1, acc2, acc3, acc4] = waffle.provider.getWallets();
const loadFixture = waffle.createFixtureLoader([wallet], waffle.provider);

let ctx: Contract;
let timelock: Contract;
let governorBeta: Contract;
let targets: string[];
let values: number[];
let signatures: string[];
let callDatas: string[];
let polygonMessenger: Contract;
let polygonOrchestrator: Contract;
let fxChild: Contract;
let fxRoot: Contract;
let stateSender: Contract;
let aggregatorInterfaceTCAP: Contract;
let tCAP: Contract;
let wETH: Contract;
let tCAPOracle: Contract;
let wETHOracle: Contract;
let wETHVaultHandler: Contract;
let wETHRewardHandler: Contract;

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

async function executeProposal(
	targets: string[],
	values: number[],
	signatures: string[],
	callDatas: string[]
) {
	await governorBeta.functions.propose(targets, values, signatures, callDatas, "");
	const proposalID = await governorBeta.functions.latestProposalIds(wallet.address);
	let [ status ] = await governorBeta.functions.state(proposalID.toString());
	expect(
		 status
	).to.equal(ProposalState.Pending);

	// 		Mine block to surpass votingDelay
	await hre.network.provider.send("evm_mine");
	[ status ] = await governorBeta.functions.state(proposalID.toString());
	expect(
		status
	).to.be.eq(ProposalState.Pending);

	await ctx.functions.transfer(acc1.address, "100000000000000000000000");
	await ctx.connect(acc1).delegate(acc1.address);
	await hre.network.provider.send("evm_mine");

	// 		Mine block to surpass votingDelay
	await governorBeta.functions.castVote(proposalID.toString(), true);
	for (let i = 0; i < 20000; i++) {
		await hre.network.provider.send("evm_mine");
	}
	debugger;
	[ status ] = await governorBeta.functions.state(proposalID.toString());
	expect(
		status
	).to.be.eq(ProposalState.Succeeded);

	// 		Queue
	await governorBeta.functions.queue(proposalID.toString());
	[ status ] = await governorBeta.functions.state(proposalID.toString());
	expect(
		status
	).to.be.eq(ProposalState.Queued);

	let trivialProposal = await governorBeta.functions.proposals(proposalID.toString());

	//  forward time to surpass proposal ETA
	await hre.network.provider.request({
		method: "evm_setNextBlockTimestamp",
		params: [trivialProposal.eta.toNumber()]
	});
	[ status ] = await governorBeta.functions.state(proposalID.toString());
	expect(
		status
	).to.be.eq(ProposalState.Queued);

	// 		Execute proposal
	await governorBeta.functions.execute(proposalID.toString());
	[ status ] = await governorBeta.functions.state(proposalID.toString());
	expect(
		status
	).to.be.eq(ProposalState.Executed);
}

describe("Polygon Integration Test", async function () {

	beforeEach(async () => {
		const fixture = await loadFixture(governanceFixture);
		ctx = fixture.ctx;
		timelock = fixture.timelock;
		governorBeta = fixture.governorBeta;
		await ctx.functions.delegate(wallet.address);
		stateSender = await deployContract("StateSender", wallet, []);
		fxRoot = await deployContract("FxRoot", wallet, [stateSender.address]);
		fxChild = await deployContract("MockFxChild", wallet, []);
		await fxRoot.setFxChild(fxChild.address);
		await stateSender.register(fxRoot.address, fxChild.address);
		polygonMessenger = await deployContract("PolygonL2Messenger", wallet, []);
		polygonOrchestrator = await deployContract("PolygonOrchestrator", wallet, [
			wallet.address,
			timelock.address,
			polygonMessenger.address
		]);
		await polygonMessenger.functions.setMessageReceiver(polygonOrchestrator.address);
		await polygonMessenger.functions.updateFxRootSender(timelock.address);
		await polygonMessenger.functions.updateFxChild(fxChild.address);
		aggregatorInterfaceTCAP = await deployContract("AggregatorInterfaceTCAP", wallet, []);
		tCAP = await deployContract(
			"TCAP", wallet, ["TCAP Token", "TCAP", 0, polygonOrchestrator.address]
		);
		wETH = await deployContract("AggregatorInterfaceTCAP", wallet, []);
		tCAPOracle = await deployContract(
			"ChainlinkOracle",
			wallet,
			[aggregatorInterfaceTCAP.address, timelock.address]
		);
		wETHOracle = await deployContract(
			"ChainlinkOracle",
			wallet,
			[aggregatorInterfaceTCAP.address, timelock.address]
		);

		let nonce = await wallet.getTransactionCount();
		const rewardAddress = hre.ethers.utils.getContractAddress({
				from: wallet.address,
				nonce: nonce + 1,
		});
		wETHVaultHandler = await deployContract(
			"ETHVaultHandler",
			wallet,
			[
				polygonOrchestrator.address,
				"10000000000",
				"200",
				"1",
				"10",
				tCAPOracle.address,
				tCAP.address,
				wETH.address,
				wETHOracle.address,
				wETHOracle.address,
				rewardAddress,
				timelock.address,
			]
		);
		wETHRewardHandler = await deployContract(
			"RewardHandler",
			wallet,
			[polygonOrchestrator.address, ctx.address, wETHVaultHandler.address]
		);

	});


	it("...Add new vault", async () => {
			expect(await tCAP.vaultHandlers(wETHVaultHandler.address)).to.be.false;
			let ABI = [ "function addTCAPVault(address,address)" ];
			let iface = new hre.ethers.utils.Interface(ABI);
			const _callData = iface.encodeFunctionData("addTCAPVault", [tCAP.address, wETHVaultHandler.address]);

			targets = [fxRoot.address];
			values = [0];
			signatures = ["sendMessageToChild(address,bytes)"];
			let abiCoder = new utils.AbiCoder();
			callDatas = [abiCoder.encode(['address', 'bytes'], [polygonMessenger.address, _callData])];

			await executeProposal(targets, values, signatures, callDatas);
			expect(await tCAP.vaultHandlers(wETHVaultHandler.address)).to.be.true;
	});

});
