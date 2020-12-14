export default function parseTransactionPayloadToJson (rawPayload: string){
    try {
        const payload = JSON.parse(rawPayload)

        return payload
    } catch (error) {
        return rawPayload
    }
}
