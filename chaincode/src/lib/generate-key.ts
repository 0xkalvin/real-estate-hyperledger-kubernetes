import { v4 as uuidv4} from 'uuid'


export default function generateKey (prefix: string): string {
    const key = `${prefix}_${uuidv4()}`

    return key
}