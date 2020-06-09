import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Stablecoin} from "../typechain/Stablecoin";
import {Tcapx} from "../typechain/Tcapx";
import {TokenHandler} from "../typechain/TokenHandler";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "ganache" || buidlerArguments.network === "buidlerevm") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let Oracle;
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
		}
	}
};
module.exports.tags = ["Oracle"];
