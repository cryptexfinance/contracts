import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Stablecoin} from "../typechain/Stablecoin";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		log(`${buidlerArguments.network} found, deploying mockup stablecoin contracts`);

		//Deploy Mock Stablecoins
		let DAI, USDC, USDT, WETH;
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
		}

		try {
			USDC = await deployments.get("USDC");
		} catch (error) {
			log(error.message);

			const deployResult = await deployIfDifferent(
				["data"],
				"USDC",
				{from: deployer, gas: 4000000},
				"USDC"
			);
			USDC = await deployments.get("USDC");
			if (deployResult.newlyDeployed) {
				log(`USDC deployed at ${USDC.address} for ${deployResult.receipt.gasUsed}`);
			}

			let USDCContract = await ethersBuidler.getContract("USDC");
			let stableAbi = USDCContract.interface;
			let stable = new ethers.Contract(USDC.address, stableAbi, USDCContract.signer) as Stablecoin;
			await stable.mint(deployer, ethers.utils.parseEther("100"));
		}

		try {
			USDT = await deployments.get("USDT");
		} catch (error) {
			log(error.message);

			const deployResult = await deployIfDifferent(
				["data"],
				"USDT",
				{from: deployer, gas: 4000000},
				"USDT"
			);
			USDT = await deployments.get("USDT");
			if (deployResult.newlyDeployed) {
				log(`USDT deployed at ${USDT.address} for ${deployResult.receipt.gasUsed}`);
			}

			let USDTContract = await ethersBuidler.getContract("USDT");
			let stableAbi = USDTContract.interface;
			let stable = new ethers.Contract(USDT.address, stableAbi, USDTContract.signer) as Stablecoin;
			await stable.mint(deployer, ethers.utils.parseEther("100"));
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

			let WETHContract = await ethersBuidler.getContract("WETH");
			let stableAbi = WETHContract.interface;
			let stable = new ethers.Contract(WETH.address, stableAbi, WETHContract.signer) as Stablecoin;
			await stable.mint(deployer, ethers.utils.parseEther("100"));
		}
	}
};
module.exports.tags = ["DAI", "USDC", "USDT", "WETH"];
