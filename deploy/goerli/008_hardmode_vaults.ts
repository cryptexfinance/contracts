import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {deployments, hardhatArguments} from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import {ethers} from "ethers";

const hardmodeVaultHandlers: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "goerli") {
		console.log("=====Goerli Hardmode Vaults Deploy=====");
		const {log} = deployments;

		const hardETHVaultHandler = await deployments.getOrNull("HardETHVaultHandler");
		const hardDAIVaultHandler = await deployments.getOrNull("HardDAIVaultHandler");
		const hardUSDCVaultHandler = await deployments.getOrNull("HardUSDCVaultHandler");

		const namedAccounts = await hre.getNamedAccounts();
		const orchestrator = "0xf6bbed61b6118f5f6df4DF1bDc6e8fd598057F14";
		const divisor = "10000000000";
		const ratio = "110";
		const burnFee = "1";
		const liquidationPenalty = "5";
		const tcapOracle = "0xFe36935D83109D389E0a71A3b83464D5905131Ac";
		const tcapAddress = "0xE181E0E3254c061E65F1Ad32DD2c3e1Da192fb48";
		const ethOracle = "0x73e29C6b575d371E63CCA22D1894966699CC5c19";
		const daiOracle = "0xFA306c9C3d8ED101b331024dDabF53321BCcb40e";
		const usdcOracle = "0x0e7D0a817Ad6693d7ccd9c13389394F8E4F48248";
		const treasury = "0xeCfaAE58487B64d777cDc8fb9f9e3B154f5563F1"; // Timelock

		let WETHContract = await deployments.get("WETH");
		let DAIContract = await deployments.get("DAI");
		let USDCContract = await deployments.get("USDC");

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
					WETHContract.address,
					ethOracle,
					ethOracle,
					treasury,
					0
				],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`HardETHVaultHandlerDeployment deployed at ${hardETHVaultHandlerDeployment.address} for ${hardETHVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("HardETHVaultHandlerDeployment already deployed");
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
					DAIContract.address,
					daiOracle,
					ethOracle,
					treasury,
					0
				],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`hardDAIVaultHandlerDeployment deployed at ${hardDAIVaultHandlerDeployment.address} for ${hardDAIVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("hardDAIVaultHandlerDeployment already deployed");
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
					USDCContract.address,
					usdcOracle,
					ethOracle,
					treasury,
					0
				],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`hardUSDCVaultHandlerDeployment deployed at ${hardUSDCVaultHandlerDeployment.address} for ${hardUSDCVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("hardUSDCVaultHandlerDeployment already deployed");
		}
	}
};

export default hardmodeVaultHandlers;
