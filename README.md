# Real Estate Hyperledger Fabric Kubernetes

A simple real estate negotiation blockchain platform which allows parties to make offers directly to each other without a centralized authority. Thus, buyers and sellers can close deals only using digital signatures and digital wallets.

The project also aims to be a **sample** for building and running an entire Hyperledger Fabric solution, from its infrastructure to the application code, and deploying this entire stack on a **Kubernetes cluster**.

The repository contains 
 - `api` folder, which holds an REST API to interact with the fabric network and call smart contract transactions
 - `chaincode` folder, which holds the smart contract source code
 - `kubernetes`folder, which holds the kubernetes configuration for each fabric component and the API
 - `network` folder, which holds some configuration files for the fabric infrastructure

## Technologies

- Hyperledger Fabric v1.4.6
- Kubernetes
- Docker and Docker Compose 
- Typescript

## Setup

This section aims to demonstrate how to deploy the entire project stack on a kubernetes cluster. Also, for developing purposes, there  are also the steps to run everything locally with docker compose.

Deploying everything into kubernetes is going to require a few steps
- Create a shared volume to hold common configuration files for Hyperledger Fabric
- Copy those configutation files into the volume
- Generate some basic blockchain artefacts, such as the genesis block
- Start up the necessary infrastructure containers (Certificate authority, Peer, Orderer and more)
- Install and instatiate the chaincode (aka smart contract) into the peers
- Deploy the REST API to interact with the network


So let's go!

#### Kubernetes

Assuming that we're already connected to a kubernetes cluster, check if all nodes are up and running

```bash
kubectl get nodes
```

The first thing to do is to create a persistent shared volume between all pods to hold the fabric configuration files

```bash
kubectl apply -f ./kubernetes/fabric-volume.yml
```

Secondly, start up the fabric tools pod, which is a helper pod used to interact with the hyperledger network

```bash
kubectl apply -f ./kubernetes/fabric-tools.yml
```

Now, copy all configuration files to the shared volume

```bash
kubectl cp ./network/config/ fabric-tools:/fabric/

kubectl cp ./network/crypto-config/ fabric-tools:/fabric/

kubectl cp ./network/peer/configtx.yaml fabric-tools:/fabric/configtx.yaml
```

Also, copy the chaincode source files to the volume

```bash
kubectl cp ./chaincode/ fabric-tools:/fabric/
```

Since the basic files are already inside the volume, access the fabric helper pod to generate some Hyperledger artefacts. The first one is the genesis block, which will contains our network topology information with all nodes addresses. Then we're going to create a channel transaction and also a transaction to update the anchor peers.

```bash
kubectl exec -it fabric-tools -- /bin/bash

cd /fabric

configtxgen -profile OneOrgOrdererGenesis -outputBlock /fabric/config/genesis.block -channelID test -configPath .

configtxgen inspect /fabric/config/genesis.block

configtxgen -profile OneOrgChannel -outputCreateChannelTx ./config/channel.tx -channelID mychannel -configPath .

configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ./config/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP  -configPath .

exit
```

After generating the artefacts, start up the infrastructure containers. 

Create a fabric certificate authority

```bash
kubectl apply -f ./kubernetes/fabric-ca.yml
```

Create a fabric orderer

```bash
kubectl apply -f ./kubernetes/fabric-orderer.yml
```

Create a fabric peer and its couchdb

```bash
kubectl apply -f ./kubernetes/fabric-peer.yml
```

Check if all pods are running

```bash
kubectl get pods
```

Go back into our helper pod to join our peer in the channel and install the smart contract code in it

```bash
kubectl exec -it fabric-tools -- /bin/bash
```

Create a channel

```bash

peer channel create -o ${ORDERER_URL} -c ${CHANNEL_NAME} -f /fabric/config/channel.tx 

```
Join the fabric peer into the channel

```bash
peer channel join -b mychannel.block
```

Package the chaincode source directory

```bash
peer chaincode package mycc.tar.gz --path /fabric/chaincode --lang node -n mycc -v 1.0
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
peer chaincode instantiate -o ${ORDERER_URL} -C mychannel -n mycc -l node -v 1.0 -c '{"Args":[]}' -P 'OR ("Org1MSP.member")'
```

To check if it worked 
```bash
peer chaincode list --instantiated -C mychannel
```
Update the anchor peer to reflect on the discovery services
```bash
peer channel update -o ${ORDERER_URL} -c mychannel -f /fabric/config/Org1MSPanchors.tx
```

Now that the entire Hyperledger Fabric blockchain network is up and running inside the kubernetes cluster, start up the API service

```bash
kubectl apply -f ./kubernetes/api.yml
```

You can now test the API endpoints and see everything working.

#### Using docker-compose

To run the project locally, it is possible to start everything up using docker compose.

First, go to the network directory

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

## API Endpoints

### POST /accounts

#### Request

```bash
curl -XPOST "http://localhost:3000/accounts" --header "Content-Type: application/json"  --data '{"ownerName": "Bob" }'
```

#### Response

```json
{
  "ownerName": "Bob",
  "id": "acc_b958c34c-c156-4098-a947-faea5b44b0d3",
  "balance": 0,
  "createdAt": "2021-01-03T03:19:50.304Z",
  "updatedAt": "2021-01-03T03:19:50.304Z"
}
```

### POST /real_estate

#### Request

```bash
curl --request POST \
  --url http://localhost:3000/real_estate \
  --header 'content-type: application/json' \
  --data '{
	"description": "Cozy apartment in NYC",
	"price": 1500000,
	"ownerAccountId": "acc_350a8ee7-1398-41a7-b3c3-b51434d54eb9",
	"totalArea": "100m2",
	"address": "Fifty avenue"
}'
```

#### Response

```json
{
  "description": "Cozy apartment in NYC",
  "price": 1500000,
  "ownerAccountId": "acc_350a8ee7-1398-41a7-b3c3-b51434d54eb9",
  "totalArea": "100m2",
  "address": "Fifty avenue",
  "id": "re_7254466e-8283-437e-bd20-48f0e449f394",
  "offers": [],
  "createdAt": "2020-12-17T01:44:47.264Z",
  "updatedAt": "2020-12-17T01:44:47.264Z"
}
```

### POST /real_estate/:id/transfers

#### Request

```bash
curl --request POST \
  --url http://localhost:3000/real_estate/re_7254466e-8283-437e-bd20-48f0e449f394/transfers \
  --header 'content-type: application/json' \
  --data '{
	"offerId": "of_ed81df4a-d570-492d-90f2-62da7e3eff86"
}'
```

#### Response

```json
{
  "address": "Fifty avenue",
  "createdAt": "2020-12-17T01:44:47.264Z",
  "description": "Cozy apartment in NYC",
  "id": "re_7254466e-8283-437e-bd20-48f0e449f394",
  "offers": [],
  "ownerAccountId": "acc_233837ec-1045-42b7-85e2-357712cf85cb",
  "price": 1500000,
  "totalArea": "100m2",
  "updatedAt": "2020-12-17T01:44:47.264Z"
}
```

### POST /offers

#### Request

```bash
curl --request POST \
  --url http://localhost:3000/offers \
  --header 'content-type: application/json' \
  --data '{
	"realEstateId": "re_7254466e-8283-437e-bd20-48f0e449f394",
	"buyerAccountId": "acc_233837ec-1045-42b7-85e2-357712cf85cb",
	"amount": 1200000
}'
```

#### Response

```json
{
  "realEstateId": "re_7254466e-8283-437e-bd20-48f0e449f394",
  "buyerAccountId": "acc_233837ec-1045-42b7-85e2-357712cf85cb",
  "amount": 1200000,
  "id": "of_ed81df4a-d570-492d-90f2-62da7e3eff86",
  "status": "PENDING_SIGNATURES",
  "createdAt": "2020-12-17T01:47:04.008Z",
  "updatedAt": "2020-12-17T01:47:04.008Z",
  "sellerAccountId": "acc_350a8ee7-1398-41a7-b3c3-b51434d54eb9"
}
```

### POST /offers/:id/signatures

#### Request

```bash
curl --request POST \
  --url http://localhost:3000/offers/of_ed81df4a-d570-492d-90f2-62da7e3eff86/signatures \
  --header 'content-type: application/json' \
  --data '{
	"signee": "buyer"
}'
```

#### Response

```json
{
  "amount": 1200000,
  "buyerAccountId": "acc_233837ec-1045-42b7-85e2-357712cf85cb",
  "createdAt": "2020-12-17T01:47:04.008Z",
  "id": "of_ed81df4a-d570-492d-90f2-62da7e3eff86",
  "realEstateId": "re_7254466e-8283-437e-bd20-48f0e449f394",
  "sellerAccountId": "acc_350a8ee7-1398-41a7-b3c3-b51434d54eb9",
  "sellerSignature": "32c01a2002e1d98dd61acacf6b3f4f174ed95180ea6dbec830219170b9a6d0cb",
  "status": "PENDING_SIGNATURES",
  "updatedAt": "2020-12-17T01:47:31.047Z",
  "buyerSignature": "92658cf4dde39084051672000069df5b71c8fa696baec45d91e9cccb32680117"
}
```

