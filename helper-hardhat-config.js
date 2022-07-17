// const { ethers } = require("hardhat")

const networkConfig = {
  4: {
    name:'rinkeby',
    vrfCoordinatorV2: '0x6168499c0cFfCaCD319c818142124B7A15E857ab',
    entranceFee:"100000000000000000",
    gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
    subscriptionId: '8630',
    callbackGasLimit: '500000',
    interval: 30,
    mintFee: '10000000000000000', // 0.01 ETH
    ethUsdPriceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'
  },
  31337: {
    name: 'hardhat',
    entranceFee: "100000000000000000",
    gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc', // doesn't matter
    callbackGasLimit: '500000',
    interval: 30,
    mintFee: '10000000000000000' // 0.01 ETH 
  }
}

const devChains = ['hardhat','localhost']

module.exports = {
  networkConfig,
  devChains
}