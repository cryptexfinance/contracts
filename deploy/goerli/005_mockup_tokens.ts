import { deployments, hardhatArguments } from "hardhat";

require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "goerli") {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();

		log(`${hardhatArguments.network} found, deploying mockup DAI contracts`);

		//Deploy Mock DAIs
		let DAI, WBTC, WETH, USDC;
		try {
			DAI = await deployments.get("DAI");
		} catch (error: any) {
			log(error.message);

			const deployResult = await deployments.deploy("DAI", {
				from: deployer,
				contract: "DAI",
				skipIfAlreadyDeployed: true,
			})
			DAI = await deployments.get("DAI");
			if (deployResult.newlyDeployed) {
				log(`DAI deployed at ${DAI.address} for ${deployResult.receipt.gasUsed}`);
			}
		}

		try {
			WBTC = await deployments.get("WBTC");
		} catch (error: any) {
			log(error.message);

			const deployResult = await deployments.deploy("WBTC", {
				from: deployer,
				contract: "WBTC",
				skipIfAlreadyDeployed: true,
			});

			WBTC = await deployments.get("WBTC");

			if (deployResult.newlyDeployed) {
				log(`BTC deployed at ${WBTC.address} for ${deployResult.receipt.gasUsed}`);
			}
		}

		try {
			WETH = await deployments.get("WETH");
		} catch (error: any) {
			log(error.message);

			const deployResult = await deployments.deploy("WETH", {
				from: deployer,
				contract: "WETH",
				skipIfAlreadyDeployed: true,
			});
			WETH = await deployments.get("WETH");
			if (deployResult.newlyDeployed) {
				log(`WETH deployed at ${WETH.address} for ${deployResult.receipt.gasUsed}`);
			}
		}

		try {
			USDC = await deployments.get("USDC");
		} catch (error: any) {
			log(error.message);

			const deployResult = await deployments.deploy("USDC", {
				from: deployer,
				contract: "USDC",
				skipIfAlreadyDeployed: true,
			});
			USDC = await deployments.get("USDC");
			if (deployResult.newlyDeployed) {
				log(`USDC deployed at ${USDC.address} for ${deployResult.receipt.gasUsed}`);
			}
		}
	}
};
module.exports.tags = ["DAI", "WBTC", "WETH", "USDC"];
