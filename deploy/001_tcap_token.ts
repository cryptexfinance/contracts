import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (
		hardhatArguments.network === "rinkeby" ||
		hardhatArguments.network === "ropsten" ||
		hardhatArguments.network === "ganache"
	) {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();
		const name = process.env.NAME;
		const symbol = process.env.SYMBOL;
		const decimals = process.env.DECIMALS;

		let orchestrator = await deployments.get("Orchestrator");

		let TCAP;
		try {
			TCAP = await deployments.get("TCAP");
		} catch (error) {
			log(error.message);

			const deployResult = await deployIfDifferent(
				["data"],
				"TCAP",
				{ from: deployer, gas: 4000000 },
				"TCAP",
				name,
				symbol,
				decimals,
				orchestrator.address
			);
			TCAP = await deployments.get("TCAP");
			if (deployResult.newlyDeployed) {
				log(`TCAP deployed at ${TCAP.address} for ${deployResult.receipt.gasUsed}`);
			}
		}
	}
};
module.exports.tags = ["TCAP"];
