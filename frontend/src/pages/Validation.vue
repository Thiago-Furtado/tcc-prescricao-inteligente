<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-5 w-50 rounded-xl">
      <h1 class="text-center">Validação</h1>
      <span class="text-caption text-red">* Campos obrigatórios</span>
      <form @submit.prevent="sendForm">
        <v-text-field
          type="text"
          label="* CPF"
          @input="restrictToNumbers"
          v-model="validationData.cpf"
          maxLength="11"
          required
        />

        <v-text-field
          type="password"
          label="* Chave secreta"
          v-model="validationData.key"
          required
        />

        <div class="d-flex align-center">
          <v-btn color="primary" class="mr-4" type="submit">Enviar</v-btn>
          <v-btn @click="$router.push('/')">Voltar</v-btn>
        </div>
      </form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { reactive } from "vue";
import { api } from "../services/api";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const prescriptionId = route.params.id;

const validationData = reactive({
  cpf: "02289141241",
  key: "",
  id: prescriptionId,
});

const isLoading = ref(false);

async function sendForm() {
  isLoading.value = true;
  try {
    const { data } = await api.post(
      `/prescription/validate/${prescriptionId}`,
      {
        cpf: validationData.cpf,
        key: validationData.key,
      }
    );
    const { isValid } = data;
    if (isValid) {
      router.push({
        path: `/prescription/${prescriptionId}`,
        query: {
          pharmacist: route.query.pharmacist,
        },
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

function restrictToNumbers(event) {
  validationData.cpf = validationData.cpf.replace(/[^0-9]/g, "");
}
</script>
