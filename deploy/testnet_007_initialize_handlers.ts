import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {VaultHandler} from "../typechain/VaultHandler";
require("dotenv").config();
module.exports = async ({deployments}: any) => {
	if (
		buidlerArguments.network === "goerli" ||
		buidlerArguments.network === "ganache" ||
		buidlerArguments.network === "buidlerevm"
	) {
		let DAIHandler = await deployments.get("DAITokenHandler");
		let USDCHandler = await deployments.get("USDCTokenHandler");
		let USDTHandler = await deployments.get("USDTTokenHandler");
		let WETHHandler = await deployments.get("WETHTokenHandler");
		let tcapx = await deployments.get("TCAPX");

		let divisor = process.env.DIVISOR as string;
		let ratio = process.env.RATIO as string;
		let burnFee = process.env.BURN_FEE as string;
		let whitelistString = process.env.WHITELIST as string;
		let whitelist = true;
		if (whitelistString == "false") {
			whitelist = false;
		}
		let oracle = await deployments.get("Oracle");
		let priceFeedETH = await deployments.get("ChainlinkOracleETH");
		let priceFeedStable = await deployments.get("ChainlinkOracleStable");

		let daiHandlerContract = await ethersBuidler.getContract("DAITokenHandler");
		let usdcHandlerContract = await ethersBuidler.getContract("USDCTokenHandler");
		let usdtHandlerContract = await ethersBuidler.getContract("USDTTokenHandler");
		let wethHandlerContract = await ethersBuidler.getContract("WETHTokenHandler");

		let DAIContract = await deployments.get("DAI");
		let USDCContract = await deployments.get("USDC");
		let USDTContract = await deployments.get("USDT");
		let WETHContract = await deployments.get("WETH");

		let dai = new ethers.Contract(
			DAIHandler.address,
			daiHandlerContract.interface,
			daiHandlerContract.signer
		) as VaultHandler;

		let usdc = new ethers.Contract(
			USDCHandler.address,
			usdcHandlerContract.interface,
			usdcHandlerContract.signer
		) as VaultHandler;

		let usdt = new ethers.Contract(
			USDTHandler.address,
			usdtHandlerContract.interface,
			usdtHandlerContract.signer
		) as VaultHandler;

		let weth = new ethers.Contract(
			WETHHandler.address,
			wethHandlerContract.interface,
			wethHandlerContract.signer
		) as VaultHandler;

		console.log("setting token address", tcapx.address);
		await dai.setTCAPXContract(tcapx.address);
		await usdc.setTCAPXContract(tcapx.address);
		await usdt.setTCAPXContract(tcapx.address);
		await weth.setTCAPXContract(tcapx.address);

		console.log("setting collateral address");
		await dai.setCollateralContract(DAIContract.address);
		await usdc.setCollateralContract(USDCContract.address);
		await usdt.setCollateralContract(USDTContract.address);
		await weth.setCollateralContract(WETHContract.address);

		console.log("setting the divisor", divisor);
		await dai.setDivisor(divisor);
		await usdc.setDivisor(divisor);
		await usdt.setDivisor(divisor);
		await weth.setDivisor(divisor);

		console.log("setting ratio", ratio);
		await dai.setRatio(ratio);
		await usdc.setRatio(ratio);
		await usdt.setRatio(ratio);
		await weth.setRatio(ratio);

		console.log("setting burn fee", burnFee);
		await dai.setBurnFee(burnFee);
		await usdc.setBurnFee(burnFee);
		await usdt.setBurnFee(burnFee);
		await weth.setBurnFee(burnFee);

		console.log("setting TCAP oracle", oracle.address);
		await dai.setTCAPOracle(oracle.address);
		await usdc.setTCAPOracle(oracle.address);
		await usdt.setTCAPOracle(oracle.address);
		await weth.setTCAPOracle(oracle.address);

		console.log("setting Collateral oracle");
		await dai.setCollateralPriceOracle(priceFeedStable.address);
		await usdc.setCollateralPriceOracle(priceFeedStable.address);
		await usdt.setCollateralPriceOracle(priceFeedStable.address);
		await weth.setCollateralPriceOracle(priceFeedETH.address);

		if (!whitelist) {
			console.log("setting whitelist", whitelist);
			await dai.enableWhitelist(whitelist);
			await usdc.enableWhitelist(whitelist);
			await usdt.enableWhitelist(whitelist);
			await weth.enableWhitelist(whitelist);
		}
	}
};
module.exports.tags = ["Initialize"];
