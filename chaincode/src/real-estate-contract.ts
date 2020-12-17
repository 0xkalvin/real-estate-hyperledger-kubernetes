/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

import { Account } from './models/account';
import { Offer } from './models/offer';
import { RealEstate } from './models/real-estate';

import generateKey from './lib/generate-key'
import logger from './lib/logger'
import generateSignature from './lib/generate-signature'
import parsePayloadToJson from './lib/parse-payload'

@Info({title: 'RealEstateContract', description: 'A peer to peer real estate network' })
export class RealEstateContract extends Contract {
    @Transaction(false)
    @Returns('boolean')
    public async doesKeyExists(ctx: Context, key: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(key);
        
        return (!!buffer && buffer.length > 0);
    }

    @Transaction(false)
    public async getAssetById(ctx: Context, key: string): Promise<any> {
        const buffer = await ctx.stub.getState(key);

        if (!(!!buffer && buffer.length > 0)){
            throw new Error(`Asset ${key} does not exist`);
        }

        const asset = JSON.parse(buffer.toString());
        
        return asset;
    }

    @Transaction()
    public async createAccount(ctx: Context, payload: string): Promise<Account> {
        try {
            const account = parsePayloadToJson(payload) as Account

            account.id = generateKey('acc')
            account.balance = 0
            account.createdAt = new Date().toISOString()
            account.updatedAt = new Date().toISOString()

            const buffer = Buffer.from(JSON.stringify(account));
            
            await ctx.stub.putState(account.id, buffer);

            return account
        } catch (error) {
            logger.error({
                message: 'Failed to create account',
                error_message: error.message,
                error_stack: error.stack,
            })

            throw error
        }

    }

    @Transaction()
    public async createOffer(ctx: Context, payload: string): Promise<Offer> {
        try {
            const offer = parsePayloadToJson(payload) as Offer

            offer.id = generateKey('of')
            offer.status = 'PENDING_SIGNATURES'
            offer.createdAt = new Date().toISOString()
            offer.updatedAt = new Date().toISOString()
            offer.amount = Number(offer.amount)

            if(offer.amount <= 0){
                throw new Error('Invalid amount for offer');
            }

            const [ buyerAccountExists, realEstateData ] = await Promise.all([
                this.doesKeyExists(ctx, offer.buyerAccountId),
                this.getAssetById(ctx, offer.realEstateId)
            ])

            if(!buyerAccountExists){
                throw new Error(`The real estate ${offer.realEstateId} does not exist`);
            }

            const realEstate = realEstateData as RealEstate

            if(realEstate.ownerAccountId === offer.buyerAccountId){
                throw new Error('Owner cannot buy its own real estate');
            }

            offer.sellerAccountId = realEstate.ownerAccountId

            const offerAsBuffer = Buffer.from(JSON.stringify(offer));
            
            await ctx.stub.putState(offer.id, offerAsBuffer);

            return offer
        } catch (error) {
            logger.error({
                message: 'Failed to create offer',
                error_message: error.message,
                error_stack: error.stack,
            })

            throw error
        }
    }

    @Transaction()
    public async createRealEstate(ctx: Context, payload: string): Promise<RealEstate> {
        try {
            const realEstate = parsePayloadToJson(payload) as RealEstate

            realEstate.id = generateKey('re')
            realEstate.offers = []
            realEstate.createdAt = new Date().toISOString()
            realEstate.updatedAt = new Date().toISOString()

            const buffer = Buffer.from(JSON.stringify(realEstate));
            
            await ctx.stub.putState(realEstate.id, buffer);

            return realEstate
        } catch (error) {
            logger.error({
                message: 'Failed to create real estate',
                error_message: error.message,
                error_stack: error.stack,
            })

            throw error
        }

    }

    @Transaction()
    public async depositToAccount(ctx: Context, accountKey: string, depositAmount: string): Promise<Account> {
        try {
            const buffer = await ctx.stub.getState(accountKey)
            const account = JSON.parse(buffer.toString()) as Account;

            account.balance = Number(account.balance) + Number(depositAmount)
            account.updatedAt = new Date().toISOString()

            const updatedBuffer = Buffer.from(JSON.stringify(account));
            
            await ctx.stub.putState(account.id, updatedBuffer);

            return account
        } catch (error) {
            logger.error({
                message: 'Failed to complete deposit',
                error_message: error.message,
                error_stack: error.stack,
            })

            throw error
        }
    }

    @Transaction()
    public async addBuyerSignatureToOffer(ctx: Context, offerKey: string): Promise<Offer> {
        try {
            const buffer = await ctx.stub.getState(offerKey)
            const offer = JSON.parse(buffer.toString()) as Offer;

            offer.buyerSignature = generateSignature(ctx, offer.buyerAccountId)
            offer.updatedAt = new Date().toISOString()

            const updatedBuffer = Buffer.from(JSON.stringify(offer));
            
            await ctx.stub.putState(offer.id, updatedBuffer);

            return offer
        } catch (error) {
            logger.error({
                message: 'Failed to add buyer signature',
                error_message: error.message,
                error_stack: error.stack,
            })

            throw error
        }
    }

    @Transaction()
    public async addSellerSignatureToOffer(ctx: Context, offerKey: string): Promise<Offer> {
        try {
            const buffer = await ctx.stub.getState(offerKey)
            const offer = JSON.parse(buffer.toString()) as Offer;

            offer.sellerSignature = generateSignature(ctx, offer.sellerAccountId)
            offer.updatedAt = new Date().toISOString()

            const updatedBuffer = Buffer.from(JSON.stringify(offer));
            
            await ctx.stub.putState(offer.id, updatedBuffer);

            return offer
        } catch (error) {
            logger.error({
                message: 'Failed to add seller signature',
                error_message: error.message,
                error_stack: error.stack,
            })

            throw error
        }
    }

    @Transaction()
    public async transferRealEstateOwnership(ctx: Context, realEstateKey: string, offerKey: string): Promise<RealEstate> {
        try {

            const queriesResults = await Promise.all([
                this.getAssetById(ctx, offerKey),
                this.getAssetById(ctx, realEstateKey)
            ]) 

            const offer = queriesResults[0] as Offer
            const realEstate = queriesResults[1] as RealEstate

            if(!offer.buyerSignature || !offer.sellerSignature){
                throw new Error("Both parties need to sign offer before transfering real estate ownership")
            }

            if(realEstateKey !== offer.realEstateId){
                throw new Error("Offer does not match specified real estate")
            }

            const accounts = await Promise.all([
                this.getAssetById(ctx, offer.buyerAccountId),
                this.getAssetById(ctx, offer.sellerAccountId),
            ])

            const buyerAccount = accounts[0] as Account
            const sellerAccount = accounts[1] as Account

            if(offer.amount > buyerAccount.balance){
                logger.error({
                    message: 'Insuficient balance',
                    buyer_balance: buyerAccount.balance,
                    offer_amount: offer.amount,
                })
    
                throw new Error(`Buyer does not have sufficient balance to pay for real estate`);
            }

            sellerAccount.balance = Number(sellerAccount.balance) + Number(offer.amount)
            buyerAccount.balance = Number(buyerAccount.balance) - Number(offer.amount)        
            
            offer.status = 'COMPLETED'

            realEstate.ownerAccountId = buyerAccount.id

            const sellerAccountAsBuffer = Buffer.from(JSON.stringify(sellerAccount));
            await ctx.stub.putState(sellerAccount.id, sellerAccountAsBuffer);

            const buyerAccountAsBuffer = Buffer.from(JSON.stringify(buyerAccount));
            await ctx.stub.putState(buyerAccount.id, buyerAccountAsBuffer);

            const offerAsBuffer = Buffer.from(JSON.stringify(offer));
            await ctx.stub.putState(offer.id, offerAsBuffer);

            const realEstateAsBuffer = Buffer.from(JSON.stringify(realEstate));
            await ctx.stub.putState(realEstate.id, realEstateAsBuffer);

            return realEstate
        } catch (error) {
            logger.error({
                message: 'Failed to add seller signature',
                error_message: error.message,
                error_stack: error.stack,
            })

            throw error
        }
    }

}
