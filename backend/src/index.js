import express from "express";
import cors from "cors";
import { fetchDoctors, fetchPharmacists } from "./robot.mjs";
import {
  newGrpcConnection,
  newIdentity,
  newSigner,
} from "./services/blockchain/connect.mjs";
import {
  CHAINCODE_NAME,
  CHANNEL_NAME,
  createPrescription,
  readPrescription,
  updatePrescription,
} from "./services/blockchain/index.mjs";
import { connect } from "@hyperledger/fabric-gateway";
import { Resend } from "resend";
import QRCode from "qrcode";
import { randomBytes, randomUUID } from "node:crypto";
import "dotenv/config";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "node:path";
import QrCodeReader from "qrcode-reader";
import Jimp from "jimp";
import { readFile } from "node:fs/promises";

const randomBytesAsync = promisify(randomBytes);

let client;
let gateway;

async function connectToBlockchain() {
  client = await newGrpcConnection();
  gateway = connect({
    client,
    identity: await newIdentity(),
    signer: await newSigner(),
    evaluateOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    endorseOptions: () => {
      return { deadline: Date.now() + 15000 }; // 15 seconds
    },
    submitOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    commitStatusOptions: () => {
      return { deadline: Date.now() + 60000 }; // 1 minute
    },
  });

  return {
    client,
    gateway,
  };
}

connectToBlockchain()
  .then(() => {
    const PORT = 3000;
    const app = express();
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "uploads/");
      },
      filename: function (req, file, cb) {
        const uniquePreffix = randomBytes(16).toString("hex");
        cb(null, uniquePreffix + path.extname(file.originalname));
      },
    });
    const upload = multer({ storage });

    app.use(express.json());
    app.use(cors());

    app.get("/", (req, res) => {
      res.json({ message: "We're alive" });
    });

    app.post("/doctors", async (req, res) => {
      const doctor = req.body;
      try {
        const hasDoctors = await fetchDoctors(doctor);
        res.json({ hasDoctors });
      } catch (err) {
        console.log(err);
        res.status(400).json({
          error: "Error while fetching doctors",
        });
      }
    });

    app.post("/pharmacist", async (req, res) => {
      const pharmacist = req.body;
      try {
        const hasPharmacists = await fetchPharmacists(pharmacist);
        res.json({ hasPharmacists });
      } catch (err) {
        console.log(err);
        res.status(400).json({
          error: "Error while fetching pharmacists",
        });
      }
    });

    app.get("/prescription/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const prescriptionData = await readPrescription(contract, id);

        if (prescriptionData.Status === "CLOSED") {
          return res.status(404).json({
            message: "A prescrição não é mais válida",
          });
        }

        return res.status(200).json({
          prescription: {
            id: prescriptionData.ID,
            medications: JSON.parse(prescriptionData.Medications),
            doctorName: prescriptionData.DoctorName,
            doctorCrm: prescriptionData.DoctorCrm,
          },
        });
      } catch (err) {
        return res.status(404).json({
          message: "Deu ruim",
        });
      }
    });

    app.post("/qr-code", upload.single("qrCode"), async (req, res) => {
      const buffer = await readFile(req.file.path);

      Jimp.read(buffer, function (err, image) {
        if (err) {
          return res.status(400).json({
            message: "Erro ao ler QrCode",
          });
        }
        const qrReader = new QrCodeReader();

        qrReader.callback = function (err, value) {
          if (err) {
            return res.status(400).json({
              message: "Erro ao ler QrCode",
            });
          }

          return res.status(200).json({
            validationUrl: value.result,
          });
        };
        qrReader.decode(image.bitmap);
      });
    });

    app.post("/prescription", async (req, res) => {
      const prescription = req.body;
      prescription.id = randomUUID();
      const password = (await randomBytesAsync(15)).toString("hex");
      prescription.secretKey = bcrypt.hashSync(password, 10);

      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        await createPrescription(contract, {
          ...prescription,
        });
        // send email
        const prescriptionURL = `http://172.20.174.186:5173/validation/${prescription.id}`;
        const qrCode = await QRCode.toDataURL(prescriptionURL);
        const resend = new Resend(process.env.RESEND_KEY);

        const html = `
          <p>Olá <b>${prescription.name}</b></p>
          <p>Segue o link para a consulta da sua prescrição médica</p>

          <a href="${prescriptionURL}">Acesse aqui</a>
          <br/>
          <span>
            Sua chave secreta é ${password}, apresente ao farmacêutico
          </span>

          <p>Ou escaneie o QRCode abaixo utilizando a câmera do seu celular</p>
        `;

        const data = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: prescription.email,
          subject: "Prescrição Médica",
          html,
          attachments: [
            {
              content: qrCode.split(",")[1],
              filename: "QR_CODE.jpeg",
            },
          ],
          headers: {
            "X-Entity-Ref-ID": randomUUID(),
          },
        });
      } catch (err) {
        console.log(err);
        return res.status(404).json({
          message: "Deu ruim",
        });
      }

      res.status(204).send();
    });

    app.put("/prescription/:id", async (req, res) => {
      const { prescription } = req.body;
      prescription.status = prescription.medications.every(
        (medication) => medication.quantity === 0
      )
        ? "CLOSED"
        : "OPEN";

      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        await updatePrescription(contract, prescription.id, prescription);
      } catch (err) {
        console.log(err);
        return res.status(404).json({
          message: "Deu ruim",
        });
      }

      res.status(204).send();
    });

    app.post("/prescription/validate/:id", async (req, res) => {
      const { key } = req.body;
      const { id } = req.params;

      try {
        const network = gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);
        const prescriptionData = await readPrescription(contract, id);
        const prescription = {
          id: prescriptionData.ID,
          cpf: prescriptionData.Cpf,
          name: prescriptionData.Name,
          medications: JSON.parse(prescriptionData.Medications),
          secretKey: prescriptionData.SecretKey,
          status: prescriptionData.Status,
          doctorName: prescriptionData.DoctorName,
          doctorCrm: prescriptionData.DoctorCrm,
        };
        if (!bcrypt.compareSync(key, prescription.secretKey)) {
          return res.status(404).json({
            message: "Chave secreta inválida",
          });
        }
        res.status(200).json({
          isValid: true,
        });
      } catch (err) {
        console.log(err);
        return res.status(404).json({
          message: "Deu ruim",
        });
      }
    });

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on PORT http://127.0.0.1:${PORT}`);
    });

    process.on("exit", () => {
      console.log("Shutting down the application...");
      gateway.close();
      client.close();
    });

    process.on("SIGINT", () => {
      server.close(() => {
        console.log("Server closed. Exiting...");
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.log(err);
    console.log("#### BLOCKCHAIN CONNECTION ERROR ####");
  });
