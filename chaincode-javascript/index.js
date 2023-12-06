/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const prescriptionTransferEvents = require("./lib/prescriptionTransferEvents");

module.exports.PrescriptionTransferEvents = prescriptionTransferEvents;
module.exports.contracts = [prescriptionTransferEvents];
