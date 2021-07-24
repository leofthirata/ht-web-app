import { generateKeyRSA, getPublicKey, getPrivateKey, printPubKeyRSA, printPrivKeyRSA } from "../../utils/encrypt";

export class AuthService {
  private m_rsa;
  private m_pubKey;
  private m_privKey;
  private readonly RSA_KEY_SIZE = 1024;

  constructor() {
    this.m_rsa = generateKeyRSA(this.RSA_KEY_SIZE);
    this.m_pubKey = getPublicKey(this.m_rsa);
    this.m_privKey = getPrivateKey(this.m_rsa);
    printPubKeyRSA(this.m_pubKey);
    printPrivKeyRSA(this.m_privKey);
  }

  public getPubKey() {
    return this.m_pubKey;
  }

  public getPrivKey() {
    return this.m_privKey;
  }
}