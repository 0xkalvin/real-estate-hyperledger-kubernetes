# Real Estate Hyperledger Fabric Kubernetes

## Setup


#### Kubernetes

First of all, create a persistent shared volume between all pods to hold the fabric configuration files

```bash
kubectl apply -f ./kubernetes/fabric-volume.yml
```

After that, start up the fabric tools pod, which is a helper pod used to interact with the hyperledger network 

```bash
kubectl apply -f ./kubernetes/fabric-tools.yml
```

Now, copy all configuration files to the shared volume

```bash
kubectl cp ./network/config/ fabric-tools:/fabric/

kubectl cp ./network/crypto-config/ fabric-tools:/fabric/
```

Also, copy the chaincode source files to the volume

```bash
kubectl cp ./chaincode/ fabric-tools:/fabric/
```

Lastly, copy the configtx file which has the network topology configuration

```bash
kubectl cp ./network/peer/configtx.yaml fabric-tools:/fabric/configtx.yaml
```

Now, let's access the fabric helper pod to generate the blockchain genesis block

```bash
kubectl exec -it fabric-tools -- /bin/bash

cd /fabric

configtxgen -profile OneOrgOrdererGenesis -outputBlock /fabric/config/genesis.block -channelID test -configPath .

configtxgen inspect /fabric/config/genesis.block

configtxgen -profile OneOrgChannel -outputCreateChannelTx ./config/channel.tx -channelID mychannel -configPath .

configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ./config/Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP  -configPath .

exit
```

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

Now that all pods are running, access the helper fabric tools pod to configure the network

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

Now that the entire Hyperledger Fabric blockchain network is up and kunning inside the kubernetes cluster, start up the API service

```bash
kubectl apply -f ./kubernetes/api.yml
```


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
