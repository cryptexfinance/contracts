// run with
// npx hardhat run ./scripts/CIP-2.ts --network hardhat
import hre, {deployments, network, hardhatArguments} from "hardhat";
import {castVote, createProposal, executeProposal, fundMultisign, queueProposal} from "./utils";

async function main() {
	const ethers = hre.ethers;
	const governor = await deployments.get("GovernorBeta");
	const timelock = await deployments.get("Timelock");
	const abi = new ethers.utils.AbiCoder();
	const targets = [timelock.address];
	const values = [0];
	const signatures = ["setPendingAdmin(address)"];
	const calldatas = [abi.encode(["address"], [governor.address])];
	const description = "CIP-2: Upgrade Governor";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	const timelockContract = await ethers.getContractAt("Timelock", timelock.address);

	let admin = await timelockContract.admin();
	console.log("Old Admin is", admin);

	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(3, true);

		// Wait to queue
		await queueProposal(3);

		// Execute transaction
		await executeProposal(3);

		// Validate Results
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0xa70b638b70154edfcbb8dbbbd04900f328f32c35"],
		});

		let signer = ethers.provider.getSigner("0xa70b638b70154edfcbb8dbbbd04900f328f32c35");

		const governorContract = await ethers.getContractAt("GovernorBeta", governor.address, signer);

		const tx = await governorContract.acceptTimelockAdmin();
		console.log(tx);

		const timelockContract = await ethers.getContractAt("Timelock", timelock.address);
		admin = await timelockContract.admin();
		console.log("New Admin is", admin);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
