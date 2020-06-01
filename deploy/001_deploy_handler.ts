module.exports = async ({getNamedAccounts, deployments}: any) => {
	const {deployIfDifferent, log} = deployments;
	const {deployer} = await getNamedAccounts();

	let handlerContract;
	try {
		handlerContract = await deployments.get("TokenHandler");
	} catch (error) {
		log(error.message);
	}
	if (!handlerContract) {
		const deployResult = await deployIfDifferent(
			["data"],
			"TokenHandler",
			{from: deployer, gas: 4000000},
			"TokenHandler"
		);
		handlerContract = await deployments.get("TokenHandler");
		if (deployResult.newlyDeployed) {
			log(
				`TokenHandler deployed at ${handlerContract.address} for ${deployResult.receipt.gasUsed}`
			);
		}
	}
};
module.exports.tags = ["TokenHandler"];
