import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";
import { ethers } from "ethers";

const hardmodeVaultHandlers: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "rinkeby") {
		console.log("=====Rinkeby Hardmode Vaults Deploy=====");
		const { log } = deployments;

		const hardETHVaultHandler = await deployments.getOrNull("HardETHVaultHandler");

		const namedAccounts = await hre.getNamedAccounts();
		const orchestrator = "0x32ac6dBaf90A4C45f160D13B32fDD10D75D09976";
		const divisor = "10000000000";
		const ratio = "110";
		const burnFee = "1";
		const liquidationPenalty = "5";
		const tcapOracle = "0x87388c142a3848F966FBA7Db22663D9CCa7d8a86";
		const tcapAddress = "0x565224C2b5Bdf33f3970d35f82945075F90128F4";
		const ethOracle = "0x731Aa03C683Afb292732C31c1d50C491B8d8043F";
		const treasury = "0x65a2B1B48b7997a50947E83aaf58E29a54a0B735"; // Timelock

		let WETHContract = await deployments.get("WETH");

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
	}
};

export default hardmodeVaultHandlers;
