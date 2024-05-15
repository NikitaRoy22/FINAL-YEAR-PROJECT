const crypto = require("crypto");

// Function to generate a key pair
function generateKeyPair() {
  return crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
}

// Function to encrypt a message with a symmetric key
function encryptMessage(message, symmetricKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cfb", symmetricKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(message, "utf8"),
    cipher.final(),
  ]);
  return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
}

// Function to decrypt a message with a symmetric key
function decryptMessage(encryptedMessage, symmetricKey) {
  const iv = Buffer.from(encryptedMessage.iv, "hex");
  const encryptedData = Buffer.from(encryptedMessage.encryptedData, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cfb", symmetricKey, iv);
  const decrypted =
    decipher.update(encryptedData, "hex", "utf8") + decipher.final("utf8");
  return decrypted;
}

// Generate key pairs for two users and the group chat
const user1 = generateKeyPair();
const user2 = generateKeyPair();
const groupChat = generateKeyPair();

// Encrypt a message with a symmetric key
const message = "Hello, group chat!";
const symmetricKey = crypto.randomBytes(32); // For AES-256
const encryptedMessage = encryptMessage(message, symmetricKey);

// Encrypt the symmetric key with each user's public key and the group chat's public key
const encryptedSymmetricKeyForUser1 = crypto.publicEncrypt(
  user1.publicKey,
  symmetricKey,
);
const encryptedSymmetricKeyForUser2 = crypto.publicEncrypt(
  user2.publicKey,
  symmetricKey,
);
const encryptedSymmetricKeyForGroupChat = crypto.publicEncrypt(
  groupChat.publicKey,
  symmetricKey,
);

// Simulate sending the encrypted message and encrypted symmetric keys to the group chat
// In a real application, this would involve network communication

// The group chat decrypts the symmetric key using its private key
const decryptedSymmetricKeyForGroupChat = crypto.privateDecrypt(
  groupChat.privateKey,
  encryptedSymmetricKeyForGroupChat,
);

// Individual users decrypt the symmetric key using their own private keys
const decryptedSymmetricKeyForUser1 = crypto.privateDecrypt(
  user1.privateKey,
  encryptedSymmetricKeyForUser1,
);
const decryptedSymmetricKeyForUser2 = crypto.privateDecrypt(
  user2.privateKey,
  encryptedSymmetricKeyForUser2,
);

// Both the group chat and individual users decrypt the message using the symmetric key
const decryptedMessageForGroupChat = decryptMessage(
  encryptedMessage,
  decryptedSymmetricKeyForGroupChat,
);
const decryptedMessageForUser1 = decryptMessage(
  encryptedMessage,
  decryptedSymmetricKeyForUser1,
);
const decryptedMessageForUser2 = decryptMessage(
  encryptedMessage,
  decryptedSymmetricKeyForUser2,
);

console.log("Decrypted Message for Group Chat:", decryptedMessageForGroupChat);
console.log("Decrypted Message for User 1:", decryptedMessageForUser1);
console.log("Decrypted Message for User 2:", decryptedMessageForUser2);
