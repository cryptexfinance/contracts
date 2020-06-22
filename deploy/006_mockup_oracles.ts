import {ethers} from "ethers";
import {buidlerArguments} from "@nomiclabs/buidler";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let Oracle, ETHOracle;
		try {
			Oracle = await deployments.get("Oracle");
		} catch (error) {
			log(error.message);

			const price = process.env.PRICE as string;
			const deployResult = await deployIfDifferent(
				["data"],
				"Oracle",
				{from: deployer, gas: 4000000},
				"Oracle",
				ethers.utils.parseEther(price)
			);
			Oracle = await deployments.get("Oracle");
			if (deployResult.newlyDeployed) {
				log(`Oracle deployed at ${Oracle.address} for ${deployResult.receipt.gasUsed}`);
			}

			try {
				ETHOracle = await deployments.get("ETHOracle");
			} catch (error) {
				log(error.message);

				const price = process.env.ETH_PRICE as string;
				const deployResult = await deployIfDifferent(
					["data"],
					"ETHOracle",
					{from: deployer, gas: 4000000},
					"Oracle",
					ethers.utils.parseEther(price)
				);
				ETHOracle = await deployments.get("ETHOracle");
				if (deployResult.newlyDeployed) {
					log(`ETH Oracle deployed at ${ETHOracle.address} for ${deployResult.receipt.gasUsed}`);
				}
			}
		}
	}
};
module.exports.tags = ["Oracle", "ETHOracle"];
