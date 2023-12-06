/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Contract } = require("fabric-contract-api");

async function savePrivateData(ctx, prescriptionKey) {
  const clientOrg = ctx.clientIdentity.getMSPID();
  const peerOrg = ctx.stub.getMspID();
  const collection = "_implicit_org_" + peerOrg;

  if (clientOrg === peerOrg) {
    const transientMap = ctx.stub.getTransient();
    if (transientMap) {
      const properties = transientMap.get("prescription_properties");
      if (properties) {
        await ctx.stub.putPrivateData(collection, prescriptionKey, properties);
      }
    }
  }
}

async function removePrivateData(ctx, prescriptionKey) {
  const clientOrg = ctx.clientIdentity.getMSPID();
  const peerOrg = ctx.stub.getMspID();
  const collection = "_implicit_org_" + peerOrg;

  if (clientOrg === peerOrg) {
    const propertiesBuffer = await ctx.stub.getPrivateData(
      collection,
      prescriptionKey
    );
    if (propertiesBuffer && propertiesBuffer.length > 0) {
      await ctx.stub.deletePrivateData(collection, prescriptionKey);
    }
  }
}

async function addPrivateData(ctx, prescriptionKey, prescription) {
  const clientOrg = ctx.clientIdentity.getMSPID();
  const peerOrg = ctx.stub.getMspID();
  const collection = "_implicit_org_" + peerOrg;

  if (clientOrg === peerOrg) {
    const propertiesBuffer = await ctx.stub.getPrivateData(
      collection,
      prescriptionKey
    );
    if (propertiesBuffer && propertiesBuffer.length > 0) {
      const properties = JSON.parse(propertiesBuffer.toString());
      prescription.prescription_properties = properties;
    }
  }
}

async function readState(ctx, id) {
  const prescriptionBuffer = await ctx.stub.getState(id); // get the prescription from chaincode state
  if (!prescriptionBuffer || prescriptionBuffer.length === 0) {
    throw new Error(`The prescription ${id} does not exist`);
  }
  const prescriptionString = prescriptionBuffer.toString();
  const prescription = JSON.parse(prescriptionString);

  return prescription;
}

class PrescriptionTransferEvents extends Contract {
  // CreatePrescription issues a new prescription to the world state with given details.
  async CreatePrescription(
    ctx,
    id,
    cpf,
    name,
    medications,
    secretKey,
    doctorName,
    doctorCrm
  ) {
    const prescription = {
      ID: id,
      Cpf: cpf,
      Name: name,
      Medications: medications,
      SecretKey: secretKey,
      Status: "OPEN",
      DoctorName: doctorName,
      DoctorCrm: doctorCrm,
    };
    await savePrivateData(ctx, id);

    const prescriptionBuffer = Buffer.from(JSON.stringify(prescription));

    ctx.stub.setEvent("CreatePrescription", prescriptionBuffer);
    return ctx.stub.putState(id, prescriptionBuffer);
  }

  // ReadPrescription returns the prescription stored in the world state with given id.
  async ReadPrescription(ctx, id) {
    const prescription = await readState(ctx, id);
    await addPrivateData(ctx, prescription.ID, prescription);

    return JSON.stringify(prescription);
  }

  // UpdatePrescription updates an existing prescription in the world state with provided parameters.
  async UpdatePrescription(ctx, id, medications, status) {
    const prescription = await readState(ctx, id);
    prescription.Medications = medications;
    prescription.Status = status;
    const prescriptionBuffer = Buffer.from(JSON.stringify(prescription));
    await savePrivateData(ctx, id);

    ctx.stub.setEvent("UpdatePrescription", prescriptionBuffer);
    return ctx.stub.putState(id, prescriptionBuffer);
  }

  // DeletePrescription deletes an given prescription from the world state.
  async DeletePrescription(ctx, id) {
    const prescription = await readState(ctx, id);
    const prescriptionBuffer = Buffer.from(JSON.stringify(prescription));
    await removePrivateData(ctx, id);

    ctx.stub.setEvent("DeletePrescription", prescriptionBuffer);
    return ctx.stub.deleteState(id);
  }
}

module.exports = PrescriptionTransferEvents;
