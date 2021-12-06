import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const aaveVaultHandler: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "mainnet") {
		console.log("=====Mainnet Deploy=====");
		const { log } = deployments;

		const aaveVaultHandler = await deployments.getOrNull("AaveVaultHandler");
		let aaveOracle = await deployments.getOrNull("AaveOracle");

		const namedAccounts = await hre.getNamedAccounts();
		const orchestrator = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";
		const divisor = "10000000000";
		const ratio = "200";
		const burnFee = "1";
		const liquidationPenalty = "10";
		const tcapOracle = "0xa4e581BD159B869e8290707A7FBF841fe7FE97b6";
		const tcapAddress = "0x16c52ceece2ed57dad87319d91b5e3637d50afa4";
		const collateralAddress = "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9";
		const ethOracle = "0x2cFeaf282FE9ae050b210e7BDa65D288C40c6104";
		const rewardHandler = ethers.constants.AddressZero;
		const treasury = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8"; // Timelock
		const aaveAggregator = "0x547a514d5e3769680ce22b2361c10ea13619e8a9";

		if (!aaveOracle) {
			const aaveOracleDeployment = await deployments.deploy("AaveOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				args: [aaveAggregator, treasury],
				skipIfAlreadyDeployed: true,
				log: true,
				nonce: 68,
			});
			log(
				`AaveOracle deployed at ${aaveOracleDeployment.address} for ${aaveOracleDeployment.receipt?.gasUsed}`
			);
		} else {
			log("AaveOracle already deployed");
		}
		aaveOracle = await deployments.getOrNull("AaveOracle");

		if (!aaveVaultHandler && aaveOracle) {
			const aaveVaultHandlerDeployment = await deployments.deploy("AaveVaultHandler", {
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
					collateralAddress,
					aaveOracle.address,
					ethOracle,
					rewardHandler,
					treasury,
				],
				skipIfAlreadyDeployed: true,
				log: true,
				nonce: 69,
			});
			log(
				`AaveVaultHandler deployed at ${aaveVaultHandlerDeployment.address} for ${aaveVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("AaveVaultHandler already deployed");
		}
	}
};

export default aaveVaultHandler;
