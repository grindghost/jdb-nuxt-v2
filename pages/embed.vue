<template>
    <!-- This is the embed unit component -->
    <UnitEmbed
        :profile=profile 
    />
  
</template>

<script setup>
    import { initializeScaler } from '~/utils/scaler';
    import { useAppStateStore } from '/stores/appState';

    const store = useAppStateStore();
    const config = useRuntimeConfig();

    const profile = ref({});

    definePageMeta({
        layout: false,
    });

    onMounted(async() => {
        
        // Object test
        const objTest = {
            "configs": {
                "collectionId": "jjq7raxar3a1nu3",
                "collectionName": "Configs",
                "created": "2024-10-17 19:11:48.366Z",
                "currentCollection": "Automne 2024",
                "history": 3,
                "id": "3znbpxwdnlhju0q",
                "maintenanceMode": false,
                "maxChar": 1000,
                "name": "global",
                "openInNewWindow": true,
                "proxy": "https://ulavalcorsproxy.onrender.com/",
                "updated": "2024-12-25 19:13:50.948Z"
            },
            "activity": {
                "activityTitle": "Exercice 1",
                "contextText": "<p></p>",
                "customPlaceholder": "...",
                "defaultText": "<p></p>",
                "isEndpoint": false,
                "maxCharactersAllowed": 1000,
                "token": "U2FsdGVkX19V6ijt6Qvi7ZPkpc9h44HR3CIIdxmJ/1nvAHpWzgswKlRFOrTWeTcXgO4Mqcpe0hK/cgx22UWM84mb+vhtqWnQ4QWRvx9B3O/7uOAoeNZD0+ezhimNzoiD5m74niJv0U7KRNLAJJK9bQ==",
                "useCharactersLimit": true,
                "useCustomPlaceholder": false
            },
            "project": {
                "author": "xjopkfmhrnv9rlz",
                "collectionId": "hgpz21hr6g5k9ua",
                "collectionName": "Projects",
                "created": "2025-01-17 17:00:27.705Z",
                "id": "1cbqz4p4xhzv1bi",
                "profile": {
                    "author": "xjopkfmhrnv9rlz",
                    "courseId": "L'apprentissage du savoir faire...",
                    "customTheme": "#fcba03",
                    "description": "RQ - Janvier",
                    "expirationDate": null,
                    "lang": "fr",
                    "maintenanceMode": false,
                    "name": "Module 5",
                    "pdfCoverImgUrl": "https://jdb.pockethost.io/api/files/ch1qakk3faxo2cl/y9vgs67inbxwz6d/cover_image_NwRQdXJQOQ.png",
                    "pdfFileSize": "1.52 MB",
                    "pdfFilename": "Journal_de_bord-M5",
                    "pdfURL": "https://jdb.pockethost.io/api/files/ch1qakk3faxo2cl/y9vgs67inbxwz6d/project_1737133225412_n4IJ3yIIO7.pdf?token=",
                    "published": true,
                    "theme": "brio",
                    "useCustomTheme": false,
                    "useExpirationDate": false
                },
                "updated": "2025-01-17 17:00:27.837Z"
            },
            "locale": {
                "lang": "fr",
                "placeholder": "Entrez votre réflexion ici...",
                "editorView": {
                    "buttons": {
                        "submit": "Soumette",
                        "correct": "Corriger"
                    },
                    "charCount": "caractères",
                    "allowedChar": "permis",
                    "toolbar": {
                        "h1": "Niveau 1",
                        "h2": "Niveau 2",
                        "h3": "Niveau 3",
                        "normal": "Paragraphe"
                    },
                    "restoreDefaultText": "Restorer le format"
                },
                "completedView": {
                    "body": "Votre réponse sera compilée dans votre journal<br>de bord que vous pourrez télécharger au format<br>PDF à la fin de votre formation.",
                    "button": "Corriger ma réponse",
                    "header": "Vous avez bel et bien<br>complété cet exercice."
                },
                "endpointView": {
                    "body": "Cliquez ici pour récupérer votre PDF<br>contenant toutes vos réponses.",
                    "header": "Le journal de bord<br>de votre module<br>est prêt!",
                    "button": "Télécharger"
                },
                "maintenanceView": {
                    "header": "Maintenance en cours...",
                    "body": "Nous devons temporairement restreindre l'accès<br/>aux zones de réflexions interactives, car nous effectuons <br/>des travaux de maintenance. Nous vous prions de nous<br/>excuser pour cette interruption..."
                }
            },
            "history": 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua…',
        }

        
        // Scaling logic, specific to this embedable page
        initializeScaler();

        // Step 1: Get the query parameters
        const queryParams = new URLSearchParams(window.location.search); 
        
        // Step 2: Get the token, and the language from the query parameters
        const token = queryParams.get('token') || 'U2FsdGVkX19V6ijt6Qvi7ZPkpc9h44HR3CIIdxmJ/1nvAHpWzgswKlRFOrTWeTcXgO4Mqcpe0hK/cgx22UWM84mb+vhtqWnQ4QWRvx9B3O/7uOAoeNZD0+ezhimNzoiD5m74niJv0U7KRNLAJJK9bQ==';
        
        const lang = queryParams.get('lang') || 'fr';

        // Step 3: Validate and decrypt the token with the server
        const decryptedPayload = await $fetch('/api/validateToken', {
            method: 'GET',
            params: { token },
        });

        const decryptedPayloadJson = JSON.parse(decryptedPayload);
        const { source, project, exercice } = decryptedPayloadJson;


        if (!source || source !== config.public.allowedSource || !project || !exercice) {
            document.body.innerHTML = "🔓 Invalid or missing parameters in the token.";  
            return;
        }
        
        // Logic to assign, of remotly retrieve the unit profile (from db)
        // profile.value = await store.GetUnitProfile(token, lang); 
        profile.value = objTest;
        
        await store.SetUnitStateOnArrival(profile.value);
    });

</script>




    
 