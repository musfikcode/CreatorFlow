import Cryptr from "cryptr";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const cryptr = new Cryptr(ENCRYPTION_KEY as string);

export const encrypt = (text: string) => {
  return cryptr.encrypt(text);
};

export const decrypt = (text: string) => {
  return cryptr.decrypt(text);
};
