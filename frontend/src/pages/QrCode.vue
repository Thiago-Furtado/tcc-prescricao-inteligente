<script setup>
import { ref } from "vue";
import { api } from "../services/api";

const qrCode = ref(null);

async function handleOnSendQrCode() {
  const form = new FormData();
  form.append("qrCode", qrCode.value[0]);
  const { data } = await api.post("/qr-code", form);
  window.location.href = data.validationUrl + "?pharmacist=true";
}
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-5 w-50 rounded-xl" max-width="400px">
      <v-file-input
        v-model="qrCode"
        accept="image/png, image/jpeg"
        show-size
        label="Ler QRCode"
        prepend-icon=""
        prepend-inner-icon="mdi-barcode-scan"
      ></v-file-input>

      <v-btn block color="primary" size="x-large" @click="handleOnSendQrCode"
        >Enviar</v-btn
      >
    </v-card>
  </v-container>
</template>
