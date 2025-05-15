// Énumération des types de processus
export enum ProcessType {
    BIRTH = 'BIRTH',
    MARRIAGE = 'MARRIAGE',
    DEATH = 'DEATH'
}

// Énumération des états d'étape (suppression du statut BLOCKED)
export enum StepStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

// Interface pour une étape du processus
export interface ProcessStep {
    id: string;
    stepId: string;
    order: number;
    label: string;
    shortLabel?: string;
    icon: string;
    status: StepStatus;
    completionDate?: Date;
    description?: string;
    updatedBy?: string;
    comment?: string;
}

// Interface pour un processus complet
export interface Process {
    id: string;
    type: ProcessType;
    declarationNumber: string;
    nina: string;
    steps: ProcessStep[];
    createdAt: Date;
    updatedAt: Date;
    metadata?: any;
}

// Interface pour la configuration d'un type de processus
export interface ProcessTypeConfig {
    id: string;
    name: string;
    displayName: string;
    code: string;
    prefix: string;
    icon: string;
    color: string;
    backgroundColor: string;
    borderColor: string;
}

// Interface pour la configuration d'un statut d'étape
export interface StepStatusConfig {
    id: string;
    code: string;
    label: string;
    shortLabel: string;
    color: string;
    borderColor: string;
    lineColor: string;
    icon?: string;
    iconColor: string;
    description: string;
}

// Interface pour la définition d'une étape
export interface StepDefinition {
    id: string;
    code: string;
    order: number;
    label: string;
    shortLabel: string;
    icon: string;
    description: string;
    isRequired: boolean;
    canSkip: boolean;
    estimatedDuration: string;
}

// Interface pour l'historique des changements
export interface ProcessHistory {
    id: string;
    processId: string;
    stepId: string;
    previousStatus: string;
    newStatus: string;
    changedAt: Date;
    changedBy: string;
    comment?: string;
}

// Interface pour la réponse de l'API
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: Date;
}

// Interface pour les scénarios de timeline
export interface TimelineScenario {
    declarationNumber: string;
    nina: string;
    steps: {
        stepId: string;
        status: StepStatus;
        completionDate?: Date;
    }[];
}

// Type pour les erreurs de l'API
export interface ApiError {
    code: string;
    message: string;
    httpStatus: number;
    details?: any;
}