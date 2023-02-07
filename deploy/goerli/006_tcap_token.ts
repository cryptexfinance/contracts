import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "goerli") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();
		const name = process.env.NAME;
		const symbol = process.env.SYMBOL;

		let orchestrator = await deployments.get("Orchestrator");

		let TCAP;
		try {
			TCAP = await deployments.get("TCAP");
		} catch (error: any) {
			log(error.message);

			const deployResult = await deployments.deploy(
					"TCAP",
					{
							from: deployer,
							contract: "TCAP",
							args: [
								name,
								symbol,
								0,
								orchestrator.address
							],
							skipIfAlreadyDeployed: true,
					}
			);
			TCAP = await deployments.get("TCAP");
			if (deployResult.newlyDeployed) {
				log(`TCAP deployed at ${TCAP.address} for ${deployResult.receipt.gasUsed}`);
			}
		}
	}
};
module.exports.tags = ["TCAP"];
