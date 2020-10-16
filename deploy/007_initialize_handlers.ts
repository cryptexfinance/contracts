import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";

// import OrchestratorFactory from "../typechain/OrchestratorFactory";
require("dotenv").config();
module.exports = async ({deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let BTCHandler = await deployments.get("BTCVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("Orchestrator");
		let tcap = await deployments.get("TCAP");

		let DAIContract = await deployments.get("DAI");
		let BTCContract = await deployments.get("WBTC");
		let WETHContract = await deployments.get("WETH");

		let divisor = process.env.DIVISOR as string;
		let ratio = process.env.RATIO as string;
		let burnFee = process.env.BURN_FEE as string;
		let liquidationPenalty = process.env.LIQUIDATION_PENALTY as string;

		let tcapOracle = await deployments.get("TCAPOracle");
		let priceFeedETH = await deployments.get("WETHOracle");
		let priceFeedBTC = await deployments.get("BTCOracle");
		let priceFeedDAI = await deployments.get("DAIOracle");

		let dai = await ethersBuidler.getContractAt("ERC20VaultHandler", DAIHandler.address);
		let btc = await ethersBuidler.getContractAt("ERC20VaultHandler", BTCHandler.address);
		let weth = await ethersBuidler.getContractAt("ETHVaultHandler", WETHHandler.address);
		let orchestrator = await ethersBuidler.getContractAt(
			"Orchestrator",
			OrchestratorDeployment.address
		);

		console.log("intializing dai vault", dai.address);
		await orchestrator.initializeVault(
			dai.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracle.address,
			tcap.address,
			DAIContract.address,
			priceFeedDAI.address,
			priceFeedETH.address
		);

		console.log("intializing weth vault", weth.address);
		await orchestrator.initializeVault(
			weth.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracle.address,
			tcap.address,
			WETHContract.address,
			priceFeedETH.address,
			priceFeedETH.address
		);

		console.log("intializing wbtc vault", btc.address);
		await orchestrator.initializeVault(
			btc.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracle.address,
			tcap.address,
			BTCContract.address,
			priceFeedBTC.address,
			priceFeedETH.address
		);
		// console.log("setting token address", tcap.address);
		// await dai.setTCAPContract(tcap.address);
		// await btc.setTCAPContract(tcap.address);
		// await weth.setTCAPContract(tcap.address);

		// console.log("setting collateral address");
		// await dai.setCollateralContract(DAIContract.address);
		// await btc.setCollateralContract(BTCContract.address);
		// await weth.setCollateralContract(WETHContract.address);

		// console.log("setting the divisor", divisor);
		// await dai.setDivisor(divisor);
		// await btc.setDivisor(divisor);
		// await weth.setDivisor(divisor);

		// console.log("setting ratio", ratio);
		// await dai.setRatio(ratio);
		// await btc.setRatio(ratio);
		// await weth.setRatio(ratio);

		// console.log("setting burn fee", burnFee);
		// await dai.setBurnFee(burnFee);
		// await btc.setBurnFee(burnFee);
		// await weth.setBurnFee(burnFee);

		// console.log("setting liquidation penalty", liquidationPenalty);
		// await dai.setLiquidationPenalty(liquidationPenalty);
		// await btc.setLiquidationPenalty(liquidationPenalty);
		// await weth.setLiquidationPenalty(liquidationPenalty);

		// console.log("setting TCAP oracle", tcapOracle.address);
		// await dai.setTCAPOracle(tcapOracle.address);
		// await btc.setTCAPOracle(tcapOracle.address);
		// await weth.setTCAPOracle(tcapOracle.address);

		// console.log("setting Collateral");
		// await dai.setCollateralPriceOracle(priceFeedDAI.address);
		// await btc.setCollateralPriceOracle(priceFeedBTC.address);
		// await weth.setCollateralPriceOracle(priceFeedETH.address);
	}
};
module.exports.tags = ["Initialize"];
