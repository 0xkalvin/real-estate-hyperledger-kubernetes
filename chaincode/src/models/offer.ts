/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Offer {

    @Property()
    public id: string;

    @Property()
    public amount: number;

    @Property()
    public status: string;

    @Property()
    public realEstateId: string;

    @Property()
    public sellerAccountId: string;

    @Property()
    public buyerAccountId: string;

    @Property()
    public sellerSignature: string;

    @Property()
    public buyerSignature: string;

    @Property()
    public createdAt: string;

    @Property()
    public updatedAt: string;
}
