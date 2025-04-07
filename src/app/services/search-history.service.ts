// search-history.service.ts
import { Injectable } from '@angular/core';
import { GeocodingResult } from './geocoding.service';

@Injectable({
  providedIn: 'root'
})
export class SearchHistoryService {
  private readonly STORAGE_KEY = 'map_search_history';
  private readonly MAX_HISTORY_ITEMS = 10;
  
  constructor() { }
  
  // Récupérer l'historique de recherche
  getSearchHistory(): GeocodingResult[] {
    const historyJson = localStorage.getItem(this.STORAGE_KEY);
    if (!historyJson) {
      return [];
    }
    
    try {
      return JSON.parse(historyJson);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }
  
  // Ajouter une entrée à l'historique
  addToHistory(item: GeocodingResult): void {
    const history = this.getSearchHistory();
    
    // Vérifier si l'élément existe déjà (basé sur placeId ou coordonnées)
    const existingIndex = history.findIndex(h => 
      (h.placeId && h.placeId === item.placeId) || 
      (h.lat === item.lat && h.lon === item.lon)
    );
    
    // Si l'élément existe, le supprimer pour le déplacer en haut de la liste
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }
    
    // Ajouter le nouvel élément au début
    history.unshift(item);
    
    // Limiter la taille de l'historique
    if (history.length > this.MAX_HISTORY_ITEMS) {
      history.pop();
    }
    
    // Sauvegarder l'historique mis à jour
    this.saveHistory(history);
  }
  
  // Supprimer un élément de l'historique
  removeFromHistory(item: GeocodingResult): void {
    let history = this.getSearchHistory();
    
    history = history.filter(h => 
      (!h.placeId || h.placeId !== item.placeId) && 
      !(h.lat === item.lat && h.lon === item.lon)
    );
    
    this.saveHistory(history);
  }
  
  // Effacer tout l'historique
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  // Sauvegarde l'historique dans le localStorage
  private saveHistory(history: GeocodingResult[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
  }
}