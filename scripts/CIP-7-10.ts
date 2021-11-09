// run with
// npx hardhat run ./scripts/CIP-7-10.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { castVote, createProposal, executeProposal, fundMultisign, queueProposal } from "./utils";

async function main() {
	const ethers = hre.ethers;

	const amount = ethers.utils.parseEther("8100");
	const multisig = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
	let ctx = await deployments.get("Ctx");
	let ctxContract = await ethers.getContractAt("Ctx", ctx.address);
	const abi = new ethers.utils.AbiCoder();
	const targets = [ctx.address];
	const values = [0];
	const signatures = ["transfer(address,uint256)"];
	const calldatas = [abi.encode(["address", "uint256"], [multisig, amount])];
	const description =
		"CIP-7: Airdrop early TCAP Testers & CIP-10 Cryptex Community Grants Program Q4";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let balance = await ctxContract.balanceOf(multisig);
	console.log("multisig old CTX balance", ethers.utils.formatEther(balance));

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
		console.log("==================Check Balance==================");
		balance = await ctxContract.balanceOf(multisig);
		console.log("Multisig new CTX balance", ethers.utils.formatEther(balance));
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
