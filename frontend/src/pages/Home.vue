<template>
  <v-container class="fill-height">
    <div class="d-flex flex-column align-center justify-center w-100">
      <h1>Prescrições Médicas Digitais</h1>
      <span class="mb-5">
        Novo modo de criar, visualizar e utilizar suas receitas médicas
      </span>

      <div class="d-flex align-center mt-5">
        <v-btn
          size="x-large"
          class="mr-5"
          color="primary"
          @click="$router.push('/doctor')"
          >Médico</v-btn
        >
        <v-btn
          size="x-large"
          color="primary"
          @click="$router.push('/pharmacist')"
        >
          Farmacêutico
        </v-btn>
      </div>
    </div>
  </v-container>
</template>
