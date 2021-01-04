import {buidlerArguments} from "@nomiclabs/buidler";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (
		buidlerArguments.network === "rinkeby" ||
		buidlerArguments.network === "ropsten" ||
		buidlerArguments.network === "ganache"
	) {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		log(`${buidlerArguments.network} found, deploying mockup DAI contracts`);

		//Deploy Mock DAIs
		let DAI, WBTC, WETH;
		try {
			DAI = await deployments.get("DAI");
		} catch (error) {
			log(error.message);

			const deployResult = await deployIfDifferent(
				["data"],
				"DAI",
				{from: deployer, gas: 4000000},
				"DAI"
			);
			DAI = await deployments.get("DAI");
			if (deployResult.newlyDeployed) {
				log(`DAI deployed at ${DAI.address} for ${deployResult.receipt.gasUsed}`);
			}

			try {
				WBTC = await deployments.get("WBTC");
			} catch (error) {
				log(error.message);

				const deployResult = await deployIfDifferent(
					["data"],
					"WBTC",
					{from: deployer, gas: 4000000},
					"WBTC"
				);
				WBTC = await deployments.get("WBTC");
				if (deployResult.newlyDeployed) {
					log(`BTC deployed at ${WBTC.address} for ${deployResult.receipt.gasUsed}`);
				}
				try {
					WETH = await deployments.get("WETH");
				} catch (error) {
					log(error.message);

					const deployResult = await deployIfDifferent(
						["data"],
						"WETH",
						{from: deployer, gas: 4000000},
						"WETH"
					);
					WETH = await deployments.get("WETH");
					if (deployResult.newlyDeployed) {
						log(`WETH deployed at ${WETH.address} for ${deployResult.receipt.gasUsed}`);
					}
				}
			}
		}
	}
};
module.exports.tags = ["DAI", "WBTC", "WETH"];
