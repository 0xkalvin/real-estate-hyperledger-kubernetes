# Real Estate Hyperledger Fabric Kubernetes

## Setup

#### Using docker-compose

Go to the network directory

```bash
cd network
```

Start up the local hyperledger fabric infrastructure 

```bash
docker-compose -f docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com couchdb

```

Create a channel

```bash
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx
```

Join peer to channel

```bash
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block
```

Initialize the fabric tools container, which is a helper cli that allows us to interact with the network

```bash
docker-compose run cli 
```

Package the chaincode source directory
```bash
peer chaincode package mycc.tar.gz --path /opt/gopath/src/github.com/hyperledger/chaincode --lang node -n mycc -v 1.0
```

Install chaincode on peer
```bash
peer chaincode install mycc.tar.gz
```

We can check if the installation went smoothly with
```bash
peer chaincode list --installed
```

Instantiate chaincode
```bash
peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n mycc -l node -v 1.0 -c '{"Args":[]}' -P 'OR ("Org1MSP.member")'
```

To check if it worked 
```bash
peer chaincode list --instantiated -C mychannel
```
Update the anchor peer to reflect on the discovery services
```bash
peer channel update -o orderer.example.com:7050 -c mychannel -f /opt/gopath/src/github.com/hyperledger/fabric/config/Org1MSPanchors.tx
```

#### Kubernetes