// map.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { GeolocationService, GeolocationPosition } from '../services/geolocation.service';
import { GeocodingService, GeocodingResult } from '../services/geocoding.service';
import { SearchHistoryService } from '../services/search-history.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private userPosition: L.Marker | null = null;
  public userLatLng: L.LatLng | null = null;
  public routingControl: L.Routing.Control | null = null;
  public destinationInput: string = '';
  
  // Nouvelles propriétés
  public autocompleteSuggestions: GeocodingResult[] = [];
  public searchHistory: GeocodingResult[] = [];
  public trackingEnabled: boolean = false;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private locationAccuracyCircle: L.Circle | null = null;

  constructor(
    private geolocationService: GeolocationService,
    private geocodingService: GeocodingService,
    private searchHistoryService: SearchHistoryService
  ) { }

  ngOnInit(): void {
    this.initMap();
    this.initSearchAutocomplete();
    this.loadSearchHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopLocationTracking();
  }

  private initMap(): void {
    // Configuration des icônes Leaflet (code existant)
    const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
    const iconUrl = 'assets/leaflet/marker-icon.png';
    const shadowUrl = 'assets/leaflet/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Initialisation de la carte
    this.map = L.map('map').setView([57.74, 11.94], 13);

    // Ajout du fond de carte
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Récupération de la position de l'utilisateur
    this.getUserLocation();
  }

  private initSearchAutocomplete(): void {
    // Configuration de l'autocomplétion avec debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchText => {
      if (searchText.length >= 3) {
        this.geocodingService.getAutocompleteSuggestions(searchText).subscribe({
          next: (results) => {
            this.autocompleteSuggestions = results;
          }
        });
      } else {
        this.autocompleteSuggestions = [];
      }
    });
  }

  private loadSearchHistory(): void {
    this.searchHistory = this.searchHistoryService.getSearchHistory();
  }

  public onSearchInput(): void {
    this.searchSubject.next(this.destinationInput);
  }

  public selectAutocompleteSuggestion(suggestion: GeocodingResult): void {
    this.destinationInput = suggestion.displayName;
    this.autocompleteSuggestions = [];
    // Créer l'itinéraire directement
    this.createRouteFromGeocodingResult(suggestion);
  }

  public loadFromHistory(historyItem: GeocodingResult): void {
    this.destinationInput = historyItem.displayName;
    this.createRouteFromGeocodingResult(historyItem);
  }

  public removeFromHistory(item: GeocodingResult): void {
    this.searchHistoryService.removeFromHistory(item);
    this.loadSearchHistory();
  }

  public clearHistory(): void {
    this.searchHistoryService.clearHistory();
    this.searchHistory = [];
  }

  private getUserLocation(): void {
    this.geolocationService.getCurrentPosition().subscribe({
      next: (position) => {
        this.updateUserLocationOnMap(position);
      },
      error: (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert(error);
      }
    });
  }

  public refreshUserLocation(): void {
    // Arrêter le suivi s'il est actif
    if (this.trackingEnabled) {
      this.toggleLocationTracking();
    }
    
    // Obtenir la position actuelle
    this.getUserLocation();
  }

  public toggleLocationTracking(): void {
    if (this.trackingEnabled) {
      // Démarrer le suivi
      this.geolocationService.startLocationTracking().subscribe({
        next: (position) => {
          this.updateUserLocationOnMap(position);
        },
        error: (error) => {
          console.error('Erreur de suivi de position:', error);
          this.trackingEnabled = false;
          alert(error);
        }
      });
    } else {
      // Arrêter le suivi
      this.stopLocationTracking();
    }
  }

  private stopLocationTracking(): void {
    this.geolocationService.stopLocationTracking();
  }

  private updateUserLocationOnMap(position: GeolocationPosition): void {
    this.userLatLng = L.latLng(position.latitude, position.longitude);
    
    // Centrer la carte sur la position de l'utilisateur
    this.map.setView(this.userLatLng, 15);
    
    // Mettre à jour ou créer le marqueur de position
    if (this.userPosition) {
      this.userPosition.setLatLng(this.userLatLng);
    } else {
      this.userPosition = L.marker(this.userLatLng)
        .addTo(this.map)
        .bindPopup('Votre position actuelle')
        .openPopup();
    }
    
    // Afficher un cercle indiquant la précision de la localisation
    if (this.locationAccuracyCircle) {
      this.locationAccuracyCircle.setLatLng(this.userLatLng);
      this.locationAccuracyCircle.setRadius(position.accuracy);
    } else {
      this.locationAccuracyCircle = L.circle(this.userLatLng, {
        radius: position.accuracy,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        weight: 1
      }).addTo(this.map);
    }
  }

  public calculateRoute(): void {
    if (!this.destinationInput.trim()) {
      alert('Veuillez entrer une destination');
      return;
    }

    if (!this.userLatLng) {
      alert('Impossible de déterminer votre position actuelle');
      return;
    }

    // Vérifier si l'entrée est au format coordonnées
    const coordinates = this.geocodingService.parseCoordinates(this.destinationInput);
    if (coordinates) {
      const result: GeocodingResult = {
        lat: coordinates.lat,
        lon: coordinates.lon,
        displayName: this.destinationInput
      };
      this.createRouteFromGeocodingResult(result);
    } else {
      // Sinon, faire une recherche d'adresse
      this.geocodingService.geocodeAddress(this.destinationInput).subscribe({
        next: (results) => {
          if (results.length === 0) {
            alert('Aucun résultat trouvé pour cette adresse');
            return;
          }
          
          this.createRouteFromGeocodingResult(results[0]);
        },
        error: (error) => {
          console.error('Erreur de géocodage:', error);
          alert('Erreur lors de la recherche de l\'adresse');
        }
      });
    }
  }

  private createRouteFromGeocodingResult(result: GeocodingResult): void {
    // Ajouter à l'historique
    this.searchHistoryService.addToHistory(result);
    this.loadSearchHistory();
    
    // Créer l'itinéraire
    if (!this.userLatLng) {
      alert('Votre position n\'est pas disponible. Veuillez rafraîchir votre position.');
      return;
    }

    // Supprimer l'itinéraire précédent s'il existe
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }

    // Créer l'itinéraire avec les options
    const routingOptions: any = {
      waypoints: [
        this.userLatLng,
        L.latLng(result.lat, result.lon)
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#0073FF', weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      }
    };
    
    this.routingControl = L.Routing.control(routingOptions).addTo(this.map);
  }

  public clearRoute(): void {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
    this.destinationInput = '';
    this.autocompleteSuggestions = [];
  }
}