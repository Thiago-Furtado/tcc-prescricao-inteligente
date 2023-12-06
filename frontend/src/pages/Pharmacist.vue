<script setup>
import { reactive, ref } from "vue";
import { api } from "../services/api";
import { useRouter } from "vue-router";
import { UFS } from "../utils/constants";

const router = useRouter();
const form = ref();
const pharmacist = reactive({
  crf: "1166685",
  uf: "SP",
  city: "Santos",
});

async function sendForm() {
  if (!form.value.checkValidity()) return;
  const response = await api.post("/pharmacist", pharmacist);
  if (response.data.hasPharmacists) {
    router.push({
      path: "/qr-code",
    });
  } else {
    alert("Não foi possível encontrar informações sobre o farmacêutico!");
  }
  resetForm();
}

function resetForm() {
  Object.keys(pharmacist).forEach((key) => {
    pharmacist[key] = "";
  });
}
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-5 w-50 rounded-xl">
      <h1 class="text-center">Informações do Farmacêutico</h1>
      <span class="text-caption text-red">* Campos obrigatórios</span>
      <form ref="form" @submit.prevent="sendForm" class="mt-5">
        <v-text-field
          v-model="pharmacist.crf"
          type="password"
          label="* CRF"
          required
        />

        <v-select label="* UF" v-model="pharmacist.uf" required :items="UFS">
        </v-select>

        <v-text-field
          v-model="pharmacist.city"
          type="text"
          label="* Município"
          required
        />

        <div class="d-flex align-center">
          <v-btn color="primary" class="mr-4" type="submit">Enviar</v-btn>
          <v-btn variant="outlined" class="mr-4" @click="resetForm">
            Limpar
          </v-btn>
          <v-btn variant="outlined" @click="$router.push('/')">Voltar</v-btn>
        </div>
      </form>
    </v-card>
  </v-container>
</template>
