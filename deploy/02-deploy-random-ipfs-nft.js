const { network, ethers } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const { verify } = require("../utils/verfiy")
require("dotenv").config()

const imagesLocation = "images/randomNft"

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "cuteness",
      value: 100,
    },
  ],
}

let tokenUris = [
  'ipfs://QmfGvc9JynDLxTY41XA6b8598XvcqEBuCDmmjF4W6pqXr2',
  'ipfs://Qmf3wUfzX8jXrK7DHBXS4ZdSVmeouJcyLtxpJJrNjCRVyB',
  'ipfs://QmdsMpGt2SzsS1zBfshXusXt4sEv27eVFT4WtEYpAF2ULk'
]

const FUND_AMOUNT = '10000000000000000000' // 10 LINK

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris()
  }
  let vrfCoordinatorV2Address, subscriptionId
  if (devChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
    const tx = await vrfCoordinatorV2Mock.createSubscription()
    const txReceipt = await tx.wait(1)
    subscriptionId = txReceipt.events[0].args.subId
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId,FUND_AMOUNT)
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
    subscriptionId = networkConfig[chainId].subscriptionId
  }
  const { gasLane, callbackGasLimit, mintFee } = networkConfig[chainId]
  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    gasLane,
    callbackGasLimit,
    tokenUris,
    mintFee,
  ]
  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  log("--------------------------------------------------------")
  if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("verifying on Etherscan...")
    await verify(randomIpfsNft.address, args)
  }
}

async function handleTokenUris() {
  tokenUris = []
  console.log("uploading images to IPFS...")
  const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
  for (imageUploadResponseIndex in imageUploadResponses) {
    let tokenUriMetadata = { ...metadataTemplate }
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup`
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
    console.log(`uploading nft metadata ${tokenUriMetadata.name}...`)
    const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
  }
  console.log(tokenUris)
  return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
