// geocoding.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  placeId?: number; // Identifiant unique pour l'historique
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private autocompleteCache: Map<string, GeocodingResult[]> = new Map();

  constructor(private http: HttpClient) { }

  geocodeAddress(address: string): Observable<GeocodingResult[]> {
    // Vérifier si le résultat est dans le cache
    if (this.autocompleteCache.has(address)) {
      return of(this.autocompleteCache.get(address) || []);
    }

    const params = {
      format: 'json',
      q: address,
      limit: '5',
      addressdetails: '1'
    };

    return this.http.get<any[]>(this.nominatimUrl, { 
      params,
      headers: {
        'Accept-Language': 'fr' // Pour obtenir des résultats en français
      }
    }).pipe(
      map(results => {
        const formattedResults = results.map(item => ({
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
          placeId: item.place_id
        }));
        
        // Mettre en cache les résultats
        this.autocompleteCache.set(address, formattedResults);
        
        return formattedResults;
      }),
      catchError(err => {
        console.error('Erreur de géocodage:', err);
        return of([]);
      })
    );
  }

  // Fonction d'autocomplétion avec debounce pour limiter les requêtes
  getAutocompleteSuggestions(searchText: string): Observable<GeocodingResult[]> {
    if (!searchText || searchText.length < 3) {
      return of([]);
    }
    
    return this.geocodeAddress(searchText);
  }

  // Fonctions existantes pour valider et parser les coordonnées
  isValidCoordinate(input: string): boolean {
    const coordRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    return coordRegex.test(input);
  }

  parseCoordinates(input: string): { lat: number, lon: number } | null {
    if (!this.isValidCoordinate(input)) {
      return null;
    }

    const [lat, lon] = input.split(',').map(coord => parseFloat(coord.trim()));
    return { lat, lon };
  }
}