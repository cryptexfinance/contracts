// run with
// npx hardhat run ./scripts/proposal.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";

async function main() {
	const ethers = hre.ethers;
	const ONE_DAY = 86500;
	const amount = ethers.utils.parseEther("25.40428051");
	const multisign = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
	console.log("Print proposal DATA for Multisign");
	const abi = new ethers.utils.AbiCoder();
	const targets = [multisign];
	const values = [multisign];
	// @ts-ignore
	const signatures = [""]; // @ts-ignore
	const calldatas = [0x0];
	const description = "June Payroll and Grants ";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let balance = await ethers.provider.getBalance(multisign);
	console.log("Old Balance is: ", ethers.utils.formatEther(balance));

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
		// @ts-ignore
		let tx = await governorContract.propose(targets, values, signatures, calldatas, description);
		console.log(tx);

		// await ethers.provider.send("evm_increaseTime", [1]);
		await ethers.provider.send("evm_mine", []);

		// Vote
		console.log("==================Vote==================");
		tx = await governorContract.castVote(2, true);
		console.log(tx);

		await ethers.provider.send("evm_mine", []);

		// Wait to queue
		console.log("==================Queue==================");
		//block.number <= proposal.endBlock
		let proposal = await governorContract.proposals(2);

		console.log(".-.-.-.-.-.-Waiting for blocks to mine.-.-.-.-.-.-");
		for (let i = ethers.provider.blockNumber; i < proposal.endBlock; i++) {
			await ethers.provider.send("evm_mine", []);
		}
		// await ethers.provider.send("evm_increaseTime", [ONE_DAY * 4]);
		// await ethers.provider.send("evm_mine", []);

		console.log((await governorContract.state(2)).toString());
		tx = await governorContract.queue(2);
		await ethers.provider.send("evm_mine", []);
		console.log(tx);
		// Execute transaction
		console.log("==================Execute Transaction==================");
		proposal = await governorContract.proposals(2);

		// console.log(".-.-.-.-.-.-Waiting for blocks to mine.-.-.-.-.-.-");
		// for (let i = ethers.provider.blockNumber; i < proposal.eta; i++) {
		// 	await ethers.provider.send("evm_mine", []);
		// }
		await ethers.provider.send("evm_increaseTime", [ONE_DAY * 4]);
		await ethers.provider.send("evm_mine", []);
		tx = await governorContract.execute(2);
		console.log(tx);
		await ethers.provider.send("evm_mine", []);
		// Check Ratio
		console.log("==================Check Balance==================");
		balance = await ethers.provider.getBalance(multisign);
		console.log("New Balance is: ", ethers.utils.formatEther(balance));
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
