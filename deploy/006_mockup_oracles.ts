import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {PriceFeed} from "../typechain/PriceFeed";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let Oracle, PriceFeed;
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
				PriceFeed = await deployments.get("PriceFeed");
			} catch (error) {
				log(error.message);

				const price = ethers.utils.parseEther(process.env.ETH_PRICE as string);
				const deployResult = await deployIfDifferent(
					["data"],
					"PriceFeed",
					{from: deployer, gas: 4000000},
					"PriceFeed"
				);
				PriceFeed = await deployments.get("PriceFeed");
				if (deployResult.newlyDeployed) {
					log(
						`Price Feed Oracle deployed at ${PriceFeed.address} for ${deployResult.receipt.gasUsed}`
					);
				}
				let priceFeedContract = await ethersBuidler.getContract("PriceFeed");
				let priceContract = new ethers.Contract(
					PriceFeed.address,
					priceFeedContract.interface,
					priceFeedContract.signer
				) as PriceFeed;
				await priceContract.post(price, 0, ethers.constants.AddressZero);
			}
		}
	}
};
module.exports.tags = ["Oracle", "PriceFeed"];
