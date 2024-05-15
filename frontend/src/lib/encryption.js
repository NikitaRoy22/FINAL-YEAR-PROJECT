import crypto from "crypto";

export const encryptMessage = (sharedSecret, message) => {
  // Derive encryption key using SHA256
  const encryptionKey = crypto
    .createHash("sha256")
    .update(sharedSecret)
    .digest();

  // Initialization vector (IV)
  const iv = crypto.randomBytes(16);

  // Create AES-256-CFB cipher
  const cipher = crypto.createCipheriv("aes-256-cfb", encryptionKey, iv);

  // Encrypt the message
  let encrypted = cipher.update(message, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
  };
};

export const decryptMessage = (sharedSecret, iv, encryptedMessage) => {
  // Derive decryption key using SHA256 (should be same as encryption key)
  const decryptionKey = crypto
    .createHash("sha256")
    .update(sharedSecret)
    .digest();

  // Initialize IV and encrypted data
  const newIv = Buffer.from(iv, "hex");
  const encryptedData = Buffer.from(encryptedMessage, "hex");

  // Create AES-256-CFB decipher
  const decipher = crypto.createDecipheriv("aes-256-cfb", decryptionKey, newIv);

  // Decrypt the message
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
};

// Function to encrypt a message with a symmetric key
export function encryptGroupChatMessage(message, symmetricKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cfb", symmetricKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(message, "utf8"),
    cipher.final(),
  ]);
  return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
}

// Function to decrypt a message with a symmetric key
export function decryptGroupChatMessage(
  encryptedMessage,
  decryptedSymmetricKey,
) {
  try {
    const iv = Buffer.from(encryptedMessage.iv, "hex");
    const encryptedData = Buffer.from(encryptedMessage.encryptedData, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cfb",
      decryptedSymmetricKey,
      iv,
    );
    const decrypted =
      decipher.update(encryptedData, "hex", "utf8") + decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null; // Or handle the error appropriately
  }
}
