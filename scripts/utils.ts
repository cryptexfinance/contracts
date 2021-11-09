import { Contract, Signer } from "ethers";
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { Deployment } from "hardhat-deploy/dist/types";

const ethers = hre.ethers;
let signer: Signer;
let governor: Deployment;
let governorContract: Contract;

const initialize = async () => {
	signer = ethers.provider.getSigner("0xa70b638B70154EdfCbb8DbbBd04900F328F32c35");
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
		params: ["0xab5801a7d398351b8be11c439e05c5b3259aec9b"],
	});

	let vbSigner = ethers.provider.getSigner("0xab5801a7d398351b8be11c439e05c5b3259aec9b");

	await vbSigner.sendTransaction({
		to: "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35",
		value: ethers.BigNumber.from(amount),
	});

	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: ["0xa70b638B70154EdfCbb8DbbBd04900F328F32c35"],
	});
}

export async function createProposal(
	targets: string[],
	values: number[],
	signatures: string[],
	calldatas: string[],
	description: string
) {
	if (!governor) {
		await initialize();
	}

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
