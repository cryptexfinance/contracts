import {buidlerArguments} from "@nomiclabs/buidler";
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let handlerContract;
		try {
			handlerContract = await deployments.get("DAITokenHandler");
		} catch (error) {
			try {
				const deployResult = await deployIfDifferent(
					["data"],
					"DAITokenHandler",
					{from: deployer, gas: 4000000},
					"DAITokenHandler"
				);
				handlerContract = await deployments.get("DAITokenHandler");
				if (deployResult.newlyDeployed) {
					log(
						`DAITokenHandler deployed at ${handlerContract.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["DAITokenHandler"];
