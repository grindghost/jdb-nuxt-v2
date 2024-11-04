import { defineStore } from 'pinia';

export const useStatusStore = defineStore('status', () => {
    const locale = ref('fr');
    const status = ref({
        'en': {
           "referrerValidation" : "Validating referrer...",
           "apiPing" : "Pinging API...",
           "getToken"  : "Requesting token...",
           "decodeToken" : "Reading token...",
           "loginUser" : "Login user...",
           "getRemoteConfigs" : "Requesting remote configs...",
           "getProjectProfile": "Requesting project profile...",
           "getAnswer" : "Retrieving previous answer...",
           "saveAnswer" : "Saving your answer...",
           "loading" : "Loading...",
           "success" : "Success!",
           "error" : "Error",
           "offline" : "Offline"
        },
        'fr': {
            "referrerValidation" : "Validation du référent...",
            "apiPing" : "Ping de l'API...",
            "getToken"  : "Demande de jeton...",
            "decodeToken" : "Lecture du jeton...",
            "loginUser" : "Connexion de l'utilisateur...",
            "getRemoteConfigs" : "Récupération des configurations à distance...",
            "getProjectProfile": "Récupération du profil de projet...",
            "getAnswer" : "Récupération de la réponse précédente...",
            "saveAnswer" : "Enregistrement de votre réponse...",
            "loading" : "Chargement...",
            "success" : "Succès!",
            "error" : "Erreur",
            "offline" : "Hors ligne"
        }

    })
    return { status, locale }
})

// Hot module replacement
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useStatusStore, import.meta.hot));
  }