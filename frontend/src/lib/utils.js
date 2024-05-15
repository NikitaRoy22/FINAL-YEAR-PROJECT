import crypto from "crypto";

export function generateKeys() {
  const keyPair = crypto.createECDH("secp256k1");

  keyPair.generateKeys();

  return keyPair;
}

export const getOtheruserPublicKeys = (publicKeys, ownUserId) => {
  // Initialize an empty object to store other users' public keys
  const otherUsersPublicKeys = {};

  // Loop through the publicKeys object to find the other users' public keys
  for (const userId in publicKeys) {
    // Add the other user's public key to the object, using their user ID as the key
    otherUsersPublicKeys[userId] = publicKeys[userId];
  }

  return otherUsersPublicKeys;
};

export const getOtheruserPublicKey = (publicKeys, ownUserId) => {
  // Initialize a variable to store the other user's public key
  let otherUserPublicKey;

  // Loop through the publicKeys object to find the other user's public key
  for (const userId in publicKeys) {
    // Check if the current user ID is not the own user ID
    if (userId !== ownUserId) {
      // Store the other user's public key
      otherUserPublicKey = publicKeys[userId];
      // Break the loop as we found the first other user's public key
      break;
    }
  }

  return otherUserPublicKey;
};

export const computeSecret = (publicKey, username) => {
  // Get privateKey from localStorage
  const keys = localStorage.getItem(`keyPair_${username}`);
  const storedKeys = JSON.parse(keys);
  const storedPrivateKey = storedKeys.privateKey;

  // Set Private key
  const keyPair = crypto.createECDH("secp256k1");
  keyPair.setPrivateKey(storedPrivateKey, "base64");

  return keyPair.computeSecret(publicKey, "base64", "hex");
};

export const masterEncryptionKey =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export const encryptPublicKey = (publicKey, masterEncryptionKey) => {
  const cipher = crypto.createCipher("aes-256-cbc", masterEncryptionKey);
  let encryptedData = cipher.update(publicKey, "utf8", "hex");
  encryptedData += cipher.final("hex");
  return encryptedData;
};

export const decryptPublicKey = (encryptedPublicKey, masterEncryptionKey) => {
  const decipher = crypto.createDecipher("aes-256-cbc", masterEncryptionKey);
  let decryptedData = decipher.update(encryptedPublicKey, "hex", "utf8");
  decryptedData += decipher.final("utf8");
  return decryptedData;
};

export const encryptWithSharedSecret = (sharedSecret, symmetricKey) => {
  const sharedSecretBuffer = Buffer.from(sharedSecret, "hex");

  console.log({
    encryptSharedBuffer: sharedSecretBuffer,
  });

  // Generate a random IV
  const iv = crypto.randomBytes(16);

  // Convert the symmetricKey to a Buffer
  const symmetricKeyBuffer = Buffer.from(symmetricKey);

  // Create a cipher with AES-256-CFB algorithm
  const cipher = crypto.createCipheriv("aes-256-cfb", sharedSecretBuffer, iv);

  // Update the cipher with symmetricKey and finalize it
  const encrypted = Buffer.concat([
    cipher.update(symmetricKeyBuffer, "utf8"),
    cipher.final(),
  ]);

  // let encryptedData = cipher.update(symmetricKeyBuffer, "utf8", "hex");
  // encryptedData += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted.toString("hex"),
  };
};

export const decryptWithSharedSecret = (
  sharedSecret,
  encryptedSymmetricKey,
) => {
  // Convert shared secret and IV to Buffer objects
  const sharedSecretBuffer = Buffer.from(sharedSecret, "hex");
  const iv = Buffer.from(encryptedSymmetricKey.iv, "hex");

  // Create decipher object with the shared secret and IV
  const decipher = crypto.createDecipheriv(
    "aes-256-cfb",
    sharedSecretBuffer,
    iv,
  );

  // Update the decipher with encrypted data
  let decryptedData = decipher.update(
    encryptedSymmetricKey.encryptedData,
    "hex",
    "utf8",
  );

  decryptedData += decipher.final("utf8");

  return decryptedData;
};

export function encryptSymmetricKeyWithECDH(
  recipientPublicKey,
  symmetricKey,
  username,
) {
  // Derive the shared secret from your private key and the recipient's public key
  const sharedSecret = computeSecret(recipientPublicKey, username);

  // Encrypt the symmetric key using the shared secret
  const encryptedSymmetricKey = encryptWithSharedSecret(
    sharedSecret,
    symmetricKey,
  );

  return encryptedSymmetricKey;
}

export function decryptSymmetricKeyWithECDH(
  senderPublicKey,
  encryptedSymmetricKey,
  username,
) {
  // Derive the shared secret from your private key and the sender's public key
  const sharedSecret = computeSecret(senderPublicKey, username);

  console.log({
    fromDecryptECDH: sharedSecret,
  });

  let symmetricKey;
  // Decrypt the symmetric key using the shared secret
  try {
    symmetricKey = decryptWithSharedSecret(sharedSecret, encryptedSymmetricKey);
  } catch (error) {
    console.log({
      error,
    });
  }

  return symmetricKey;
}
