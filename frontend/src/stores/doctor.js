import { defineStore } from "pinia";

export const useDoctorStore = defineStore("doctor", {
  state: () => {
    return {
      name: "Adauto José de Freitas Rocha",
      uf: "SP",
      crm: "11556",
      city: "Santos",
    };
  },
});
