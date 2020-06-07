import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Stablecoin} from "../typechain/Stablecoin";
import {Tcapx} from "../typechain/Tcapx";
import {TokenHandler} from "../typechain/TokenHandler";
import {Usdt} from "../typechain/Usdt";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "ganache" || buidlerArguments.network === "buidlerevm") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		log("Ganache found, deploying test contracts");

		//Deploy multiple Token Handlers
		let usdcHandler;
		try {
			usdcHandler = await deployments.get("USDCHandler");
		} catch (error) {
			log(error.message);
		}
		let deployResult = await deployIfDifferent(
			["data"],
			"USDCHandler",
			{from: deployer, gas: 4000000},
			"TokenHandler"
		);
		usdcHandler = await deployments.get("USDCHandler");
		console.log("usdcHandler", usdcHandler.address);
		if (deployResult.newlyDeployed) {
			log(`USDCHandler deployed at ${usdcHandler.address} for ${deployResult.receipt.gasUsed}`);
		}
		let usdtHandler;
		try {
			usdtHandler = await deployments.get("TokeUSDTHandlernHandler");
		} catch (error) {
			log(error.message);
		}
		deployResult = await deployIfDifferent(
			["data"],
			"USDTHandler",
			{from: deployer, gas: 4000000},
			"TokenHandler"
		);
		usdtHandler = await deployments.get("USDTHandler");
		if (deployResult.newlyDeployed) {
			log(`USDTHandler deployed at ${usdtHandler.address} for ${deployResult.receipt.gasUsed}`);
		}

		const price = process.env.PRICE as string;
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
				ethers.utils.parseEther(price)
			);
			Oracle = await deployments.get("Oracle");
			if (deployResult.newlyDeployed) {
				log(`Oracle deployed at ${Oracle.address} for ${deployResult.receipt.gasUsed}`);
			}
		}

		//Deploy Mock Stablecoins
		let DAI;
		try {
			DAI = await deployments.get("DAI");
		} catch (error) {
			log(error.message);
		}
		if (!DAI) {
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
		let USDC;
		try {
			USDC = await deployments.get("USDC");
		} catch (error) {
			log(error.message);
		}
		if (!USDC) {
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
		let USDT;
		try {
			USDT = await deployments.get("USDT");
		} catch (error) {
			log(error.message);
		}
		if (!USDT) {
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

		//SET DATA
		let TcapxDeployment = await deployments.get("TCAPX");
		let TcapxContract = await ethersBuidler.getContract("TCAPX");
		let tcapxAbi = TcapxContract.interface;
		let tcapx = new ethers.Contract(
			TcapxDeployment.address,
			tcapxAbi,
			TcapxContract.signer
		) as Tcapx;
		console.log("adding token Handlers");

		await tcapx.addTokenHandler(usdcHandler.address);
		await tcapx.addTokenHandler(usdtHandler.address);

		let divisor = process.env.DIVISOR as string;
		let ratio = process.env.RATIO as string;

		let usdtHandlerContract = await ethersBuidler.getContract("TokenHandler");
		let handlerAbi = usdtHandlerContract.interface;
		let handler = new ethers.Contract(
			usdtHandler.address,
			handlerAbi,
			usdtHandlerContract.signer
		) as TokenHandler;

		console.log("setting token address", TcapxDeployment.address);
		await handler.setTCAPXContract(TcapxDeployment.address);
		let USDTContract = await deployments.get("USDT");
		console.log("setting collateral address", USDTContract.address);
		await handler.setCollateralContract(USDTContract.address);
		console.log("setting the divisor", divisor);
		await handler.setDivisor(divisor);
		console.log("setting ratio", ratio);
		await handler.setRatio(ratio);

		let usdcHandlerContract = await ethersBuidler.getContract("TokenHandler");
		handlerAbi = usdtHandlerContract.interface;
		handler = new ethers.Contract(
			usdcHandler.address,
			handlerAbi,
			usdcHandlerContract.signer
		) as TokenHandler;

		console.log("setting token address", TcapxDeployment.address);
		await handler.setTCAPXContract(TcapxDeployment.address);
		let USDCContract = await deployments.get("USDC");
		console.log("setting collateral address", USDCContract.address);
		await handler.setCollateralContract(USDCContract.address);
		console.log("setting the divisor", divisor);
		await handler.setDivisor(divisor);
		console.log("setting ratio", ratio);
		await handler.setRatio(ratio);
	}
};
module.exports.tags = ["Oracle", "DAI", "USDC", "USDT"];
