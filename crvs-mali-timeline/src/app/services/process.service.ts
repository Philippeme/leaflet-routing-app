import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Process, ProcessStep, ProcessType, StepStatus, ApiResponse } from '../models';
import { ApiConfigService } from './api-config.service';

@Injectable({
    providedIn: 'root'
})
export class ProcessService {
    private currentProcessSubject = new BehaviorSubject<Process | null>(null);
    private currentProcessType: ProcessType = ProcessType.BIRTH;

    constructor(
        private http: HttpClient,
        private apiConfig: ApiConfigService
    ) {
        // Charge le processus initial au démarrage
        this.loadCurrentProcess(ProcessType.BIRTH);
    }

    // === MÉTHODES PUBLIQUES ===

    /**
     * Récupère le processus actuel en cours d'observation
     */
    getCurrentProcess(): Observable<Process | null> {
        return this.currentProcessSubject.asObservable();
    }

    /**
     * Charge le processus actuel pour un type donné
     * En mode statique, utilise les scénarios définis dans la configuration
     */
    loadCurrentProcess(type: ProcessType): void {
        this.currentProcessType = type;

        // Mode statique uniquement : utilise les scénarios de configuration
        const scenario = this.apiConfig.getScenario(type);
        const stepDefinitions = this.apiConfig.getStepDefinitions(type);

        const process = this.buildProcessFromScenario(type, scenario, stepDefinitions);
        this.currentProcessSubject.next(process);
    }

    /**
     * Récupère la configuration d'un type de processus
     */
    getProcessTypeConfig(type: ProcessType) {
        return this.apiConfig.getProcessTypeConfig(type);
    }

    /**
     * Récupère la configuration d'un statut d'étape
     */
    getStepStatusConfig(status: StepStatus) {
        return this.apiConfig.getStepStatusConfig(status);
    }

    /**
     * Vérifie si les interactions sont activées
     */
    areInteractionsEnabled(): boolean {
        return this.apiConfig.areInteractionsEnabled();
    }

    // === MÉTHODES PRIVÉES ===

    /**
     * Construit un processus à partir d'un scénario de configuration
     */
    private buildProcessFromScenario(type: ProcessType, scenario: any, stepDefinitions: any[]): Process {
        const steps: ProcessStep[] = stepDefinitions.map((definition, index) => {
            const scenarioStep = scenario.steps.find((s: any) => s.stepId === definition.id);

            return {
                id: `${definition.id}-${Date.now()}`,
                stepId: definition.id,
                order: definition.order,
                label: definition.label,
                shortLabel: definition.shortLabel,
                icon: definition.icon,
                status: scenarioStep?.status || StepStatus.NOT_STARTED,
                completionDate: scenarioStep?.completionDate ? new Date(scenarioStep.completionDate) : undefined,
                description: definition.description
            };
        });

        return {
            id: `${type.toLowerCase()}-${Date.now()}`,
            type,
            declarationNumber: scenario.declarationNumber,
            nina: scenario.nina,
            steps,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Récupère le type de processus actuellement sélectionné
     */
    getCurrentProcessType(): ProcessType {
        return this.currentProcessType;
    }

    /**
     * Change le type de processus et charge le processus correspondant
     */
    switchProcessType(type: ProcessType): void {
        if (this.currentProcessType !== type) {
            this.loadCurrentProcess(type);
        }
    }

    /**
     * Récupère tous les types de processus disponibles
     */
    getAvailableProcessTypes(): any[] {
        return this.apiConfig.getAllProcessTypes();
    }

    /**
     * Récupère la configuration de la timeline
     */
    getTimelineConfiguration(): any {
        return this.apiConfig.getTimelineConfiguration();
    }

    /**
     * Vérifie si l'application est en mode statique
     */
    isStaticMode(): boolean {
        return this.apiConfig.isStaticMode();
    }
}