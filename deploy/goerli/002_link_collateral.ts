import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const linkVaultHandler: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "goerli") {
		console.log("=====Goerli Deploy=====");
		const { log } = deployments;

		const linkVaultHandler = await deployments.getOrNull("LinkVaultHandler");
		let linkOracle = await deployments.getOrNull("LinkOracle");

		const namedAccounts = await hre.getNamedAccounts();
		const orchestrator = "0xf6bbed61b6118f5f6df4DF1bDc6e8fd598057F14";
		const divisor = "10000000000";
		const ratio = "200";
		const burnFee = "1";
		const liquidationPenalty = "10";
		const tcapOracle = "0xFe36935D83109D389E0a71A3b83464D5905131Ac";
		const tcapAddress = "0xE181E0E3254c061E65F1Ad32DD2c3e1Da192fb48";
		const linkContract = await deployments.getOrNull("LINK");
		const collateralAddress = linkContract?.address;
		const ethOracle = "0x73e29C6b575d371E63CCA22D1894966699CC5c19";
		const rewardHandler = ethers.constants.AddressZero;
		const treasury = "0xeCfaAE58487B64d777cDc8fb9f9e3B154f5563F1"; // Timelock
		const linkAggregator = "0x48731cF7e84dc94C5f84577882c14Be11a5B7456";

		if (!linkOracle) {
			const linkOracleDeployment = await deployments.deploy("LinkOracle", {
				contract: "ChainlinkOracle",
				from: namedAccounts.deployer,
				args: [linkAggregator, treasury],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`LinkOracle deployed at ${linkOracleDeployment.address} for ${linkOracleDeployment.receipt?.gasUsed}`
			);
		} else {
			log("LinkOracle already deployed");
		}
		linkOracle = await deployments.getOrNull("LinkOracle");

		if (!linkVaultHandler && linkOracle) {
			const linkVaultHandlerDeployment = await deployments.deploy("LinkVaultHandler", {
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
					linkOracle.address,
					ethOracle,
					rewardHandler,
					treasury,
				],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`LinkVaultHandler deployed at ${linkVaultHandlerDeployment.address} for ${linkVaultHandlerDeployment.receipt?.gasUsed}`
			);
		} else {
			log("LinkVaultHandler already deployed");
		}
	}
};

export default linkVaultHandler;
