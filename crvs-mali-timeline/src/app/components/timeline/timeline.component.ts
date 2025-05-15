import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Process, ProcessStep, StepStatus } from '../../models';
import { ProcessService } from '../../services/process.service';

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, OnChanges {
    @Input() process!: Process;
    steps: ProcessStep[] = [];

    // Exposer l'énumération StepStatus au template
    stepStatus = StepStatus;

    constructor(private processService: ProcessService) { }

    ngOnInit(): void {
        if (this.process) {
            this.steps = [...this.process.steps].sort((a, b) => a.order - b.order);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['process'] && this.process) {
            this.steps = [...this.process.steps].sort((a, b) => a.order - b.order);
        }
    }

    // Obtenir les classes CSS pour le nœud d'étape
    getStepNodeClassMap(step: ProcessStep): { [key: string]: boolean } {
        const statusConfig = this.processService.getStepStatusConfig(step.status);
        const classMap: { [key: string]: boolean } = {};

        // Ajouter les classes basées sur le statut
        switch (step.status) {
            case StepStatus.COMPLETED:
                classMap['green'] = true;
                break;
            case StepStatus.IN_PROGRESS:
                classMap['orange'] = true;
                break;
            case StepStatus.CANCELLED:
                classMap['red'] = true;
                break;
            default:
                classMap['gray'] = true;
                break;
        }

        // En mode statique, aucune étape n'est cliquable
        classMap['clickable'] = false;

        return classMap;
    }

    // Obtenir la classe CSS pour la ligne de connexion entre deux jalons
    getConnectionLineClass(index: number): string {
        if (index >= this.steps.length - 1) {
            return '';
        }

        const currentStep = this.steps[index];

        // Retourne la classe de couleur basée sur le statut de l'étape actuelle
        if (currentStep.status === StepStatus.COMPLETED) {
            return 'green-line';
        } else if (currentStep.status === StepStatus.IN_PROGRESS) {
            return 'orange-line';
        } else if (currentStep.status === StepStatus.CANCELLED) {
            return 'red-line';
        } else {
            return 'gray-line';
        }
    }

    // Déterminer l'icône à afficher en fonction du statut de l'étape
    getStepStatusIcon(step: ProcessStep): string {
        const statusConfig = this.processService.getStepStatusConfig(step.status);
        return statusConfig.icon || '';
    }

    // Obtenir les styles CSS personnalisés pour un nœud d'étape
    getStepNodeStyles(step: ProcessStep): { [key: string]: string } {
        const statusConfig = this.processService.getStepStatusConfig(step.status);
        return {
            'background-color': statusConfig.color,
            'border-color': statusConfig.borderColor
        };
    }

    // Récupérer la configuration de la timeline
    getTimelineConfig(): any {
        return this.processService.getTimelineConfiguration();
    }

    // Gestion des clics sur les jalons (désactivée en mode statique)
    onStepNodeClick(step: ProcessStep): void {
        // En mode statique, aucune action n'est effectuée lors du clic
        // Cette méthode peut être étendue pour afficher des informations en lecture seule
        return;
    }
}