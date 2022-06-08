// run with
// npx hardhat run ./scripts/CIP-5.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { castVote, createProposal, executeProposal, fundMultisign, queueProposal } from "./utils";

async function main() {
	const ethers = hre.ethers;

	const amount = ethers.utils.parseEther("500000");
	const wintermute = "0x4f3a120e72c76c22ae802d129f599bfdbc31cb81";
	const gsr = "0xADeE949D4Bc54baDF9bc7F2F8cD236383D82B413";
	let ctx = await deployments.get("Ctx");
	let ctxContract = await ethers.getContractAt("Ctx", ctx.address);
	const abi = new ethers.utils.AbiCoder();
	const targets = [ctx.address, ctx.address];
	const values = [0, 0];
	const signatures = ["transfer(address,uint256)", "transfer(address,uint256)"];
	const calldatas = [
		abi.encode(["address", "uint256"], [wintermute, amount]),
		abi.encode(["address", "uint256"], [gsr, amount]),
	];
	const description = "CIP-5: Market Making Proposal";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let balance = await ctxContract.balanceOf(wintermute);
	console.log("Wintermute old CTX balance", ethers.utils.formatEther(balance));
	balance = await ctxContract.balanceOf(gsr);
	console.log("GSR old CTX balance", ethers.utils.formatEther(balance));

	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(2, true);

		// Wait to queue
		await queueProposal(2);

		// Execute transaction
		await executeProposal(2);

		// Validate Results
		console.log("==================Check Balance==================");
		balance = await ctxContract.balanceOf(wintermute);
		console.log("Wintermute new CTX balance", ethers.utils.formatEther(balance));
		balance = await ctxContract.balanceOf(gsr);
		console.log("GSR new CTX balance", ethers.utils.formatEther(balance));
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
