import { Injectable } from '@angular/core';
import { Process, ProcessType, ProcessStep, StepStatus, ProcessTypeConfig, StepStatusConfig, StepDefinition, TimelineScenario } from '../models';

@Injectable({
    providedIn: 'root'
})
export class ApiConfigService {
    private config: any;

    constructor() {
        // Configuration statique pour le mode sans interactions
        this.config = this.getApiConfig();
    }

    // Récupère la configuration API complète en mode statique
    private getApiConfig(): any {
        return {
            "metadata": {
                "version": "1.0.0",
                "name": "CRVS Mali Timeline API Service - Static Mode",
                "apiBaseUrl": "https://api.crvs-mali.gov.ml",
                "staticMode": true,
                "interactionsEnabled": false
            },
            "processTypes": {
                "BIRTH": {
                    "id": "BIRTH",
                    "name": "Acte de Naissance",
                    "displayName": "Actes de Naissance",
                    "code": "ACTE_NAISSANCE",
                    "prefix": "N",
                    "icon": "child_care",
                    "color": "#2196f3",
                    "backgroundColor": "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                    "borderColor": "#2196f3"
                },
                "MARRIAGE": {
                    "id": "MARRIAGE",
                    "name": "Acte de Mariage",
                    "displayName": "Actes de Mariage",
                    "code": "ACTE_MARIAGE",
                    "prefix": "M",
                    "icon": "favorite",
                    "color": "#e91e63",
                    "backgroundColor": "linear-gradient(135deg, #f8bbd0, #f48fb1)",
                    "borderColor": "#e91e63"
                },
                "DEATH": {
                    "id": "DEATH",
                    "name": "Acte de Décès",
                    "displayName": "Actes de Décès",
                    "code": "ACTE_DECES",
                    "prefix": "D",
                    "icon": "contact_emergency",
                    "color": "#757575",
                    "backgroundColor": "linear-gradient(135deg, #e1e1e1, #bdbdbd)",
                    "borderColor": "#757575"
                }
            },
            "stepStatuses": {
                "NOT_STARTED": {
                    "id": "NOT_STARTED",
                    "code": "PAS_COMMENCE",
                    "label": "Pas commencé",
                    "shortLabel": "Pas commencé",
                    "color": "#bdbdbd",
                    "borderColor": "#9e9e9e",
                    "lineColor": "#bdbdbd",
                    "icon": null,
                    "iconColor": "#ffffff"
                },
                "IN_PROGRESS": {
                    "id": "IN_PROGRESS",
                    "code": "EN_COURS",
                    "label": "En cours",
                    "shortLabel": "En cours",
                    "color": "#ff9800",
                    "borderColor": "#f57c00",
                    "lineColor": "#ff9800",
                    "icon": "more_horiz",
                    "iconColor": "#ffffff"
                },
                "COMPLETED": {
                    "id": "COMPLETED",
                    "code": "FAIT",
                    "label": "Fait",
                    "shortLabel": "Fait",
                    "color": "#4caf50",
                    "borderColor": "#388e3c",
                    "lineColor": "#4caf50",
                    "icon": "check",
                    "iconColor": "#ffffff"
                },
                "CANCELLED": {
                    "id": "CANCELLED",
                    "code": "ANNULE",
                    "label": "Annulé",
                    "shortLabel": "Annulé",
                    "color": "#f44336",
                    "borderColor": "#d32f2f",
                    "lineColor": "#f44336",
                    "icon": "close",
                    "iconColor": "#ffffff"
                }
            },
            "processSteps": {
                "BIRTH": [
                    {
                        "id": "enregistrement",
                        "code": "ENREGISTREMENT_NAISSANCE",
                        "order": 1,
                        "label": "Enregistrement de naissance",
                        "shortLabel": "Enregistrement",
                        "icon": "app_registration"
                    },
                    {
                        "id": "declaration",
                        "code": "DECLARATION_NAISSANCE",
                        "order": 2,
                        "label": "Déclaration de naissance",
                        "shortLabel": "Déclaration",
                        "icon": "description"
                    },
                    {
                        "id": "etablissement",
                        "code": "ETABLISSEMENT_ACTE_NAISSANCE",
                        "order": 3,
                        "label": "Établissement de l'acte",
                        "shortLabel": "Établissement",
                        "icon": "gavel"
                    },
                    {
                        "id": "remise",
                        "code": "REMISE_ACTE_NAISSANCE",
                        "order": 4,
                        "label": "Remise de l'acte",
                        "shortLabel": "Remise",
                        "icon": "assignment_turned_in"
                    }
                ],
                "MARRIAGE": [
                    {
                        "id": "declaration",
                        "code": "DECLARATION_MARIAGE",
                        "order": 1,
                        "label": "Déclaration de mariage",
                        "shortLabel": "Déclaration",
                        "icon": "favorite"
                    },
                    {
                        "id": "publication",
                        "code": "PUBLICATION_MARIAGE",
                        "order": 2,
                        "label": "Publication de mariage",
                        "shortLabel": "Publication",
                        "icon": "campaign"
                    },
                    {
                        "id": "enquetes",
                        "code": "ENQUETES_PRENUPTIALES",
                        "order": 3,
                        "label": "Enquêtes prénuptiales",
                        "shortLabel": "Enquêtes",
                        "icon": "find_in_page"
                    },
                    {
                        "id": "celebration_remise",
                        "code": "CELEBRATION_REMISE_ACTE_MARIAGE",
                        "order": 4,
                        "label": "Célébration et Remise de l'acte",
                        "shortLabel": "Célébration",
                        "icon": "celebration"
                    }
                ],
                "DEATH": [
                    {
                        "id": "certificat",
                        "code": "CERTIFICAT_DECES",
                        "order": 1,
                        "label": "Certificat de décès",
                        "shortLabel": "Certificat",
                        "icon": "medical_services"
                    },
                    {
                        "id": "declaration",
                        "code": "DECLARATION_DECES",
                        "order": 2,
                        "label": "Déclaration de décès",
                        "shortLabel": "Déclaration",
                        "icon": "description"
                    },
                    {
                        "id": "etablissement",
                        "code": "ETABLISSEMENT_ACTE_DECES",
                        "order": 3,
                        "label": "Établissement de l'acte",
                        "shortLabel": "Établissement",
                        "icon": "gavel"
                    },
                    {
                        "id": "remise",
                        "code": "REMISE_ACTE_DECES",
                        "order": 4,
                        "label": "Remise de l'acte",
                        "shortLabel": "Remise",
                        "icon": "assignment_turned_in"
                    }
                ]
            },
            "scenarios": {
                "BIRTH": {
                    "declarationNumber": "N-2025-0001",
                    "nina": "123456789012345",
                    "steps": [
                        {
                            "stepId": "enregistrement",
                            "status": "COMPLETED",
                            "completionDate": "2025-04-15T10:30:00Z"
                        },
                        {
                            "stepId": "declaration",
                            "status": "COMPLETED",
                            "completionDate": "2025-04-18T14:20:00Z"
                        },
                        {
                            "stepId": "etablissement",
                            "status": "CANCELLED",
                            "completionDate": null
                        },
                        {
                            "stepId": "remise",
                            "status": "COMPLETED",
                            "completionDate": null
                        }
                    ]
                },
                "MARRIAGE": {
                    "declarationNumber": "M-2025-0001",
                    "nina": "987654321098765",
                    "steps": [
                        {
                            "stepId": "declaration",
                            "status": "COMPLETED",
                            "completionDate": "2025-04-10T11:00:00Z"
                        },
                        {
                            "stepId": "publication",
                            "status": "COMPLETED",
                            "completionDate": "2025-04-17T16:30:00Z"
                        },
                        {
                            "stepId": "enquetes",
                            "status": "CANCELLED",
                            "completionDate": null
                        },
                        {
                            "stepId": "celebration_remise",
                            "status": "CANCELLED",
                            "completionDate": null
                        }
                    ]
                },
                "DEATH": {
                    "declarationNumber": "D-2025-0001",
                    "nina": "456789012345678",
                    "steps": [
                        {
                            "stepId": "certificat",
                            "status": "COMPLETED",
                            "completionDate": "2025-04-12T13:45:00Z"
                        },
                        {
                            "stepId": "declaration",
                            "status": "COMPLETED",
                            "completionDate": "2025-04-14T10:15:00Z"
                        },
                        {
                            "stepId": "etablissement",
                            "status": "COMPLETED",
                            "completionDate": "2025-04-20T15:00:00Z"
                        },
                        {
                            "stepId": "remise",
                            "status": "IN_PROGRESS",
                            "completionDate": null
                        }
                    ]
                }
            },
            "timelineConfiguration": {
                "visual": {
                    "nodeSize": 36,
                    "compactNodeSize": 28,
                    "lineHeight": 4,
                    "iconSize": 18
                },
                "animation": {
                    "duration": 300,
                    "easing": "ease-in-out"
                },
                "interactions": {
                    "clickable": false,
                    "draggable": false,
                    "selectable": false
                }
            }
        };
    }

    // Récupère la configuration d'un type de processus
    getProcessTypeConfig(type: ProcessType): ProcessTypeConfig {
        return this.config.processTypes[type];
    }

    // Récupère la configuration de tous les types de processus
    getAllProcessTypes(): ProcessTypeConfig[] {
        return Object.values(this.config.processTypes);
    }

    // Récupère la configuration d'un statut d'étape
    getStepStatusConfig(status: StepStatus): StepStatusConfig {
        return this.config.stepStatuses[status];
    }

    // Récupère la configuration de tous les statuts
    getAllStepStatuses(): StepStatusConfig[] {
        return Object.values(this.config.stepStatuses);
    }

    // Récupère les définitions d'étapes pour un type de processus
    getStepDefinitions(type: ProcessType): StepDefinition[] {
        return this.config.processSteps[type] || [];
    }

    // Récupère le scénario par défaut pour un type de processus
    getScenario(type: ProcessType): TimelineScenario {
        return this.config.scenarios[type];
    }

    // Récupère l'URL de base de l'API
    getApiBaseUrl(): string {
        return this.config.metadata.apiBaseUrl;
    }

    // Vérifie si l'application est en mode statique
    isStaticMode(): boolean {
        return this.config.metadata.staticMode === true;
    }

    // Vérifie si les interactions sont activées
    areInteractionsEnabled(): boolean {
        return this.config.metadata.interactionsEnabled === true;
    }

    // Récupère la configuration visuelle de la timeline
    getTimelineConfiguration(): any {
        return this.config.timelineConfiguration || {
            visual: {
                nodeSize: 36,
                compactNodeSize: 28,
                lineHeight: 4,
                iconSize: 18
            },
            animation: {
                duration: 300,
                easing: "ease-in-out"
            },
            interactions: {
                clickable: false,
                draggable: false,
                selectable: false
            }
        };
    }

    // Récupère les endpoints de l'API
    getApiEndpoints(): any {
        return this.config.apiEndpoints;
    }

    // Récupère les messages de localisation
    getLocalizedMessages(language: string = 'fr'): any {
        return this.config.localization?.[language] || this.config.localization?.fr;
    }
}