<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../services/api";
import { useDoctorStore } from "../stores/doctor";

const form = ref();
const router = useRouter();
const doctor = useDoctorStore();

const prescription = ref({
  name: "Thiago",
  cpf: "37525246858",
  email: "",
  medications: [{ quantity: 0, notes: "", name: "" }],
});

function addMedication(index) {
  prescription.value.medications.splice(index + 1, 0, {
    quantity: 0,
    notes: "",
    name: "",
  });
}

async function submitForm() {
  if (!form.value.checkValidity()) return;
  try {
    await api.post("/prescription", {
      ...prescription.value,
      doctorName: doctor.name,
      doctorCrm: doctor.crm,
    });
    router.push("/");
  } catch (error) {
    console.error(error);
  }
}

function removeMedication(index) {
  if (index === 0 && prescription.medications.length === 1) {
    // Não remover o primeiro campo se for o único campo
    return;
  }
  prescription.value.medications.splice(index, 1);
}
</script>

<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-5 w-50 rounded-xl">
      <h1>Prescrição</h1>

      <form ref="form" @submit.prevent="submitForm">
        <v-text-field
          type="text"
          label="Nome"
          v-model="prescription.name"
          required
        />
        <v-text-field
          type="text"
          label="E-mail do paciente"
          v-model="prescription.email"
          required
        />
        <v-text-field
          type="text"
          v-model="prescription.cpf"
          label="CPF do paciente"
          required
        />

        <span> Quantidades e Observações: </span>
        <div>
          <div
            v-for="(medication, index) in prescription.medications"
            :key="index"
          >
            <v-row class="mb-4">
              <v-col cols="2">
                <v-text-field
                  type="number"
                  v-model.number="medication.quantity"
                  label="Qtd"
                  min="0"
                  required
                  hide-details
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  type="text"
                  v-model="medication.name"
                  placeholder="Remédio"
                  hide-details
                />
              </v-col>
              <v-col cols="5">
                <v-text-field
                  type="text"
                  v-model="medication.notes"
                  label="Observações"
                  hide-details
                />
              </v-col>
              <v-col
                cols="1"
                class="d-flex flex-column align-center justify-center"
              >
                <v-btn
                  @click="removeMedication(index)"
                  :disabled="
                    index === 0 && prescription.medications.length === 1
                  "
                  color="error"
                  icon="mdi-minus"
                  size="x-small"
                  density="comfortable"
                  class="mb-1"
                >
                </v-btn>
                <v-btn
                  @click="addMedication(index)"
                  icon="mdi-plus"
                  size="x-small"
                  density="comfortable"
                  color="success"
                >
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </div>

        <div class="d-flex align-center">
          <v-btn color="primary" class="mr-4" type="submit">Enviar</v-btn>
          <!-- Adicionado espaçador -->
          <v-btn variant="outlined" @click="$router.push('/')">Voltar</v-btn>
        </div>
      </form>
    </v-card>
  </v-container>
</template>
