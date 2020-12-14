/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class RealEstate {

    @Property()
    public id: string;

    @Property()
    public description: string;

    @Property()
    public price: number;

    @Property()
    public address: string;

    @Property()
    public totalArea: string;

    @Property()
    public ownerAccountId: string;

    @Property()
    public offers: Array<string>;

    @Property()
    public createdAt: string;

    @Property()
    public updatedAt: string;
}
