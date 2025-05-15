import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Process, ProcessType } from '../../models';
import { ProcessService } from '../../services/process.service';

@Component({
    selector: 'app-process-display',
    templateUrl: './process-display.component.html',
    styleUrls: ['./process-display.component.scss']
})
export class ProcessDisplayComponent implements OnInit, OnDestroy {
    @Input() processType!: ProcessType;

    currentProcess: Process | null = null;
    private processSubscription?: Subscription;
    private previousProcessType?: ProcessType;

    constructor(private processService: ProcessService) { }

    ngOnInit(): void {
        // S'abonne aux changements du processus actuel
        this.processSubscription = this.processService.getCurrentProcess().subscribe(
            process => {
                this.currentProcess = process;
            }
        );

        // Charge le processus initial
        this.loadProcess();
    }

    ngOnDestroy(): void {
        if (this.processSubscription) {
            this.processSubscription.unsubscribe();
        }
    }

    ngOnChanges(): void {
        // Détecte les changements de type de processus
        if (this.processType !== this.previousProcessType) {
            this.previousProcessType = this.processType;
            this.loadProcess();
        }
    }

    private loadProcess(): void {
        if (this.processType) {
            this.processService.switchProcessType(this.processType);
        }
    }
}