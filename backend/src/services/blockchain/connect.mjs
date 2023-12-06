import * as grpc from "@grpc/grpc-js";
import { signers } from "@hyperledger/fabric-gateway";
import * as crypto from "crypto";
import { promises as fs } from "fs";
import * as path from "path";

const mspId = "Org1MSP";
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Path to crypto materials.
const cryptoPath = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "fabric",
  "fabric-samples",
  "test-network",
  "organizations",
  "peerOrganizations",
  "org1.example.com"
);

// Path to user private key directory.
const keyDirectoryPath = path.resolve(
  cryptoPath,
  "users",
  "User1@org1.example.com",
  "msp",
  "keystore"
);

// Path to user certificate.
const certPath = path.resolve(
  cryptoPath,
  "users",
  "User1@org1.example.com",
  "msp",
  "signcerts",
  "cert.pem"
);

// Path to peer tls certificate.
const tlsCertPath = path.resolve(
  cryptoPath,
  "peers",
  "peer0.org1.example.com",
  "tls",
  "ca.crt"
);

// Gateway peer endpoint.
const peerEndpoint = "localhost:7051";

export async function newGrpcConnection() {
  const tlsRootCert = await fs.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": "peer0.org1.example.com",
  });
}

export async function newIdentity() {
  const credentials = await fs.readFile(certPath);
  return { mspId, credentials };
}

export async function newSigner() {
  const files = await fs.readdir(keyDirectoryPath);
  const keyPath = path.resolve(keyDirectoryPath, files[0]);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}
