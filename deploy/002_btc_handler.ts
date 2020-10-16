import {buidlerArguments} from "@nomiclabs/buidler";
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let handlerContract;
		let orchestrator = await deployments.get("Orchestrator");
		try {
			handlerContract = await deployments.get("BTCVaultHandler");
		} catch (error) {
			try {
				const deployResult = await deployIfDifferent(
					["data"],
					"BTCVaultHandler",
					{from: deployer, gas: 8000000},
					"ERC20VaultHandler",
					orchestrator.address
				);
				handlerContract = await deployments.get("BTCVaultHandler");
				if (deployResult.newlyDeployed) {
					log(
						`BTCVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["BTCVaultHandler"];
