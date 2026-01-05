import { prisma } from "../../prisma.js";
import { Ed25519PublicKey, Ed25519Signature } from "@aptos-labs/ts-sdk";

export class UserService {
  static async getByAddress(address: string) {
    return prisma.user.findUnique({ where: { address } });
  }

  static async register(address: any, nickname: string, signature: any, publicKey: any) {
    try {
        let addressStr: string;
        
        if (typeof address === 'string') {
            addressStr = address;
        } else if (address?.hex) {
            addressStr = address.hex;
        } else if (Array.isArray(address) || address?.data) {
            const bytes = address.data ? Object.values(address.data) : address;
            addressStr = "0x" + Array.from(bytes as number[])
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } else {
            addressStr = address.toString();
        }

        const rawMessage = `Registering nickname: ${nickname}`;
        const fullMessage = `APTOS\nmessage: ${rawMessage}\nnonce: 1`;
        
        const sigHex = typeof signature === 'string' ? signature : (signature.hex || signature.fullSig);
        const pubKeyHex = typeof publicKey === 'string' ? publicKey : publicKey.hex;

        const aptosPublicKey = new Ed25519PublicKey(pubKeyHex);
        const aptosSignature = new Ed25519Signature(sigHex);

        const isValid = aptosPublicKey.verifySignature({
            message: new TextEncoder().encode(fullMessage),
            signature: aptosSignature,
        });

        if (!isValid) throw new Error("Invalid signature");

        return await prisma.user.create({
            data: { 
                address: addressStr,
                nickname 
            }
        });

    } catch (error: any) {
        console.error("Auth Error:", error.message);
        throw new Error(error.message);
    }
}
}