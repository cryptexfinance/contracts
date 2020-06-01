import {buidlerArguments} from "@nomiclabs/buidler";

require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "ganache") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		log("Ganache found, deploying test contracts");
		const price = process.env.PRICE;
		let Oracle;
		try {
			Oracle = await deployments.get("Oracle");
		} catch (error) {
			log(error.message);
		}
		if (!Oracle) {
			const deployResult = await deployIfDifferent(
				["data"],
				"Oracle",
				{from: deployer, gas: 4000000},
				"Oracle",
				price
			);
			Oracle = await deployments.get("Oracle");
			if (deployResult.newlyDeployed) {
				log(`Oracle deployed at ${Oracle.address} for ${deployResult.receipt.gasUsed}`);
			}
		}

		let Stablecoin;
		try {
			Stablecoin = await deployments.get("Stablecoin");
		} catch (error) {
			log(error.message);
		}
		if (!Stablecoin) {
			const deployResult = await deployIfDifferent(
				["data"],
				"Stablecoin",
				{from: deployer, gas: 4000000},
				"Stablecoin"
			);
			Stablecoin = await deployments.get("Stablecoin");
			if (deployResult.newlyDeployed) {
				log(`Stablecoin deployed at ${Stablecoin.address} for ${deployResult.receipt.gasUsed}`);
			}
		}
	}
};
module.exports.tags = ["Oracle", "Stablecoin"];
