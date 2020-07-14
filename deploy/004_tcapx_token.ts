import {buidlerArguments} from "@nomiclabs/buidler";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();
		const name = process.env.NAME;
		const symbol = process.env.SYMBOL;
		const decimals = process.env.DECIMALS;

		let TCAPX;
		try {
			TCAPX = await deployments.get("TCAPX");
		} catch (error) {
			log(error.message);

			const deployResult = await deployIfDifferent(
				["data"],
				"TCAPX",
				{from: deployer, gas: 4000000},
				"TCAPX",
				name,
				symbol,
				decimals
			);
			TCAPX = await deployments.get("TCAPX");
			if (deployResult.newlyDeployed) {
				log(`TCAPX deployed at ${TCAPX.address} for ${deployResult.receipt.gasUsed}`);
			}
		}
	}
};
module.exports.tags = ["TCAPX"];
