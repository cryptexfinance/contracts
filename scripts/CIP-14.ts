// run with
// npx hardhat run ./scripts/CIP-14.ts --network hardhat
import hre, {deployments, network, hardhatArguments} from "hardhat";
import {castVote, createProposal, executeProposal, fundMultisign, queueProposal} from "./utils";
import {BigNumber} from "ethers";

async function main() {
	const ethers = hre.ethers;

	let orchestratorAddress = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";

	let usdcHardVault = "0xa8CcA36A624215a39D5af6854ac24868559424d3";
	let daiHardVault = "0xA5b3Bb6e1f206624B3B8CE0c6A0f7614fd35Fa03";
	let ethHardVault = "0xc2Ba6B8E0EE3cf48B045D966F1dCda767df74833";
	let wbtcHardVault = "0x2364536F4891Ed560A6728f4B36871de8176eE5c";

    const ethVault = await ethers.getContractAt("ETHVaultHandler",ethHardVault);
    const daiVault = await ethers.getContractAt("ERC20VaultHandler",daiHardVault);
    const usdcVault = await ethers.getContractAt("ERC20VaultHandler",usdcHardVault);
    const wbtcVault = await ethers.getContractAt("ERC20VaultHandler",wbtcHardVault);


	const abi = new ethers.utils.AbiCoder();
	const targets = [orchestratorAddress, orchestratorAddress, orchestratorAddress, orchestratorAddress];
	const values = [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)];
	const signatures = ["setRatio(address,uint256)", "setRatio(address,uint256)", "setRatio(address,uint256)", "setRatio(address,uint256)"];
	const calldatas = [
		abi.encode(["address", "uint256"], [ethHardVault, 125]),
		abi.encode(["address", "uint256"], [usdcHardVault, 125]),
		abi.encode(["address", "uint256"], [daiHardVault, 125]),
		abi.encode(["address", "uint256"], [wbtcHardVault, 125]),
	];
	const description = "CIP-14: Increase Hard Mode Vault Liquidation Ratio to 125%";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let usdcRatio = await usdcVault.ratio();
	console.log(usdcRatio.toString());

	let ethRatio = await ethVault.ratio();
	console.log(ethRatio.toString());

	let daiRatio = await daiVault.ratio();
	console.log(daiRatio.toString());

	let wbtcRatio = await wbtcVault.ratio();
	console.log(wbtcRatio.toString());


	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(7, true);

		// Wait to queue
		await queueProposal(7);

		// Execute transaction
		await executeProposal(7);

		// Validate Results
		console.log("==================Check Results==================");

		usdcRatio = await usdcVault.ratio();
	    console.log(usdcRatio.toString());

        ethRatio = await ethVault.ratio();
        console.log(ethRatio.toString());

        daiRatio = await daiVault.ratio();
        console.log(daiRatio.toString());

        wbtcRatio = await wbtcVault.ratio();
        console.log(wbtcRatio.toString());
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
