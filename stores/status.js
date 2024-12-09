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
           "loadCover" : "Retrieving PDF Cover...",

           "saveAnswer" : "Saving your answer...",
           "downloadPDF" : "Preparing your PDF...",
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
            "loadCover" : "Récupération de la couverture...",
            
            "saveAnswer" : "Enregistrement de votre réponse...",
            "downloadPDF" : "Préparation de votre PDF...",
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