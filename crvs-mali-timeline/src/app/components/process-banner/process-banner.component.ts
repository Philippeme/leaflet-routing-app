import { Component, Input, OnInit } from '@angular/core';
import { Process, ProcessType } from '../../models';
import { ProcessService } from '../../services/process.service';

@Component({
    selector: 'app-process-banner',
    templateUrl: './process-banner.component.html',
    styleUrls: ['./process-banner.component.scss']
})
export class ProcessBannerComponent implements OnInit {
    @Input() process!: Process;

    constructor(private processService: ProcessService) { }

    ngOnInit(): void {
    }

    // Obtenir le titre du processus en fonction du type
    getProcessTitle(): string {
        const config = this.processService.getProcessTypeConfig(this.process.type);
        return config.displayName || config.name;
    }

    // Formater le NINA pour l'affichage visuel
    formatNina(nina: string): string[] {
        return nina.split('');
    }

    // Obtenir le style de fond de la bannière
    getBannerBackgroundStyle(): string {
        const config = this.processService.getProcessTypeConfig(this.process.type);
        return config.backgroundColor;
    }

    // Obtenir le style de bordure de la bannière
    getBannerBorderStyle(): string {
        const config = this.processService.getProcessTypeConfig(this.process.type);
        return `4px solid ${config.borderColor}`;
    }
}