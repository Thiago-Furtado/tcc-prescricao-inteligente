<script setup>
import { reactive, ref } from "vue";
import { api } from "../services/api";
import { useRouter } from "vue-router";
import { UFS } from "../utils/constants";
import { useDoctorStore } from "../stores/doctor";

const router = useRouter();
const form = ref();
const doctor = useDoctorStore();

async function sendForm() {
  if (!form.value.checkValidity()) return;
  const response = await api.post("/doctors", doctor);
  if (response.data.hasDoctors) {
    router.push({ name: "CreatePrescription" });
  } else {
    alert("Não foi possível encontrar informações sobre o médico!");
  }
  resetForm();
}

function resetForm() {
  Object.keys(doctor).forEach((key) => {
    doctor[key] = "";
  });
}
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-5 w-50 rounded-xl">
      <h1 class="text-center">Informações do Médico</h1>
      <span class="text-caption text-red">* Campos obrigatórios!</span>

      <form ref="form" @submit.prevent="sendForm" class="mt-4">
        <v-text-field
          v-model="doctor.name"
          type="text"
          label="* Nome"
          required
        />

        <v-select label="* UF" v-model="doctor.uf" required :items="UFS">
        </v-select>

        <v-text-field v-model="doctor.crm" type="text" label="* CRM" required />

        <v-text-field
          v-model="doctor.city"
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
