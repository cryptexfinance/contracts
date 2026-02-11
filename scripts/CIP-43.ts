// run with
// npx hardhat run ./scripts/CIP-43.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { hexDataLength } from "@ethersproject/bytes";
import { L1ToL2MessageGasEstimator } from "@arbitrum/sdk/dist/lib/message/L1ToL2MessageGasEstimator";
import {
    L1TransactionReceipt,
    L1ToL2MessageStatus,
    EthBridger,
    getL2Network,
} from "@arbitrum/sdk";
import "ethers";
import { BigNumber } from "ethers";

async function calculateArbitrumRelayerGasParams(
    payLoad: string,
    l1Provider: any,
    l2Provider: any,
    l1MessageRelayerAddress: string,
    l2MessageExecutorProxyAddress: string,
    MainnetTimelockAddress: string
) {
    const newMessageBytes = ethers.utils.defaultAbiCoder.encode(
        ["bytes"],
        [payLoad]
    );
    const newMessageBytesLength = hexDataLength(newMessageBytes) + 4; // 4 bytes func identifier

    /**
     * Now we can query the submission price using a helper method; the first value returned tells us the best cost of our transaction; that's what we'll be using.
     * The second value (nextUpdateTimestamp) tells us when the base cost will next update (base cost changes over time with chain congestion; the value updates every 24 hours). We won't actually use it here, but generally it's useful info to have.
     */
    const l1ToL2MessageGasEstimate = new L1ToL2MessageGasEstimator(l2Provider);

    const _submissionPriceWei =
        await l1ToL2MessageGasEstimate.estimateSubmissionFee(
            l1Provider,
            await l1Provider.getGasPrice(),
            newMessageBytesLength
        );

    console.log(
        `Current retryable base submission price: ${_submissionPriceWei.toString()}`
    );

    /**
     * ...Okay, but on the off chance we end up underpaying, our retryable ticket simply fails.
     * This is highly unlikely, but just to be safe, let's increase the amount we'll be paying (the difference between the actual cost and the amount we pay gets refunded to our address on L2 anyway)
     * In nitro, submission fee will be charged in L1 based on L1 basefee, revert on L1 side upon insufficient fee.
     */
    const submissionPriceWei = _submissionPriceWei.mul(10);
    /**
     * Now we'll figure out the gas we need to send for L2 execution; this requires the L2 gas price and gas limit for our L2 transaction
     */

    /**
     * For the L2 gas price, we simply query it from the L2 provider, as we would when using L1
     */
    const gasPriceBid = await l2Provider.getGasPrice();
    console.log(`L2 gas price: ${gasPriceBid.toString()}`);

    /**
     * For the gas limit, we'll use the estimateRetryableTicketGasLimit method in Arbitrum SDK
     */

    /**
     * First, we need to calculate the calldata for the function being called (setGreeting())
     */
    const ABI = ["function executeMessage(bytes calldata payLoad)"];
    const iface = new ethers.utils.Interface(ABI);
    const calldata = iface.encodeFunctionData("executeMessage", [payLoad]);

    let maxGas;
    try {
        maxGas = await l1ToL2MessageGasEstimate.estimateRetryableTicketGasLimit(
            {
                from: await l1MessageRelayerAddress,
                to: l2MessageExecutorProxyAddress,
                l2CallValue: ethers.BigNumber.from("0"),
                excessFeeRefundAddress: MainnetTimelockAddress,
                callValueRefundAddress: MainnetTimelockAddress,
                data: calldata,
            },
            ethers.utils.parseEther("1")
        );
        console.log("Gas estimation successful");
    } catch (error: any) {
        console.log("Gas estimation failed, using manual estimate:", error.message);
        // Manual gas estimate for executeTransaction with redeem call
        // This is a reasonable estimate based on similar transactions
        // Base gas for executeMessage + executeTransaction + redeem call
        maxGas = ethers.BigNumber.from("500000");
        console.log("Using manual gas limit:", maxGas.toString());
    }
    /**
     * With these three values, we can calculate the total callvalue we'll need our L1 transaction to send to L2
     */
    const callValue = submissionPriceWei.add(gasPriceBid.mul(maxGas));

    console.log("submissionPriceWei ", submissionPriceWei);
    console.log("maxGas ", maxGas);
    console.log("gasPriceBid ", gasPriceBid);
    console.log("callValue ", callValue);
    return [submissionPriceWei, maxGas, gasPriceBid, callValue, calldata];
}

async function main() {
    const l1Provider = new ethers.providers.JsonRpcProvider(
        process.env.MAINNET_API_URL
    );
    const l2Provider = new ethers.providers.JsonRpcProvider(
        process.env.ARBITRUM_API_URL
    );
    ethers.Wallet.createRandom();
    const _wallet = ethers.Wallet.createRandom();
    const l1Wallet = new ethers.Wallet(_wallet, l1Provider);
    const l2Wallet = new ethers.Wallet(_wallet, l1Provider);

    const l2Network = await getL2Network(l2Provider);
    const ethBridger = new EthBridger(l2Network);
    const inboxAddress = ethBridger.l2Network.ethBridge.inbox;
    const abiCoder = new ethers.utils.AbiCoder();

    // addresses
    const MainnetTimelockAddress = "0xa54074b2cc0e96a43048d4a68472F7F046aC0DA8";
    const l1MessageRelayerAddress = "0x209c23DB16298504354112fa4210d368e1d564dA";
    const l2MessageExecutorProxyAddress =
        "0x3769b6aA269995297a539BEd7a463105466733A5";
    const ArbitrumTreasuryAddress = "0x9474B771Fb46E538cfED114Ca816A3e25Bb346CF";
    const ArbitrumMultisigAddress = "0x046Dd590b4c6F324fE549dBBa28a7c3B9796B3EB";
    const USDCAddress = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
    const ARBTokenAddress = "0x912CE59144191C1204E64559FE8253a0e49E6548";
    const MainnetMultisig = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
    const CTXTokenAddress = "0x321C2fE4446C7c963dc41Dd58879AF648838f98D";
    const dsuAmount = BigNumber.from("15887536455445420600856");
    const perennialProxy = "0x0d49c416103Cbd276d9c3cd96710dB264e3A0c27";

    const _L1MessageRelayer = await (
        await hre.ethers.getContractFactory("L1MessageRelayer")
    ).connect(l1Wallet);
    const l1MessageRelayer = _L1MessageRelayer.attach(l1MessageRelayerAddress);
    const _L2MessageExecutorProxy = await (
        await hre.ethers.getContractFactory("L2MessageExecutorProxy")
    ).connect(l2Wallet);
    const l2MessageExecutorProxy = _L2MessageExecutorProxy.attach(
        l2MessageExecutorProxyAddress
    );


    const TreasuryABI = [
        "function transferOwnership(address)",
    ];
    const TreasuryIface = new ethers.utils.Interface(TreasuryABI);
    const _calldata = TreasuryIface.encodeFunctionData("transferOwnership", [
        ArbitrumMultisigAddress
    ]);
    const payLoad = abiCoder.encode(
        ["address", "bytes"],
        [ArbitrumTreasuryAddress, _calldata]
    );

    const [submissionPriceWei, maxGas, gasPriceBid, callValue, calldata] =
        await calculateArbitrumRelayerGasParams(
            payLoad,
            l1Provider,
            l2Provider,
            l1MessageRelayerAddress,
            l2MessageExecutorProxyAddress,
            MainnetTimelockAddress
        );

    console.log(calldata);

    const targets = [l1MessageRelayerAddress];
    const values = [callValue];
    const signatures = [
        "relayMessage(address,bytes,uint256,uint256,uint256)"
    ];
    const calldatas = [
        abiCoder.encode(
            ["address", "bytes", "uint256", "uint256", "uint256"],
            [
                l2MessageExecutorProxyAddress,
                calldata,
                submissionPriceWei,
                maxGas,
                gasPriceBid,
            ]
        ),
    ];

    const description =
        "CIP-43: Transfer Ownership of Arbitrum Treasury to Multisig";
    console.log("_".repeat(100));
    console.log("targets:", targets);
    console.log("values:", values.toString());
    console.log("signatures:", signatures);
    console.log("calldatas:", calldatas);
    console.log("description:", description);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
