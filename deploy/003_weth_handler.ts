import {buidlerArguments} from "@nomiclabs/buidler";
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let handlerContract;
		try {
			handlerContract = await deployments.get("WETHVaultHandler");
		} catch (error) {
			log(error.message);
			try {
				const deployResult = await deployIfDifferent(
					["data"],
					"WETHVaultHandler",
					{from: deployer, gas: 5000000},
					"VaultHandler"
				);
				handlerContract = await deployments.get("WETHVaultHandler");
				if (deployResult.newlyDeployed) {
					log(
						`WETHVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["WETHVaultHandler"];
