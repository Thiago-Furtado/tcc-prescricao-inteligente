import * as grpc from "@grpc/grpc-js";
import { GatewayError } from "@hyperledger/fabric-gateway";
import { TextDecoder } from "util";

export const CHANNEL_NAME = "mychannel";
export const CHAINCODE_NAME = "events";

const utf8Decoder = new TextDecoder();

export async function startEventListening(network) {
  console.log("\n*** Start chaincode event listening");

  const events = await network.getChaincodeEvents(CHAINCODE_NAME);

  void readEvents(events); // Don't await - run asynchronously
  return events;
}

async function readEvents(events) {
  try {
    for await (const event of events) {
      const payload = parseJson(event.payload);
      console.log(
        `\n<-- Chaincode event received: ${event.eventName} -`,
        payload
      );
    }
  } catch (error) {
    // Ignore the read error when events.close() is called explicitly
    if (
      !(error instanceof GatewayError) ||
      error.code !== grpc.status.CANCELLED
    ) {
      throw error;
    }
  }
}

function parseJson(jsonBytes) {
  const json = utf8Decoder.decode(jsonBytes);
  return JSON.parse(json);
}

export async function createPrescription(contract, prescriptionData) {
  const { id, cpf, name, medications, secretKey, doctorName, doctorCrm } =
    prescriptionData;
  console.log(`\n--> Submit Transaction: CreatePrescription, ${id}`);

  const result = await contract.submitAsync("CreatePrescription", {
    arguments: [
      id,
      cpf,
      name,
      JSON.stringify(medications),
      secretKey,
      doctorName,
      doctorCrm,
    ],
  });

  const status = await result.getStatus();
  if (!status.successful) {
    throw new Error(
      `failed to commit transaction ${status.transactionId} with status code ${status.code}`
    );
  }

  console.log("\n*** CreatePrescription committed successfully");

  return status.blockNumber;
}

export async function readPrescription(contract, prescriptionId) {
  console.log(`\n--> Submit Transaction: ReadPrescription, ${prescriptionId}`);

  const result = await contract.submitAsync("ReadPrescription", {
    arguments: [prescriptionId],
  });

  const status = await result.getStatus();
  if (!status.successful) {
    throw new Error(
      `failed to commit transaction ${status.transactionId} with status code ${status.code}`
    );
  }

  console.log("\n*** ReadPrescription committed successfully");

  return parseJson(result.getResult());
}

export async function updatePrescription(
  contract,
  prescriptionId,
  prescription
) {
  console.log(
    `\n--> Submit transaction: UpdatePrescription, ${prescriptionId}`
  );

  await contract.submitTransaction(
    "UpdatePrescription",
    prescriptionId,
    JSON.stringify(prescription.medications),
    prescription.status
  );

  console.log("\n*** UpdatePrescription committed successfully");
}

export async function deletePrescriptionByID(contract, prescriptionId) {
  console.log(
    `\n--> Submit transaction: DeletePrescription, ${prescriptionId}`
  );

  await contract.submitTransaction("DeletePrescription", prescriptionId);

  console.log("\n*** DeletePrescription committed successfully");
}

export async function replayChaincodeEvents(network, startBlock) {
  console.log("\n*** Start chaincode event replay");

  const events = await network.getChaincodeEvents(CHAINCODE_NAME, {
    startBlock,
  });

  try {
    for await (const event of events) {
      const payload = parseJson(event.payload);
      console.log(
        `\n<-- Chaincode event replayed: ${event.eventName} -`,
        payload
      );

      if (event.eventName === "DeletePrescription") {
        // Reached the last submitted transaction so break to stop listening for events
        break;
      }
    }
  } finally {
    events.close();
  }
}
