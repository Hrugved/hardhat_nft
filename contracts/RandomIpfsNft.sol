// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import '@openzeppelin/contracts/access/Ownable.sol';

error RandomIpfsNft__AlreadyInitialized();
error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  enum Breed {
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }

  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;
  mapping(uint256 => address) public s_requestIdToSender;
  
  uint256 private s_tokenCounter;
  uint256 internal constant MAX_CHANCE_VALUE = 100;
  string[] internal s_dogTokenURIs;
  uint256 internal i_mintFee;
  bool private s_initialized;

  event NFTRequested(uint256 indexed requestId, address requester);
  event NFTMinted(Breed dogBreed, address minter);

  constructor(
    address _vrfCoordinatorV2,
    uint64 _subscriptionId,
    bytes32 _gasLane,
    uint32 _callbackGasLimit,
    string[3] memory _dogTokenURIs,
    uint256 _mintFee
  ) VRFConsumerBaseV2(_vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
    i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
    i_subscriptionId = _subscriptionId;
    i_gasLane = _gasLane;
    i_callbackGasLimit = _callbackGasLimit;
    i_mintFee = _mintFee;
    _initializeCollection(_dogTokenURIs);
  }

  function _initializeCollection(string[3] memory _dogTokenURIs) internal {
    if(s_initialized) {
      revert RandomIpfsNft__AlreadyInitialized();
    }
    s_dogTokenURIs = _dogTokenURIs;
    s_initialized = true;
  } 

  function requestNft() public payable returns (uint256 requestId) {
    if(msg.value<i_mintFee) {
      revert RandomIpfsNft__NeedMoreETHSent();
    }
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requestIdToSender[requestId] = msg.sender;
    emit NFTRequested(requestId,msg.sender);
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    address dogOwner = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;
    uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
    Breed dogBreed = getBreedFromModdedRng(moddedRng);
    s_tokenCounter++;
    _safeMint(dogOwner,newTokenId);
    _setTokenURI(newTokenId,s_dogTokenURIs[uint256(dogBreed)]);
    emit NFTMinted(dogBreed, dogOwner);
  }

  function withdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool success,) = payable(msg.sender).call{value:amount}("");
    if(!success) {revert RandomIpfsNft__TransferFailed();}
  }

  function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
    uint256 cumulativeSum = 0;
    uint256[3] memory chanceArray = getChanceArray();
    for (uint256 i = 0; i < chanceArray.length; i++) {
      if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
        return Breed(i);
      }
      cumulativeSum += chanceArray[i];
    }
    revert RandomIpfsNft__RangeOutOfBounds();
  }

  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 30, MAX_CHANCE_VALUE];
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getDogTokenURIs(uint256 index) public view returns (string memory) {
    return s_dogTokenURIs[index];
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }

  function getInitialized() public view returns (bool) {
    return s_initialized;
  }

}
