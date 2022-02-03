import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const Vaults: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "optimism") {
		const { log } = deployments;

		const namedAccounts = await hre.getNamedAccounts();
		const optimisticOrchestrator = await deployments.getOrNull("OptimisticOrchestrator");
		const tcap = await deployments.getOrNull("TCAP");
		const optimisticTreasury = await deployments.getOrNull("OptimisticTreasury");

		// Vaults
		const wethVaultHandler = await deployments.getOrNull("WETHVaultHandler");
		const daiVaultHandler = await deployments.getOrNull("DAIVaultHandler");
		// const aaveVaultHandler = await deployments.getOrNull("AAVEVaultHandler");
		const linkVaultHandler = await deployments.getOrNull("LINKVaultHandler");
		const uniVaultHandler = await deployments.getOrNull("UNIVaultHandler");
		const snxVaultHandler = await deployments.getOrNull("SNXVaultHandler");
		// const crvVaultHandler = await deployments.getOrNull("CRVVaultHandler");

		// Oracles
		// Check contracts here https://docs.chain.link/docs/optimism-price-feeds/
		const tcapOracle = await deployments.getOrNull("TCAPOracle");
		const daiOracle = await deployments.getOrNull("DAIOracle");
		// const aaveOracle = await deployments.getOrNull("AAVEOracle");
		const ethOracle = await deployments.getOrNull("ETHOracle");
		const linkOracle = await deployments.getOrNull("LINKOracle");
		const uniOracle = await deployments.getOrNull("UNIOracle");
		const snxOracle = await deployments.getOrNull("SNXOracle");
		// const crvOracle = await deployments.getOrNull("CRVOracle");

		if (optimisticOrchestrator && tcap && tcapOracle && ethOracle && optimisticTreasury) {
			//Vault variables
			const orchestratorAddress = optimisticOrchestrator.address;
			const divisor = "10000000000";
			const ratio = "200";
			const burnFee = "1";
			const liquidationPenalty = "10";
			const assetOracle = tcapOracle.address;
			const tcapAddress = tcap.address;
			const feeOracle = ethOracle.address;
			const rewardHandler = hre.ethers.constants.AddressZero;
			const treasury = optimisticTreasury.address;

			if (!wethVaultHandler) {
				const collateralAddress = "0x4200000000000000000000000000000000000006";
				const collateralOracle = ethOracle.address;
				const wethRatio = "150";
				const deployResult = await deployments.deploy("WETHVaultHandler", {
					contract: "ETHVaultHandler",
					from: namedAccounts.deployer,
					skipIfAlreadyDeployed: true,
					log: true,
					args: [
						orchestratorAddress,
						divisor,
						wethRatio,
						burnFee,
						liquidationPenalty,
						assetOracle,
						tcapAddress,
						collateralAddress,
						collateralOracle,
						feeOracle,
						rewardHandler,
						treasury,
					],
				});
				log(
					`WETHVaultHandler deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
				);
			} else {
				log("WETHVaultHandler already deployed");
			}

			if (!daiVaultHandler && daiOracle) {
				const collateralAddress = "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1";
				const collateralOracle = daiOracle.address;
				const deployResult = await deployments.deploy("DAIVaultHandler", {
					contract: "ERC20VaultHandler",
					from: namedAccounts.deployer,
					skipIfAlreadyDeployed: true,
					log: true,
					args: [
						orchestratorAddress,
						divisor,
						ratio,
						burnFee,
						liquidationPenalty,
						assetOracle,
						tcapAddress,
						collateralAddress,
						collateralOracle,
						feeOracle,
						rewardHandler,
						treasury,
					],
				});
				log(
					`DAIVaultHandler deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
				);
			} else {
				log("DAIVaultHandler already deployed");
			}

			// AAVE not deployed on optimism yet
			// if (!aaveVaultHandler && aaveOracle) {
			// 	const collateralAddress = "";
			// 	const collateralOracle = aaveOracle.address;
			// 	const deployResult = await deployments.deploy("AAVEVaultHandler", {
			// 		contract: "ERC20VaultHandler",
			// 		from: namedAccounts.deployer,
			// 		skipIfAlreadyDeployed: true,
			// 		log: true,
			// 		args: [
			// 			orchestratorAddress,
			// 			divisor,
			// 			ratio,
			// 			burnFee,
			// 			liquidationPenalty,
			// 			assetOracle,
			// 			tcapAddress,
			// 			collateralAddress,
			// 			collateralOracle,
			// 			feeOracle,
			// 			rewardHandler,
			// 			treasury,
			// 		],
			// 	});
			// 	log(
			// 		`AAVEVaultHandler deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
			// 	);
			// } else {
			// 	log("AAVEVaultHandler already deployed");
			// }

			if (!linkVaultHandler && linkOracle) {
				const collateralAddress = "0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6";
				const collateralOracle = linkOracle.address;
				const deployResult = await deployments.deploy("LINKVaultHandler", {
					contract: "ERC20VaultHandler",
					from: namedAccounts.deployer,
					skipIfAlreadyDeployed: true,
					log: true,
					args: [
						orchestratorAddress,
						divisor,
						ratio,
						burnFee,
						liquidationPenalty,
						assetOracle,
						tcapAddress,
						collateralAddress,
						collateralOracle,
						feeOracle,
						rewardHandler,
						treasury,
					],
				});
				log(
					`LINKVaultHandler deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
				);
			} else {
				log("LINKVaultHandler already deployed");
			}

			if (!uniVaultHandler && uniOracle) {
				const collateralAddress = "0x6fd9d7ad17242c41f7131d257212c54a0e816691";
				const collateralOracle = uniOracle.address;
				const deployResult = await deployments.deploy("UNIVaultHandler", {
					contract: "ERC20VaultHandler",
					from: namedAccounts.deployer,
					skipIfAlreadyDeployed: true,
					log: true,
					args: [
						orchestratorAddress,
						divisor,
						ratio,
						burnFee,
						liquidationPenalty,
						assetOracle,
						tcapAddress,
						collateralAddress,
						collateralOracle,
						feeOracle,
						rewardHandler,
						treasury,
					],
				});
				log(
					`UNIVaultHandler deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
				);
			} else {
				log("UNIVaultHandler already deployed");
			}

			if (!snxVaultHandler && snxOracle) {
				const collateralAddress = "0x8700daec35af8ff88c16bdf0418774cb3d7599b4";
				const collateralOracle = snxOracle.address;
				const deployResult = await deployments.deploy("SNXVaultHandler", {
					contract: "ERC20VaultHandler",
					from: namedAccounts.deployer,
					skipIfAlreadyDeployed: true,
					log: true,
					args: [
						orchestratorAddress,
						divisor,
						ratio,
						burnFee,
						liquidationPenalty,
						assetOracle,
						tcapAddress,
						collateralAddress,
						collateralOracle,
						feeOracle,
						rewardHandler,
						treasury,
					],
				});
				log(
					`SNXVaultHandler deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
				);
			} else {
				log("SNXVaultHandler already deployed");
			}

			// CRV not live on optimism
			// if (!crvVaultHandler && crvOracle) {
			// 	const collateralAddress = "";
			// 	const collateralOracle = crvOracle.address;
			// 	const deployResult = await deployments.deploy("CRVVaultHandler", {
			// 		contract: "ERC20VaultHandler",
			// 		from: namedAccounts.deployer,
			// 		skipIfAlreadyDeployed: true,
			// 		log: true,
			// 		args: [
			// 			orchestratorAddress,
			// 			divisor,
			// 			ratio,
			// 			burnFee,
			// 			liquidationPenalty,
			// 			assetOracle,
			// 			tcapAddress,
			// 			collateralAddress,
			// 			collateralOracle,
			// 			feeOracle,
			// 			rewardHandler,
			// 			treasury,
			// 		],
			// 	});
			// 	log(
			// 		`CRVVaultHandler deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
			// 	);
			// } else {
			// 	log("CRVVaultHandler already deployed");
			// }
		}
	}
};

export default Vaults;
