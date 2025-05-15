// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { ProcessType } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'CRVS État du MALI - Suivi des Processus d\'Enregistrement Civil';
  selectedProcessType: ProcessType = ProcessType.BIRTH; // Par défaut sur Actes de Naissance

  // Définir les types de processus pour l'accès dans le template
  processTypes = ProcessType;

  constructor() { }

  ngOnInit(): void {
    // Au démarrage, on est automatiquement sur les Actes de Naissance
  }

  // Méthode pour changer le type de processus sélectionné
  selectProcessType(type: ProcessType): void {
    this.selectedProcessType = type;
  }
}