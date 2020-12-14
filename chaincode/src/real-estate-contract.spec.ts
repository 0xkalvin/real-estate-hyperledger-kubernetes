/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { RealEstateContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logging = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
     };
}

describe('RealEstateContract', () => {

    let contract: RealEstateContract;
    let ctx: TestContext;

    beforeEach(() => {
        contract = new RealEstateContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"real estate 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"real estate 1002 value"}'));
    });

    describe('#realEstateExists', () => {

        it('should return true for a real estate', async () => {
            await contract.realEstateExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a real estate that does not exist', async () => {
            await contract.realEstateExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createRealEstate', () => {

        it('should create a real estate', async () => {
            await contract.createRealEstate(ctx, '1003', 'real estate 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"real estate 1003 value"}'));
        });

        it('should throw an error for a real estate that already exists', async () => {
            await contract.createRealEstate(ctx, '1001', 'myvalue').should.be.rejectedWith(/The real estate 1001 already exists/);
        });

    });

    describe('#readRealEstate', () => {

        it('should return a real estate', async () => {
            await contract.readRealEstate(ctx, '1001').should.eventually.deep.equal({ value: 'real estate 1001 value' });
        });

        it('should throw an error for a real estate that does not exist', async () => {
            await contract.readRealEstate(ctx, '1003').should.be.rejectedWith(/The real estate 1003 does not exist/);
        });

    });

    describe('#updateRealEstate', () => {

        it('should update a real estate', async () => {
            await contract.updateRealEstate(ctx, '1001', 'real estate 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"real estate 1001 new value"}'));
        });

        it('should throw an error for a real estate that does not exist', async () => {
            await contract.updateRealEstate(ctx, '1003', 'real estate 1003 new value').should.be.rejectedWith(/The real estate 1003 does not exist/);
        });

    });

    describe('#deleteRealEstate', () => {

        it('should delete a real estate', async () => {
            await contract.deleteRealEstate(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a real estate that does not exist', async () => {
            await contract.deleteRealEstate(ctx, '1003').should.be.rejectedWith(/The real estate 1003 does not exist/);
        });

    });

});
