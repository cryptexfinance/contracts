import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Dai as Stablecoin} from "../typechain/Dai";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		log(`${buidlerArguments.network} found, deploying mockup stablecoin contracts`);

		//Deploy Mock Stablecoins
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

			let DAIContract = await ethersBuidler.getContract("DAI");
			let stableAbi = DAIContract.interface;
			let stable = new ethers.Contract(DAI.address, stableAbi, DAIContract.signer) as Stablecoin;
			await stable.mint(deployer, ethers.utils.parseEther("100"));

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

				let BTCContract = await ethersBuidler.getContract("WBTC");
				let stableAbi = BTCContract.interface;
				let stable = new ethers.Contract(WBTC.address, stableAbi, BTCContract.signer) as Stablecoin;
				await stable.mint(deployer, ethers.utils.parseEther("100"));
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

					let WETHContract = await ethersBuidler.getContract("WETH");
					let stableAbi = WETHContract.interface;
					let stable = new ethers.Contract(
						WETH.address,
						stableAbi,
						WETHContract.signer
					) as Stablecoin;
					await stable.mint(deployer, ethers.utils.parseEther("100"));
				}
			}
		}
	}
};
module.exports.tags = ["DAI", "WBTC", "WETH"];
