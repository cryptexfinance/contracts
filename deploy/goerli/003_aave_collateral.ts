import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const aaveVaultHandler: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "goerli") {
		console.log("=====Goerli Deploy=====");
		const { log } = deployments;

		const aaveVaultHandler = await deployments.getOrNull("AaveVaultHandler");
		let aaveOracle = await deployments.getOrNull("AaveOracle");

		const namedAccounts = await hre.getNamedAccounts();
		const orchestrator = "0xf6bbed61b6118f5f6df4DF1bDc6e8fd598057F14";
		const divisor = "10000000000";
		const ratio = "200";
		const burnFee = "1";
		const liquidationPenalty = "10";
		const tcapOracle = "0xFe36935D83109D389E0a71A3b83464D5905131Ac";
		const tcapAddress = "0xE181E0E3254c061E65F1Ad32DD2c3e1Da192fb48";
		const aaveContract = await deployments.getOrNull("AAVE");
		const collateralAddress = aaveContract?.address;
		const ethOracle = "0x73e29C6b575d371E63CCA22D1894966699CC5c19";
		const rewardHandler = ethers.constants.AddressZero;
		const treasury = "0xeCfaAE58487B64d777cDc8fb9f9e3B154f5563F1"; // Timelock
		const aaveAggregator = "0xb4c4a493AB6356497713A78FFA6c60FB53517c63"; // link chainlink feed instead of aave chainlink feed

		if (!aaveOracle) {
			const aaveOracleDeployment = await deployments.deploy("AaveOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				args: [aaveAggregator, treasury],
				skipIfAlreadyDeployed: true,
				log: true,
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
