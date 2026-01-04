import { prisma } from "../../prisma.js";
import nacl from "tweetnacl";

export class UserService {
  static async getByAddress(address: string) {
    return prisma.user.findUnique({ where: { address } });
  }

  static async register(address: string, nickname: string, signature: string, publicKey: string) {
    const message = `Registering nickname: ${nickname}`;
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature.replace("0x", ""), "hex");
    const publicKeyBytes = Buffer.from(publicKey.replace("0x", ""), "hex");

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!isValid) throw new Error("Invalid signature");

    return prisma.user.create({
      data: { address, nickname }
    });
  }
}