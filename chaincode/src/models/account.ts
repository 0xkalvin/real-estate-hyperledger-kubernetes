/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Account {

    @Property()
    public id: string;

    @Property()
    public ownerName: string;

    @Property()
    public balance: number;

    @Property()
    public createdAt: string;

    @Property()
    public updatedAt: string;
}
