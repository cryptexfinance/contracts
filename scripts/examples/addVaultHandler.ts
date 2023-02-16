const { providers, Wallet } = require('ethers')
const hre = require('hardhat')
const ethers = require('ethers')
const { hexDataLength } = require('@ethersproject/bytes')
const { L1ToL2MessageGasEstimator } = require('@arbitrum/sdk/dist/lib/message/L1ToL2MessageGasEstimator')
const {
  L1TransactionReceipt,
  L1ToL2MessageStatus,
  EthBridger,
  getL2Network,
} = require('@arbitrum/sdk')

function requireEnvVariables(envVars: string[]){
  for (const envVar of envVars) {
    if (!process.env[envVar]) {
      throw new Error(`Error: set your '${envVar}' environmental variable `)
    }
  }
}

requireEnvVariables(['ROPSTEN_PRIVATE_KEY'])

/**
 * Set up: instantiate L1 / L2 wallets connected to providers
 */
const walletPrivateKey = process.env.ROPSTEN_PRIVATE_KEY

const l1Provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_RPC_URL)
const l2Provider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL)

const l1Wallet = new ethers.Wallet(walletPrivateKey, l1Provider)
const l2Wallet = new ethers.Wallet(walletPrivateKey, l2Provider)

const WETH_VAULT_HANDLER_ADDRESS = "0xe30C148Ca3cCe47341aB9bEbD7A8db031aB207D0"
const ORCHESTRATOR_ADDRESS = "0x60f5C89C26cd424DF5E8513FDe150D2CA8F0eB9f"
const TCAP_ADDRESS = "0xD5536c80191c624F6bFD5590A45b9E93B16DEA97"

const main = async () => {
  console.log('vault setter script');

  /**
   * Use l2Network to create an Arbitrum SDK EthBridger instance
   * We'll use EthBridger to retrieve the Inbox address
   */

  const l2Network = await getL2Network(l2Provider)
  const ethBridger = new EthBridger(l2Network)
  const inboxAddress = ethBridger.l2Network.ethBridge.inbox
  const abiCoder = new ethers.utils.AbiCoder();

  /**
   * We deploy L1 Greeter to L1, L2 greeter to L2, each with a different "greeting" message.
   * After deploying, save set each contract's counterparty's address to its state so that they can later talk to each other.
   */
  const L1MessageRelayer = await (
    await hre.ethers.getContractFactory('L1MessageRelayer')
  ).connect(l1Wallet) //
  const l1MessageRelayer = L1MessageRelayer.attach(
  	"0x209c23DB16298504354112fa4210d368e1d564dA"
  )

  let l2MessageExecutorProxyAddress = "0x3769b6aA269995297a539BEd7a463105466733A5";

  const L2MessageExecutorProxy = await (
    await hre.ethers.getContractFactory('L2MessageExecutorProxy')
  ).connect(l2Wallet)
  const l2MessageExecutorProxy = L2MessageExecutorProxy.attach(
  	l2MessageExecutorProxyAddress
  )

  const WETHVaultHandler = await (
    await hre.ethers.getContractFactory('ETHVaultHandler')
  ).connect(l2Wallet)
  const wETHVaultHandler = WETHVaultHandler.attach(WETH_VAULT_HANDLER_ADDRESS)

  const Orchestrator = await (
    await hre.ethers.getContractFactory('ArbitrumOrchestrator')
  ).connect(l2Wallet)
  const orchestrator = Orchestrator.attach(ORCHESTRATOR_ADDRESS)

  const TCAP = await (
    await hre.ethers.getContractFactory('TCAP')
  ).connect(l2Wallet)
  const tcap = TCAP.attach(TCAP_ADDRESS)

  const isVaultAdded = await tcap.vaultHandlers(WETH_VAULT_HANDLER_ADDRESS)

  console.log(`current value of isVaultAdded ${isVaultAdded}`)

  console.log('Updating liquidationPenalty from L1 to L2:')

  /**
   * To send an L1-to-L2 message (aka a "retryable ticket"), we need to send ether from L1 to pay for the txn costs on L2.
   * There are two costs we need to account for: base submission cost and cost of L2 execution. We'll start with base submission cost.
   */

  /**
   * Base submission cost is a special cost for creating a retryable ticket; querying the cost requires us to know how many bytes of calldata out retryable ticket will require, so let's figure that out.
   * We'll get the bytes for our greeting data, then add 4 for the 4-byte function signature.
   */

  const _ABI = ['function addTCAPVault(address _tcap, address _vault)']
  const _iface = new ethers.utils.Interface(_ABI)
  const _calldata = _iface.encodeFunctionData('addTCAPVault', [TCAP_ADDRESS, WETH_VAULT_HANDLER_ADDRESS])
  const payLoad = abiCoder.encode(["address", "bytes"], [ ORCHESTRATOR_ADDRESS, _calldata]);

  const newMessageBytes = ethers.utils.defaultAbiCoder.encode(
    ['bytes'],
    [payLoad]
  )
  const newMessageBytesLength = hexDataLength(newMessageBytes) + 4 // 4 bytes func identifier

  /**
   * Now we can query the submission price using a helper method; the first value returned tells us the best cost of our transaction; that's what we'll be using.
   * The second value (nextUpdateTimestamp) tells us when the base cost will next update (base cost changes over time with chain congestion; the value updates every 24 hours). We won't actually use it here, but generally it's useful info to have.
   */
  const l1ToL2MessageGasEstimate = new L1ToL2MessageGasEstimator(l2Provider)

  const _submissionPriceWei = await l1ToL2MessageGasEstimate.estimateSubmissionFee(
      l1Provider,
      await l1Provider.getGasPrice(),
      newMessageBytesLength
    )

  console.log(
    `Current retryable base submission price: ${_submissionPriceWei.toString()}`
  )

  /**
   * ...Okay, but on the off chance we end up underpaying, our retryable ticket simply fails.
   * This is highly unlikely, but just to be safe, let's increase the amount we'll be paying (the difference between the actual cost and the amount we pay gets refunded to our address on L2 anyway)
   * In nitro, submission fee will be charged in L1 based on L1 basefee, revert on L1 side upon insufficient fee.
   */
  const submissionPriceWei = _submissionPriceWei.mul(5)
  /**
   * Now we'll figure out the gas we need to send for L2 execution; this requires the L2 gas price and gas limit for our L2 transaction
   */

  /**
   * For the L2 gas price, we simply query it from the L2 provider, as we would when using L1
   */
  const gasPriceBid = await l2Provider.getGasPrice()
  console.log(`L2 gas price: ${gasPriceBid.toString()}`)

  /**
   * For the gas limit, we'll use the estimateRetryableTicketGasLimit method in Arbitrum SDK
   */

  /**
   * First, we need to calculate the calldata for the function being called (setGreeting())
   */
  const ABI = ['function executeMessage(bytes calldata payLoad)']
  const iface = new ethers.utils.Interface(ABI)
  const calldata = iface.encodeFunctionData('executeMessage', [payLoad])

  const maxGas = await l1ToL2MessageGasEstimate.estimateRetryableTicketGasLimit(
    {
      from: await l1MessageRelayer.address,
      to: l2MessageExecutorProxyAddress,
      l2CallValue: 0,
      excessFeeRefundAddress: await l2Wallet.address,
      callValueRefundAddress: await l2Wallet.address,
      data: calldata,
    },
    ethers.utils.parseEther('1')
  )
  /**
   * With these three values, we can calculate the total callvalue we'll need our L1 transaction to send to L2
   */
  const callValue = submissionPriceWei.add(gasPriceBid.mul(maxGas))

  console.log(
    `Sending Message to L2 with ${callValue.toString()} callValue for L2 fees:`
  )

  console.log("payLoad ", payLoad);
  console.log("submissionPriceWei ", submissionPriceWei);
  console.log("maxGas ", maxGas);
  console.log("gasPriceBid ", gasPriceBid);
  console.log("callValue ", callValue);

  const setMessageTx = await l1MessageRelayer.relayMessage(
    payLoad,
    submissionPriceWei,
    maxGas,
    gasPriceBid,
    {
      value: callValue,
    }
  )
  const setMessageRec = await setMessageTx.wait()

  console.log(
    `Message txn confirmed on L1! ${setMessageRec.transactionHash}`
  )

  const l1TxReceipt = new L1TransactionReceipt(setMessageRec)

  /**
   * In principle, a single L1 txn can trigger any number of L1-to-L2 messages (each with its own sequencer number).
   * In this case, we know our txn triggered only one
   * Here, We check if our L1 to L2 message is redeemed on L2
   */
  const messages = await l1TxReceipt.getL1ToL2Messages(l2Wallet)
  const message = messages[0]
  console.log('Waiting for L2 side. It may take 10-15 minutes ⏰⏰')
  const messageResult = await message.waitForStatus()
  const status = messageResult.status
  if (status === L1ToL2MessageStatus.REDEEMED) {
    console.log(
      `L2 retryable txn executed  ${messageResult.l2TxReceipt.transactionHash}`
    )
  } else {
    console.log(
      `L2 retryable txn failed with status ${L1ToL2MessageStatus[status]}`
    )
  }

  /**
   * Note that during L2 execution, a retryable's sender address is transformed to its L2 alias.
   * Thus, when GreeterL2 checks that the message came from the L1, we check that the sender is this L2 Alias.
   * See setGreeting in GreeterL2.sol for this check.
   */

  /**
   * Now when we call greet again, we should see our new string on L2!
   */
  const newIsVaultAdded = await tcap.vaultHandlers(WETH_VAULT_HANDLER_ADDRESS)
  console.log(`Updated L2 greeting: "${newIsVaultAdded}"`)
  console.log('🫡')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
