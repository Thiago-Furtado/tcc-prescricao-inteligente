<script setup>
import { onMounted, ref } from "vue";
import { api } from "../services/api";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const prescription = ref({
  id: 0,
  medications: [{ quantity: "", notes: "" }],
  doctorCrm: "",
  doctorName: "",
});

const isLoading = ref(false);
const isPharmacist = ref(false);
const message = ref("");

onMounted(async () => {
  isLoading.value = true;
  isPharmacist.value = route.query.pharmacist === "true";
  try {
    const { data } = await api.get(`/prescription/${route.params.id}`);
    prescription.value = {
      id: data.prescription.id,
      medications: data.prescription.medications,
      doctorName: data.prescription.doctorName,
      doctorCrm: data.prescription.doctorCrm,
    };
  } catch (err) {
    if (err.response.data.message) {
      message.value = err.response.data.message;
    } else {
      message.value =
        "Ocorreu erro de comunicação com o servidor, tente novamente mais tarde.";
    }
  } finally {
    isLoading.value = false;
  }
});

async function handleOnUpdatePrescription() {
  if (!isPharmacist) return;
  try {
    await api.put(`/prescription/${prescription.value.id}`, {
      prescription: prescription.value,
    });
    router.push("/");
  } catch (err) {
    console.log(err);
  }
}
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-5 w-50 rounded-xl">
      <h1>Prescrição</h1>
      <div class="d-flex flex-column justify-center my-4 ml-4">
        <span>Médico: {{ prescription.doctorName }}</span>
        <span>CRM: {{ prescription.doctorCrm }}</span>
      </div>
      <div class="d-flex align-center justify-center w-100">
        <v-progress-circular
          v-if="isLoading"
          :size="50"
          color="primary"
          indeterminate
        ></v-progress-circular>
        <span v-if="message" class="text-h6 text-warning">{{ message }}</span>
      </div>
      <v-table border="1" v-if="!isLoading && !message">
        <thead>
          <tr>
            <th>Medicação</th>
            <th>Quantidade</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(medication, index) in prescription.medications">
            <td>{{ medication.name }}</td>
            <td v-if="isPharmacist">
              <div class="d-flex align-center justify-center">
                <v-text-field
                  v-model="medication.quantity"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly
                  disabled
                ></v-text-field>
                <v-btn
                  color="primary"
                  icon="mdi-minus"
                  size="x-small"
                  density="comfortable"
                  class="ml-2"
                  @click="medication.quantity--"
                  :disabled="!medication.quantity"
                ></v-btn>
              </div>
            </td>
            <td v-else>{{ medication.quantity }}</td>
            <td>{{ medication.notes }}</td>
          </tr>
        </tbody>
      </v-table>
      <v-card-actions v-if="isPharmacist && !isLoading && !message">
        <v-btn
          block
          color="primary"
          variant="elevated"
          @click="handleOnUpdatePrescription"
        >
          Atualizar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped>
.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #121212; /* Alterado para preto */
}

.form-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
  background-color: #333333; /* Alterado para #333333 */
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  margin: 20px;
}

h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

th {
  padding: 12px;
}

td {
  padding: 12px;
}
</style>
