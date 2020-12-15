import { Context } from 'fabric-contract-api';
import { createHmac } from 'crypto'

export default function generateSignature(ctx: Context, accountId: string): string {
    const mspId = ctx.clientIdentity.getMSPID()
    const secret = ctx.clientIdentity.getX509Certificate().fingerPrint
    
    const payload = `${accountId}.${mspId}.${new Date()}`

    const signature = createHmac('sha256', secret).update(payload).digest('hex');

    return signature
}