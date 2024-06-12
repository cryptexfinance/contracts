import { BigNumber, Contract, Signer } from "ethers";
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { Deployment } from "hardhat-deploy/dist/types";

const ethers = hre.ethers;
let signer: Signer;
let governor: Deployment;
let governorContract: Contract;
let proposer = "0x19C48BDEbE9925Ff78026385Dc2bf2427B136f69";

const initialize = async () => {
	signer = ethers.provider.getSigner(proposer);
	governor = await deployments.get("GovernorBeta");
	governorContract = await ethers.getContractAt("GovernorBeta", governor.address, signer);
};

export async function fundMultisign(amount: string) {
	if (!governor) {
		await initialize();
	}

	// VB sends us ETH
	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: ["0xd8da6bf26964af9d7eed9e03e53415d37aa96045"],
	});

	let vbSigner = ethers.provider.getSigner("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

	await vbSigner.sendTransaction({
		to: proposer,
		value: ethers.BigNumber.from(amount),
	});

	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [proposer],
	});
}

export async function createProposal(
	targets: string[],
	values: BigNumber[],
	signatures: string[],
	calldatas: string[],
	description: string
) {
	if (!governor) {
		await initialize();
	}

    let ctx = await deployments.get("Ctx");
    let ctxContract= await ethers.getContractAt("Ctx",ctx.address, signer);
    const x =  await ctxContract.delegate(proposer);
    await ethers.provider.send("evm_mine", []);

	console.log("==================Create Proposal==================");
	const tx = await governorContract.propose(targets, values, signatures, calldatas, description);
	console.log(tx);
	await ethers.provider.send("evm_mine", []);
}

export async function castVote(proposalId: number, support: boolean) {
	if (!governor) {
		await initialize();
	}

	console.log("==================Vote==================");
	const tx = await governorContract.castVote(proposalId, support);
	console.log(tx);
	await ethers.provider.send("evm_mine", []);
}

export async function queueProposal(proposalId: number) {
	if (!governor) {
		await initialize();
	}

	console.log("==================Queue==================");
	const proposal = await governorContract.proposals(proposalId);
	await waitBlocks(ethers.provider.blockNumber, proposal.endBlock);
	const tx = await governorContract.queue(proposalId);
	await ethers.provider.send("evm_mine", []);
	console.log(tx);
}

export async function executeProposal(proposalId: number) {
	if (!governor) {
		await initialize();
	}

	const ONE_DAY = 86500;
	console.log("==================Execute Transaction==================");
	await ethers.provider.send("evm_increaseTime", [ONE_DAY * 4]);
	await ethers.provider.send("evm_mine", []);
	const tx = await governorContract.execute(proposalId, { gasLimit: 2100000 });
	console.log(tx);
	await ethers.provider.send("evm_mine", []);
}

async function waitBlocks(start: number, end: number) {
	console.log(".-.-.-.-.-.-Waiting for blocks to mine.-.-.-.-.-.-");
	for (let i = start; i < end; i++) {
		await ethers.provider.send("evm_mine", []);
	}
}
