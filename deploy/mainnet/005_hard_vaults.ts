import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const hardVaults: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "mainnet") {
		console.log("=====Hardmode Mainnet Deploy=====");
		const { log } = deployments;

		const hardETHVaultHandler = await deployments.getOrNull("HardETHVaultHandler");
		const hardDAIVaultHandler = await deployments.getOrNull("HardDAIVaultHandler");
		const hardUSDCVaultHandler = await deployments.getOrNull("HardUSDCVaultHandler");

		const namedAccounts = await hre.getNamedAccounts();
		const orchestrator = "0x373c74bce7893097ab26d22f05691907d4f2c18e";
		const divisor = "10000000000";
		const ratio = "110";
		const burnFee = "1";
		const liquidationPenalty = "5";
		const tcapOracle = "0xa4e581BD159B869e8290707A7FBF841fe7FE97b6";
		const tcapAddress = "0x16c52ceece2ed57dad87319d91b5e3637d50afa4";
		const ethOracle = "0x2cFeaf282FE9ae050b210e7BDa65D288C40c6104";
		const daiOracle = "0x6b5a75f38BeA1Ef59Bc43A5d9602e77Bcbe65e46";
		let USDCOracleDeployment = await deployments.get("UsdcOracle");
		const usdcOracle = USDCOracleDeployment.address;
		const treasury = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8"; // Timelock

		let WETHContract = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
		let DAIContract = "0x6b175474e89094c44da98b954eedeac495271d0f";
		let USDCContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";


		if (!hardETHVaultHandler) {
			const hardETHVaultHandlerDeployment = await deployments.deploy("HardETHVaultHandler", {
				contract: "ETHVaultHandler",
				from: namedAccounts.deployer,
				args: [
					orchestrator,
					divisor,
					ratio,
					burnFee,
					liquidationPenalty,
					tcapOracle,
					tcapAddress,
					WETHContract,
					ethOracle,
					ethOracle,
					treasury,
					0
				],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`HardETHVaultHandler deployed at ${hardETHVaultHandlerDeployment.address} for ${hardETHVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("HardETHVaultHandler already deployed");
		}


		if (!hardDAIVaultHandler) {
			const hardDAIVaultHandlerDeployment = await deployments.deploy("HardDAIVaultHandler", {
				contract: "ERC20VaultHandler",
				from: namedAccounts.deployer,
				args: [
					orchestrator,
					divisor,
					ratio,
					burnFee,
					liquidationPenalty,
					tcapOracle,
					tcapAddress,
					DAIContract,
					daiOracle,
					ethOracle,
					treasury,
					0
				],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`hardDAIVaultHandler deployed at ${hardDAIVaultHandlerDeployment.address} for ${hardDAIVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("hardDAIVaultHandler already deployed");
		}

		if (!hardUSDCVaultHandler) {
			const hardUSDCVaultHandlerDeployment = await deployments.deploy("HardUSDCVaultHandler", {
				contract: "ERC20VaultHandler",
				from: namedAccounts.deployer,
				args: [
					orchestrator,
					divisor,
					ratio,
					burnFee,
					liquidationPenalty,
					tcapOracle,
					tcapAddress,
					USDCContract,
					usdcOracle,
					ethOracle,
					treasury,
					0
				],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`hardUSDCVaultHandler deployed at ${hardUSDCVaultHandlerDeployment.address} for ${hardUSDCVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("hardUSDCVaultHandler already deployed");
		}

	}
};

export default hardVaults;
