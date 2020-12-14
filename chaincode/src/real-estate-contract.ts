/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

import { Account } from './models/account';
import { Offer } from './models/offer';
import { RealEstate } from './models/real-estate';

import generateKey from './lib/generate-key'
import parsePayloadToJson from './lib/parse-payload'


@Info({title: 'RealEstateContract', description: 'A peer to peer real estate network' })
export class RealEstateContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async realEstateExists(ctx: Context, realEstateKey: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(realEstateKey);
        
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createAccount(ctx: Context, payload: string): Promise<Account> {
        try {
            const account = parsePayloadToJson(payload) as Account

            account.id = generateKey('account')
            account.balance = 0
            account.createdAt = new Date().toISOString()
            account.updatedAt = new Date().toISOString()

            const buffer = Buffer.from(JSON.stringify(account));
            
            await ctx.stub.putState(account.id, buffer);

            return account
        } catch (error) {
            throw error
        }

    }

    @Transaction()
    public async createOffer(ctx: Context, payload: string): Promise<Offer> {
        try {
            const offer = parsePayloadToJson(payload) as Offer

            offer.id = generateKey('offer')
            offer.status = 'PENDING_SIGNATURES'
            offer.createdAt = new Date().toISOString()
            offer.updatedAt = new Date().toISOString()

            const buffer = Buffer.from(JSON.stringify(offer));
            
            await ctx.stub.putState(offer.id, buffer);

            return offer
        } catch (error) {
            throw error
        }

    }

    @Transaction()
    public async createRealEstate(ctx: Context, payload: string): Promise<RealEstate> {
        try {
            const realEstate = parsePayloadToJson(payload) as RealEstate

            realEstate.id = generateKey('realestate')
            realEstate.offers = []
            realEstate.createdAt = new Date().toISOString()
            realEstate.updatedAt = new Date().toISOString()

            const buffer = Buffer.from(JSON.stringify(realEstate));
            
            await ctx.stub.putState(realEstate.id, buffer);

            return realEstate
        } catch (error) {
            throw error
        }

    }

    @Transaction(false)
    @Returns('RealEstate')
    public async readRealEstate(ctx: Context, realEstateId: string): Promise<RealEstate> {
        const exists = await this.realEstateExists(ctx, realEstateId);
        if (!exists) {
            throw new Error(`The real estate ${realEstateId} does not exist`);
        }
        const buffer = await ctx.stub.getState(realEstateId);
        const realEstate = JSON.parse(buffer.toString()) as RealEstate;
        return realEstate;
    }

    @Transaction()
    public async deleteRealEstate(ctx: Context, realEstateKey: string): Promise<void> {
        const exists = await this.realEstateExists(ctx, realEstateKey);
        
        if (!exists) {
            throw new Error(`The real estate ${realEstateKey} does not exist`);
        }
        
        await ctx.stub.deleteState(realEstateKey);
    }

}
