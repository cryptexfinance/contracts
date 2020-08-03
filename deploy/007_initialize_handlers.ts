import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {VaultHandler} from "../typechain/VaultHandler";
require("dotenv").config();
module.exports = async ({deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let BTCHandler = await deployments.get("BTCVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let tcapx = await deployments.get("TCAPX");

		let divisor = process.env.DIVISOR as string;
		let ratio = process.env.RATIO as string;
		let burnFee = process.env.BURN_FEE as string;
		let liquidationPenalty = process.env.LIQUIDATION_PENALTY as string;
		let whitelistString = process.env.WHITELIST as string;
		let whitelist = true;
		if (whitelistString == "false") {
			whitelist = false;
		}
		let tcapOracle = await deployments.get("TCAPOracle");
		let priceFeedETH = await deployments.get("WETHOracle");
		let priceFeedBTC = await deployments.get("BTCOracle");
		let priceFeedDAI = await deployments.get("DAIOracle");

		let daiHandlerContract = await ethersBuidler.getContract("VaultHandler");
		let btcHandlerContract = await ethersBuidler.getContract("VaultHandler");
		let wethHandlerContract = await ethersBuidler.getContract("VaultHandler");

		let DAIContract = await deployments.get("DAI");
		let BTCContract = await deployments.get("WBTC");
		let WETHContract = await deployments.get("WETH");

		let dai = new ethers.Contract(
			DAIHandler.address,
			daiHandlerContract.interface,
			daiHandlerContract.signer
		) as VaultHandler;

		let btc = new ethers.Contract(
			BTCHandler.address,
			btcHandlerContract.interface,
			btcHandlerContract.signer
		) as VaultHandler;

		let weth = new ethers.Contract(
			WETHHandler.address,
			wethHandlerContract.interface,
			wethHandlerContract.signer
		) as VaultHandler;

		console.log("setting token address", tcapx.address);
		await dai.setTCAPXContract(tcapx.address);
		await btc.setTCAPXContract(tcapx.address);
		await weth.setTCAPXContract(tcapx.address);

		console.log("setting collateral address");
		await dai.setCollateralContract(DAIContract.address);
		await btc.setCollateralContract(BTCContract.address);
		await weth.setCollateralContract(WETHContract.address);

		console.log("setting the divisor", divisor);
		await dai.setDivisor(divisor);
		await btc.setDivisor(divisor);
		await weth.setDivisor(divisor);

		console.log("setting ratio", ratio);
		await dai.setRatio(ratio);
		await btc.setRatio(ratio);
		await weth.setRatio(ratio);

		console.log("setting burn fee", burnFee);
		await dai.setBurnFee(burnFee);
		await btc.setBurnFee(burnFee);
		await weth.setBurnFee(burnFee);

		console.log("setting liquidation penalty", liquidationPenalty);
		await dai.setLiquidationPenalty(liquidationPenalty);
		await btc.setLiquidationPenalty(liquidationPenalty);
		await weth.setLiquidationPenalty(liquidationPenalty);

		console.log("setting TCAP oracle", tcapOracle.address);
		await dai.setTCAPOracle(tcapOracle.address);
		await btc.setTCAPOracle(tcapOracle.address);
		await weth.setTCAPOracle(tcapOracle.address);

		console.log("setting Collateral");
		await dai.setCollateralPriceOracle(priceFeedDAI.address);
		await btc.setCollateralPriceOracle(priceFeedBTC.address);
		await weth.setCollateralPriceOracle(priceFeedETH.address);

		if (!whitelist) {
			console.log("setting whitelist", whitelist);
			await dai.enableWhitelist(whitelist);
			await btc.enableWhitelist(whitelist);
			await weth.enableWhitelist(whitelist);
		}
	}
};
module.exports.tags = ["Initialize"];
