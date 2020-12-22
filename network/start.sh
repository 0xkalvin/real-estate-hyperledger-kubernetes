#!/bin/bash

echo "Cleaning any previous setup..."
docker-compose -f docker-compose.yml down -v --remove-orphans --rmi local

docker kill $(docker ps -a) 

echo "Starting up hyperledger infrasctucture..."
docker-compose -f docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com couchdb
docker ps -a

# wait for Hyperledger Fabric to start
export FABRIC_START_TIMEOUT=10

sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx
# Join peer0.org1.example.com to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block


echo "Packaging chaincode..."
docker-compose run cli 

peer chaincode package mycc.tar.gz --path /opt/gopath/src/github.com/hyperledger/chaincode --lang node -n mycc -v 1.0

echo "Installing chaincode..."
peer chaincode install mycc.tar.gz

peer chaincode list --installed

echo "Instantiating chaincode..."
peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n mycc -l node -v 1.0 -c '{"Args":[]}' -P 'OR ("Org1MSP.member")'

peer chaincode list --instantiated -C mychannel

echo "Updating anchor peer..."
peer channel update -o orderer.example.com:7050 -c mychannel -f /opt/gopath/src/github.com/hyperledger/fabric/config/Org1MSPanchors.tx