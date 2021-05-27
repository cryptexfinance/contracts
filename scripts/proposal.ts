// run with
// npx hardhat run ./scripts/proposal.ts --network mainnet
import hre, { deployments, network, hardhatArguments } from "hardhat";

async function main() {
	const ethers = hre.ethers;
	const ONE_DAY = 86500;
	console.log("Print proposal DATA for Multisign");
	let ethVaultHandler = await deployments.get("WETHVaultHandler");
	let orchestrator = await deployments.get("Orchestrator");
	const abi = new ethers.utils.AbiCoder();
	const newRatio = 150;
	const targets = [orchestrator.address];
	const values = [0];
	const signatures = ["setRatio(address,uint256)"];
	const calldatas = [abi.encode(["address", "uint256"], [ethVaultHandler.address, newRatio])];
	const description = "Reduce ETH Vault liquidation ratio to 150%";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	if (hardhatArguments.network === "hardhat") {
		// VB sends us ETH

		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0xab5801a7d398351b8be11c439e05c5b3259aec9b"],
		});

		let signer = await ethers.provider.getSigner("0xab5801a7d398351b8be11c439e05c5b3259aec9b");

		await signer.sendTransaction({
			to: "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35",
			value: ethers.BigNumber.from("100000000000000000"),
		});

		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0xa70b638B70154EdfCbb8DbbBd04900F328F32c35"],
		});
		signer = await ethers.provider.getSigner("0xa70b638B70154EdfCbb8DbbBd04900F328F32c35");

		let governor = await deployments.get("GovernorAlpha");
		let governorContract = await ethers.getContractAt("GovernorAlpha", governor.address, signer);

		// Create Proposal

		console.log("==================Create Proposal==================");
		let tx = await governorContract.propose(targets, values, signatures, calldatas, description);
		console.log(tx);

		// await ethers.provider.send("evm_increaseTime", [1]);
		await ethers.provider.send("evm_mine", []);

		// Vote
		console.log("==================Vote==================");
		tx = await governorContract.castVote(1, true);
		console.log(tx);

		await ethers.provider.send("evm_mine", []);

		// Wait to queue
		console.log("==================Queue==================");
		//block.number <= proposal.endBlock
		let proposal = await governorContract.proposals(1);

		console.log(".-.-.-.-.-.-Waiting for blocks to mine.-.-.-.-.-.-");
		for (let i = ethers.provider.blockNumber; i < proposal.endBlock; i++) {
			await ethers.provider.send("evm_mine", []);
		}
		// await ethers.provider.send("evm_increaseTime", [ONE_DAY * 4]);
		// await ethers.provider.send("evm_mine", []);

		console.log((await governorContract.state(1)).toString());
		tx = await governorContract.queue(1);
		await ethers.provider.send("evm_mine", []);
		console.log(tx);
		// Execute transaction
		console.log("==================Execute Transaction==================");
		proposal = await governorContract.proposals(1);

		// console.log(".-.-.-.-.-.-Waiting for blocks to mine.-.-.-.-.-.-");
		// for (let i = ethers.provider.blockNumber; i < proposal.eta; i++) {
		// 	await ethers.provider.send("evm_mine", []);
		// }
		await ethers.provider.send("evm_increaseTime", [ONE_DAY * 4]);
		await ethers.provider.send("evm_mine", []);
		tx = await governorContract.execute(1);
		console.log(tx);
		await ethers.provider.send("evm_mine", []);
		// Check Ratio
		console.log("==================Check Ratio==================");
		let vaultContract = await ethers.getContractAt(
			"ETHVaultHandler",
			ethVaultHandler.address,
			signer
		);
		const ratio = await vaultContract.ratio();
		console.log("RATIO IS: ", ratio.toString());
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
