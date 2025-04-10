// map.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { GeolocationService, GeolocationPosition } from '../services/geolocation.service';
import { GeocodingService, GeocodingResult } from '../services/geocoding.service';
import { SearchHistoryService } from '../services/search-history.service';

// Interfaces pour la structure hiérarchique des données
interface RegionData {
  name: string;
  lat: number;
  lon: number;
  weight: number;
  color: string;
  children: CercleData[];
}

interface CercleData {
  name: string;
  lat: number;
  lon: number;
  weight: number;
  color: string;
  children: CommuneData[];
}

interface CommuneData {
  name: string;
  lat: number;
  lon: number;
  weight: number;
  color: string;
  children: CivilStatusCenterData[];
}

interface CivilStatusCenterData {
  name: string;
  lat: number;
  lon: number;
  weight: number;
  color: string;
}

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

  // Propriétés de suivi de localisation
  public trackingEnabled: boolean = false;
  private locationAccuracyCircle: L.Circle | null = null;
  private destroy$ = new Subject<void>();

  // Propriétés pour la carte du Mali
  private currentZoomLevel: number = 0;
  private maxZoomLevel: number = 3; // Limite à 4 niveaux (0-3)
  private regionMarkers: L.Marker[] = [];
  private cercleMarkers: L.Marker[] = [];
  private communeMarkers: L.Marker[] = [];
  private civilStatusMarkers: L.Marker[] = [];
  private selectedRegionIndex: number = -1;
  private selectedCercleIndex: number = -1;
  private selectedCommuneIndex: number = -1;

  // Effets visuels
  private pulseEffectCircle: L.Circle | null = null;
  private explosionEffectCircle: L.Circle | null = null;
  private zoomDirection: 'in' | 'out' | null = null;
  private lastZoomLevel: number = 0;

  // Propriétés pour le système de filtrage
  public selectedRegionFilter: string = '';
  public selectedCercleFilter: string = '';
  public selectedCommuneFilter: string = '';
  public selectedCenterFilter: string = '';

  // Propriétés pour la recherche par texte
  public regionSearchInput: string = '';
  public cercleSearchInput: string = '';
  public communeSearchInput: string = '';
  public centerSearchInput: string = '';

  // Listes pour les options de filtrage
  public availableRegions: RegionData[] = [];
  public availableCercles: CercleData[] = [];
  public availableCommunes: CommuneData[] = [];
  public availableCenters: CivilStatusCenterData[] = [];

  // Données des régions du Mali
  private maliRegionData: RegionData[] = [
    {
      name: "Kayes",
      lat: 14.4520,
      lon: -11.4437,
      weight: 6,
      color: "#4CAF50", // Vert
      children: [
        {
          name: "Bafoulabé",
          lat: 13.8059,
          lon: -10.8326,
          weight: 6,
          color: "#FFC107", // Jaune
          children: [
            {
              name: "Bamafélé",
              lat: 13.3614,
              lon: -10.8435,
              weight: 6,
              color: "#F44336", // Rouge
              children: [
                {
                  name: "Centre d'état civil de Bamafélé",
                  lat: 13.3724,
                  lon: -10.8339,
                  weight: 4,
                  color: "#2196F3" // Bleu
                }
              ]
            }
          ]
        },
        {
          name: "Kayes Cercle",
          lat: 14.4520,
          lon: -11.4437,
          weight: 6,
          color: "#FFC107", // Jaune
          children: [
            {
              name: "Bangassi",
              lat: 14.3954,
              lon: -11.3845,
              weight: 6,
              color: "#F44336", // Rouge
              children: [
                {
                  name: "Centre d'état civil de Bangassi",
                  lat: 14.3927,
                  lon: -11.3762,
                  weight: 4,
                  color: "#2196F3" // Bleu
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "Ménaka",
      lat: 15.9129,
      lon: 2.3992,
      weight: 6,
      color: "#4CAF50", // Vert
      children: [
        {
          name: "Ménaka Cercle",
          lat: 15.9129,
          lon: 2.3992,
          weight: 6,
          color: "#FFC107", // Jaune
          children: [
            {
              name: "Inékar",
              lat: 15.9578,
              lon: 2.5984,
              weight: 6,
              color: "#F44336", // Rouge
              children: [
                {
                  name: "Centre d'état civil d'Inékar",
                  lat: 15.9613,
                  lon: 2.6014,
                  weight: 4,
                  color: "#2196F3" // Bleu
                }
              ]
            }
          ]
        },
        {
          name: "Andéramboukane",
          lat: 15.7193,
          lon: 3.2856,
          weight: 6,
          color: "#FFC107", // Jaune
          children: [
            {
              name: "Andéramboukane Commune",
              lat: 15.7193,
              lon: 3.2856,
              weight: 6,
              color: "#F44336", // Rouge
              children: [
                {
                  name: "Centre d'état civil d'Andéramboukane",
                  lat: 15.7225,
                  lon: 3.2893,
                  weight: 4,
                  color: "#2196F3" // Bleu
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  constructor(
    private geolocationService: GeolocationService,
    private geocodingService: GeocodingService,
    private searchHistoryService: SearchHistoryService
  ) { }

  ngOnInit(): void {
    this.initMap();
    this.initFilterOptions();
    this.getUserLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopLocationTracking();
    this.clearAllMarkers();
    this.removePulseEffect();
    this.removeExplosionEffect();
  }

  private initMap(): void {
    // Configuration de l'icône Leaflet par défaut
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

    // Centrer la carte sur le Mali (moyenne des coordonnées de nos régions)
    const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
    const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;

    // Initialiser la carte sans l'attribution par défaut
    this.map = L.map('map', {
      attributionControl: false
    }).setView([centerLat, centerLon], 5);

    // Ajouter un contrôle d'attribution personnalisé sans le drapeau de l'Ukraine
    L.control.attribution({
      prefix: false
    }).addAttribution('&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>').addTo(this.map);

    // Ajouter la couche de tuiles sans attribution (puisque nous l'avons déjà ajoutée)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(this.map);

    // Initialiser les marqueurs de région
    this.initializeRegionMarkers();

    // Ajouter des gestionnaires pour le zoom
    this.map.on('zoomstart', () => {
      const currentZoom = this.map.getZoom();
      this.lastZoomLevel = currentZoom;
    });

    this.map.on('zoomend', () => {
      const newZoom = this.map.getZoom();
      this.zoomDirection = newZoom > this.lastZoomLevel ? 'in' : 'out';
      this.handleZoomChange();
    });

    // Limiter les niveaux de zoom
    this.map.setMinZoom(5);
    this.map.setMaxZoom(9);
  }

  private initFilterOptions(): void {
    // Initialiser les options de filtrage pour les régions
    this.availableRegions = [...this.maliRegionData];
  }

  private initializeRegionMarkers(): void {
    // Effacer les marqueurs existants
    this.clearAllMarkers();

    // Ajouter les marqueurs de région
    this.maliRegionData.forEach((region, index) => {
      const marker = this.createMarker(
        [region.lat, region.lon],
        region.weight,
        region.color,
        region.name,
        () => this.handleRegionMarkerClick(index)
      );
      this.regionMarkers.push(marker);
    });

    // Réinitialiser le niveau de zoom et les sélections
    this.currentZoomLevel = 0;
    this.selectedRegionIndex = -1;
    this.selectedCercleIndex = -1;
    this.selectedCommuneIndex = -1;

    // Ajouter un effet de pulsation pour les régions lors de l'initialisation
    const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
    const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
    // Créer l'effet mais avec opacité 0 et non interactif
    if (this.pulseEffectCircle) {
      this.map.removeLayer(this.pulseEffectCircle);
    }

    this.pulseEffectCircle = L.circle([centerLat, centerLon], {
      radius: 50000,
      color: 'transparent',
      fillColor: 'transparent',
      fillOpacity: 0,
      weight: 0,
      interactive: false,
      className: 'pulse-effect'
    }).addTo(this.map);
  }

  private createMarker(
    position: [number, number],
    weight: number,
    color: string,
    title: string,
    clickHandler: () => void
  ): L.Marker {
    // Créer une icône personnalisée avec la couleur et le poids spécifiés
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: ${weight * 5}px;
        height: ${weight * 5}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
      "></div>`,
      iconSize: [weight * 5, weight * 5],
      iconAnchor: [weight * 2.5, weight * 2.5]
    });

    // Créer et ajouter le marqueur
    const marker = L.marker(position, { icon: customIcon })
      .addTo(this.map)
      .bindTooltip(title, { permanent: false, direction: 'top' });

    // Ajouter un effet au survol
    marker.on('mouseover', () => {
      marker.setIcon(L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: ${(weight * 5) + 4}px;
          height: ${(weight * 5) + 4}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 8px rgba(0,0,0,0.7);
          opacity: 0.9;
        "></div>`,
        iconSize: [(weight * 5) + 4, (weight * 5) + 4],
        iconAnchor: [(weight * 2.5) + 2, (weight * 2.5) + 2]
      }));
    });

    marker.on('mouseout', () => {
      marker.setIcon(customIcon);
    });

    // Ajouter le gestionnaire de clic
    marker.on('click', clickHandler);

    return marker;
  }

  private handleZoomChange(): void {
    // Obtenir le niveau de zoom actuel
    const zoom = this.map.getZoom();
    console.log('Zoom level changed to:', zoom, 'Direction:', this.zoomDirection);

    // Déterminer la catégorie de niveau de zoom (0-3)
    let newZoomLevel = 0;
    if (zoom >= 7.5) {
      newZoomLevel = 3; // Niveau des centres d'état civil
    } else if (zoom >= 6.5) {
      newZoomLevel = 2; // Niveau des communes
    } else if (zoom >= 6) {
      newZoomLevel = 1; // Niveau des cercles
    }

    console.log('New zoom category:', newZoomLevel, 'Current zoom category:', this.currentZoomLevel);

    // Fonction pour vérifier si une position est au centre de la carte
    const isCentralPosition = (lat: number, lon: number): boolean => {
      const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
      const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
      return Math.abs(lat - centerLat) < 0.5 && Math.abs(lon - centerLon) < 0.5;
    };

    // Si la catégorie de niveau de zoom a changé, mettre à jour les marqueurs
    if (newZoomLevel !== this.currentZoomLevel) {
      const oldZoomLevel = this.currentZoomLevel;
      this.currentZoomLevel = newZoomLevel;

      // Déterminer la couleur de l'effet en fonction du niveau de zoom
      let effectColor;
      switch (this.currentZoomLevel) {
        case 0: effectColor = "#4CAF50"; break; // Vert pour régions
        case 1: effectColor = "#FFC107"; break; // Jaune pour cercles
        case 2: effectColor = "#F44336"; break; // Rouge pour communes
        case 3: effectColor = "#2196F3"; break; // Bleu pour centres
        default: effectColor = "#4CAF50"; // Défaut: vert
      }

      // Si nous sommes à l'état initial et que nous zoomons, nous éclatons toutes les régions
      if (this.selectedRegionIndex === -1 && this.zoomDirection === 'in') {
        // Si le zoom entre au niveau 1 depuis le niveau 0, éclater toutes les régions
        if (oldZoomLevel === 0 && newZoomLevel === 1) {
          // Créer un effet d'explosion au centre de la carte
          const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
          const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
          this.createExplosionEffect(centerLat, centerLon, "#4CAF50", 100000, () => {
            // Après l'effet, afficher tous les cercles de toutes les régions
            this.clearAllMarkers();
            this.maliRegionData.forEach(region => {
              region.children.forEach((cercle, cercleIndex) => {
                const marker = this.createMarker(
                  [cercle.lat, cercle.lon],
                  cercle.weight,
                  cercle.color,
                  cercle.name,
                  () => {
                    // Trouver l'index de la région parente
                    const regionIndex = this.maliRegionData.findIndex(r =>
                      r.children.some(c => c.lat === cercle.lat && c.lon === cercle.lon)
                    );
                    if (regionIndex !== -1) {
                      // Trouver l'index du cercle dans la région
                      const cIndex = this.maliRegionData[regionIndex].children.findIndex(
                        c => c.lat === cercle.lat && c.lon === cercle.lon
                      );
                      this.handleCercleMarkerClick(regionIndex, cIndex);
                    }
                  }
                );
                this.cercleMarkers.push(marker);
              });
            });
          });
          return;
        }

        // Pour les autres transitions de zoom sans région sélectionnée
        this.handleGeneralZoom(effectColor);
        return;
      }

      // Si une région est sélectionnée, gérer le zoom spécifique
      if (this.selectedRegionIndex !== -1) {
        const region = this.maliRegionData[this.selectedRegionIndex];

        if (this.zoomDirection === 'in') {
          switch (oldZoomLevel) {
            case 0: // Région -> Cercles
              this.createExplosionEffect(region.lat, region.lon, "#4CAF50", 50000, () => {
                this.clearAllMarkers();
                // Afficher les cercles de la région
                region.children.forEach((cercle, cercleIndex) => {
                  const marker = this.createMarker(
                    [cercle.lat, cercle.lon],
                    cercle.weight,
                    cercle.color,
                    cercle.name,
                    () => this.handleCercleMarkerClick(this.selectedRegionIndex, cercleIndex)
                  );
                  this.cercleMarkers.push(marker);
                });

                // Utiliser la position de la région pour l'effet, pas le centre de la carte
                if (isCentralPosition(region.lat, region.lon)) {
                  // Si la région est au centre, utiliser un effet transparent
                  this.removePulseEffect();
                  this.pulseEffectCircle = L.circle([region.lat, region.lon], {
                    radius: 20000,
                    color: 'transparent',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    className: 'pulse-effect',
                    weight: 0,
                    interactive: false
                  }).addTo(this.map);
                } else {
                  this.addPulseEffect(region.lat, region.lon, "#FFC107", 20000);
                }
              });
              break;

            case 1: // Cercles -> Communes
              if (this.selectedCercleIndex !== -1) {
                const cercle = region.children[this.selectedCercleIndex];
                this.createExplosionEffect(cercle.lat, cercle.lon, "#FFC107", 20000, () => {
                  this.clearCercleAndLowerMarkers();
                  // Afficher les communes du cercle
                  cercle.children.forEach((commune, communeIndex) => {
                    const marker = this.createMarker(
                      [commune.lat, commune.lon],
                      commune.weight,
                      commune.color,
                      commune.name,
                      () => this.handleCommuneMarkerClick(this.selectedRegionIndex, this.selectedCercleIndex, communeIndex)
                    );
                    this.communeMarkers.push(marker);
                  });

                  // Vérifier si c'est une position centrale
                  if (isCentralPosition(cercle.lat, cercle.lon)) {
                    // Si c'est au centre, utiliser un effet transparent
                    this.removePulseEffect();
                    this.pulseEffectCircle = L.circle([cercle.lat, cercle.lon], {
                      radius: 10000,
                      color: 'transparent',
                      fillColor: 'transparent',
                      fillOpacity: 0,
                      className: 'pulse-effect',
                      weight:
                        0,
                      interactive: false
                    }).addTo(this.map);
                  } else {
                    this.addPulseEffect(cercle.lat, cercle.lon, "#F44336", 10000);
                  }
                });
              } else {
                // Afficher toutes les communes de la région
                this.clearCercleAndLowerMarkers();
                region.children.forEach((cercle, cercleIndex) => {
                  cercle.children.forEach((commune, communeIndex) => {
                    const marker = this.createMarker(
                      [commune.lat, commune.lon],
                      commune.weight,
                      commune.color,
                      commune.name,
                      () => this.handleCommuneMarkerClick(this.selectedRegionIndex, cercleIndex, communeIndex)
                    );
                    this.communeMarkers.push(marker);
                  });
                });
              }
              break;

            case 2: // Communes -> Centres
              if (this.selectedCercleIndex !== -1 && this.selectedCommuneIndex !== -1) {
                const commune = region.children[this.selectedCercleIndex].children[this.selectedCommuneIndex];
                this.createExplosionEffect(commune.lat, commune.lon, "#F44336", 5000, () => {
                  this.clearCommuneAndLowerMarkers();
                  // Afficher les centres de la commune
                  commune.children.forEach((center) => {
                    const marker = this.createMarker(
                      [center.lat, center.lon],
                      center.weight,
                      center.color,
                      center.name,
                      () => this.handleCivilStatusCenterClick(center)
                    );
                    this.civilStatusMarkers.push(marker);
                  });

                  // Vérifier si c'est une position centrale
                  if (isCentralPosition(commune.lat, commune.lon)) {
                    // Si c'est au centre, utiliser un effet transparent
                    this.removePulseEffect();
                    this.pulseEffectCircle = L.circle([commune.lat, commune.lon], {
                      radius: 2000,
                      color: 'transparent',
                      fillColor: 'transparent',
                      fillOpacity: 0,
                      className: 'pulse-effect',
                      weight: 0,
                      interactive: false
                    }).addTo(this.map);
                  } else {
                    this.addPulseEffect(commune.lat, commune.lon, "#2196F3", 2000);
                  }
                });
              } else {
                // Afficher tous les centres d'état civil
                this.clearCommuneAndLowerMarkers();
                region.children.forEach((cercle) => {
                  cercle.children.forEach((commune) => {
                    commune.children.forEach((center) => {
                      const marker = this.createMarker(
                        [center.lat, center.lon],
                        center.weight,
                        center.color,
                        center.name,
                        () => this.handleCivilStatusCenterClick(center)
                      );
                      this.civilStatusMarkers.push(marker);
                    });
                  });
                });
              }
              break;
          }
        } else if (this.zoomDirection === 'out') {
          // Logique pour le dézoom
          switch (newZoomLevel) {
            case 0: // Revenir aux régions
              this.clearAllMarkers();
              // Afficher toutes les régions
              this.maliRegionData.forEach((region, index) => {
                const marker = this.createMarker(
                  [region.lat, region.lon],
                  region.weight,
                  region.color,
                  region.name,
                  () => this.handleRegionMarkerClick(index)
                );
                this.regionMarkers.push(marker);
              });

              // Utiliser un effet transparent pour le centre de la carte
              const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
              const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
              this.removePulseEffect();
              this.pulseEffectCircle = L.circle([centerLat, centerLon], {
                radius: 50000,
                color: 'transparent',
                fillColor: 'transparent',
                fillOpacity: 0,
                className: 'pulse-effect',
                weight: 0,
                interactive: false
              }).addTo(this.map);
              break;

            case 1: // Revenir aux cercles
              this.clearAllMarkers();
              // Afficher les cercles de la région sélectionnée
              region.children.forEach((cercle, cercleIndex) => {
                const marker = this.createMarker(
                  [cercle.lat, cercle.lon],
                  cercle.weight,
                  cercle.color,
                  cercle.name,
                  () => this.handleCercleMarkerClick(this.selectedRegionIndex, cercleIndex)
                );
                this.cercleMarkers.push(marker);
              });

              // Vérifier si c'est une position centrale
              if (isCentralPosition(region.lat, region.lon)) {
                // Si c'est au centre, utiliser un effet transparent
                this.removePulseEffect();
                this.pulseEffectCircle = L.circle([region.lat, region.lon], {
                  radius: 20000,
                  color: 'transparent',
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  className: 'pulse-effect',
                  weight: 0,
                  interactive: false
                }).addTo(this.map);
              } else {
                this.addPulseEffect(region.lat, region.lon, "#FFC107", 20000);
              }
              break;

            case 2: // Revenir aux communes
              this.clearCercleAndLowerMarkers();
              if (this.selectedCercleIndex !== -1) {
                // Afficher les communes du cercle sélectionné
                const cercle = region.children[this.selectedCercleIndex];
                cercle.children.forEach((commune, communeIndex) => {
                  const marker = this.createMarker(
                    [commune.lat, commune.lon],
                    commune.weight,
                    commune.color,
                    commune.name,
                    () => this.handleCommuneMarkerClick(this.selectedRegionIndex, this.selectedCercleIndex, communeIndex)
                  );
                  this.communeMarkers.push(marker);
                });

                // Vérifier si c'est une position centrale
                if (isCentralPosition(cercle.lat, cercle.lon)) {
                  // Si c'est au centre, utiliser un effet transparent
                  this.removePulseEffect();
                  this.pulseEffectCircle = L.circle([cercle.lat, cercle.lon], {
                    radius: 10000,
                    color: 'transparent',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    className: 'pulse-effect',
                    weight: 0,
                    interactive: false
                  }).addTo(this.map);
                } else {
                  this.addPulseEffect(cercle.lat, cercle.lon, "#F44336", 10000);
                }
              } else {
                // Afficher toutes les communes de la région
                region.children.forEach((cercle, cercleIndex) => {
                  cercle.children.forEach((commune, communeIndex) => {
                    const marker = this.createMarker(
                      [commune.lat, commune.lon],
                      commune.weight,
                      commune.color,
                      commune.name,
                      () => this.handleCommuneMarkerClick(this.selectedRegionIndex, cercleIndex, communeIndex)
                    );
                    this.communeMarkers.push(marker);
                  });
                });
              }
              break;
          }
        }
      } else {
        // Si aucune région n'est sélectionnée mais qu'on n'est pas au niveau 0
        this.handleGeneralZoom(effectColor);
      }
    }
  }

  private handleGeneralZoom(effectColor: string): void {
    // Gestion générique du zoom quand aucune région spécifique n'est sélectionnée
    // ou pour les niveaux autres que l'éclatement de régions en cercles

    // Effacer les marqueurs selon le niveau actuel
    if (this.currentZoomLevel === 0) {
      // Effacer tout et montrer les régions
      this.clearAllMarkers();
      this.maliRegionData.forEach((region, index) => {
        const marker = this.createMarker(
          [region.lat, region.lon],
          region.weight,
          region.color,
          region.name,
          () => this.handleRegionMarkerClick(index)
        );
        this.regionMarkers.push(marker);
      });
    } else if (this.currentZoomLevel === 1) {
      // Effacer tout et montrer tous les cercles
      this.clearAllMarkers();
      this.maliRegionData.forEach(region => {
        region.children.forEach((cercle, cercleIndex) => {
          const marker = this.createMarker(
            [cercle.lat, cercle.lon],
            cercle.weight,
            cercle.color,
            cercle.name,
            () => {
              // Trouver l'index de la région parente
              const regionIndex = this.maliRegionData.findIndex(r =>
                r.children.some(c => c.lat === cercle.lat && c.lon === cercle.lon)
              );
              if (regionIndex !== -1) {
                // Trouver l'index du cercle dans la région
                const cIndex = this.maliRegionData[regionIndex].children.findIndex(
                  c => c.lat === cercle.lat && c.lon === cercle.lon
                );
                this.handleCercleMarkerClick(regionIndex, cIndex);
              }
            }
          );
          this.cercleMarkers.push(marker);
        });
      });
    } else if (this.currentZoomLevel === 2) {
      // Montrer toutes les communes
      this.clearCercleAndLowerMarkers();
      this.maliRegionData.forEach((region, regionIndex) => {
        region.children.forEach((cercle, cercleIndex) => {
          cercle.children.forEach((commune, communeIndex) => {
            const marker = this.createMarker(
              [commune.lat, commune.lon],
              commune.weight,
              commune.color,
              commune.name,
              () => this.handleCommuneMarkerClick(regionIndex, cercleIndex, communeIndex)
            );
            this.communeMarkers.push(marker);
          });
        });
      });
    } else if (this.currentZoomLevel === 3) {
      // Montrer tous les centres
      this.clearCommuneAndLowerMarkers();
      this.maliRegionData.forEach(region => {
        region.children.forEach(cercle => {
          cercle.children.forEach(commune => {
            commune.children.forEach(center => {
              const marker = this.createMarker(
                [center.lat, center.lon],
                center.weight,
                center.color,
                center.name,
                () => this.handleCivilStatusCenterClick(center)
              );
              this.civilStatusMarkers.push(marker);
            });
          });
        });
      });
    }

    // Ajouter un effet de pulsation global pour le niveau actuel
    const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
    const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
    let radius = 50000;
    switch (this.currentZoomLevel) {
      case 1: radius = 30000; break;
      case 2: radius = 15000; break;
      case 3: radius = 5000; break;
    }

    // Créer un effet transparent plutôt que coloré
    if (this.pulseEffectCircle) {
      this.map.removeLayer(this.pulseEffectCircle);
    }

    this.pulseEffectCircle = L.circle([centerLat, centerLon], {
      radius: radius,
      color: 'transparent',
      fillColor: 'transparent',
      fillOpacity: 0,
      weight: 0,
      interactive: false,
      className: 'pulse-effect'
    }).addTo(this.map);
  }

  // COMPOSANTE CLIQUE: Gestion des clics sur les marqueurs de la carte
  private handleRegionMarkerClick(regionIndex: number): void {
    console.log('Region marker clicked:', regionIndex);

    // Vérifier si nous sommes en train de changer de région
    const changingRegion = this.selectedRegionIndex !== -1 && this.selectedRegionIndex !== regionIndex;
    if (changingRegion) {
      // Si on clique sur une autre région pendant un schéma en cours, réinitialiser le schéma précédent
      this.clearRoute();
    }

    // Sélectionner la région cliquée
    this.selectedRegionIndex = regionIndex;
    this.selectedCercleIndex = -1;
    this.selectedCommuneIndex = -1;

    // Centrer la carte sur la région sélectionnée
    const region = this.maliRegionData[regionIndex];
    this.map.setView([region.lat, region.lon], 6.5);

    // Créer un effet d'explosion avant d'éclater en cercles
    this.createExplosionEffect(region.lat, region.lon, "#4CAF50", 50000, () => {
      // Éclatement immédiat en cercles après l'effet d'explosion
      this.clearAllMarkers();

      // Afficher directement les cercles de la région sélectionnée
      region.children.forEach((cercle, cercleIndex) => {
        const marker = this.createMarker(
          [cercle.lat, cercle.lon],
          cercle.weight,
          cercle.color,
          cercle.name,
          () => this.handleCercleMarkerClick(this.selectedRegionIndex, cercleIndex)
        );
        this.cercleMarkers.push(marker);
      });

      // Ajouter effet de pulsation pour le niveau cercle
      this.addPulseEffect(region.lat, region.lon, "#FFC107", 10000);

      // Mettre à jour les filtres pour refléter la sélection
      this.updateFilterOptions();
    });
  }

  private handleCercleMarkerClick(regionIndex: number, cercleIndex: number): void {
    // S'assurer que nous travaillons avec la bonne région
    this.selectedRegionIndex = regionIndex;
    this.selectedCercleIndex = cercleIndex;
    this.selectedCommuneIndex = -1;

    // Centrer la carte sur le cercle sélectionné
    const cercle = this.maliRegionData[regionIndex].children[cercleIndex];
    this.map.setView([cercle.lat, cercle.lon], 7);

    // Créer un effet d'explosion avant d'éclater en communes
    this.createExplosionEffect(cercle.lat, cercle.lon, "#FFC107", 20000, () => {
      // Éclatement immédiat en communes après l'effet d'explosion
      this.clearCercleAndLowerMarkers();

      // Afficher les communes du cercle sélectionné
      cercle.children.forEach((commune, communeIndex) => {
        const marker = this.createMarker(
          [commune.lat, commune.lon],
          commune.weight,
          commune.color,
          commune.name,
          () => this.handleCommuneMarkerClick(this.selectedRegionIndex, this.selectedCercleIndex, communeIndex)
        );
        this.communeMarkers.push(marker);
      });

      // Ajouter un effet de pulsation pour le niveau commune
      this.addPulseEffect(cercle.lat, cercle.lon, "#F44336", 5000);

      // Mettre à jour les filtres pour refléter la sélection
      this.updateFilterOptions();
    });
  }

  private handleCommuneMarkerClick(regionIndex: number, cercleIndex: number, communeIndex: number): void {
    // S'assurer que nous travaillons avec la bonne région et le bon cercle
    this.selectedRegionIndex = regionIndex;
    this.selectedCercleIndex = cercleIndex;
    this.selectedCommuneIndex = communeIndex;

    // Centrer la carte sur la commune sélectionnée
    const commune = this.maliRegionData[regionIndex].children[cercleIndex].children[communeIndex];
    this.map.setView([commune.lat, commune.lon], 7.5);

    // Créer un effet d'explosion avant d'éclater en centres d'état civil
    this.createExplosionEffect(commune.lat, commune.lon, "#F44336", 5000, () => {
      // Éclatement immédiat en centres d'état civil après l'effet d'explosion
      this.clearCommuneAndLowerMarkers();

      // Afficher les centres d'état civil de la commune sélectionnée
      commune.children.forEach((center) => {
        const marker = this.createMarker(
          [center.lat, center.lon],
          center.weight,
          center.color,
          center.name,
          () => this.handleCivilStatusCenterClick(center)
        );
        this.civilStatusMarkers.push(marker);
      });

      // Ajouter effet visuel oscillant bleu autour de la commune
      this.addPulseEffect(commune.lat, commune.lon, "#2196F3", 2000);

      // Mettre à jour les filtres pour refléter la sélection
      this.updateFilterOptions();
    });
  }

  private handleCivilStatusCenterClick(center: CivilStatusCenterData): void {
    // Si la position de l'utilisateur n'est pas disponible, afficher une alerte
    if (!this.userLatLng) {
      alert('Veuillez activer votre position pour calculer l\'itinéraire');
      return;
    }

    // Tracer immédiatement l'itinéraire entre l'utilisateur et le centre
    this.createRoute(center.lat, center.lon, center.name);
  }

  // COMPOSANTE PANNEAU DE FILTRAGE: Gestion des sélections dans le panneau
  public onRegionFilterChange(): void {
    if (this.selectedRegionFilter === '') {
      // Réinitialiser les filtres et la carte
      this.resetFilters();
      return;
    }

    // Convertir la chaîne en nombre
    const regionIndex = parseInt(this.selectedRegionFilter);
    this.selectedRegionIndex = regionIndex;
    this.selectedCercleIndex = -1;
    this.selectedCommuneIndex = -1;

    // Mettre à jour les options disponibles pour les niveaux inférieurs
    this.availableCercles = [...this.maliRegionData[regionIndex].children];
    this.availableCommunes = [];
    this.availableCenters = [];

    // Réinitialiser les filtres inférieurs
    this.selectedCercleFilter = '';
    this.selectedCommuneFilter = '';
    this.selectedCenterFilter = '';

    // Supprimer l'effet de pulsation et l'explosion précédents
    this.removePulseEffect();
    this.removeExplosionEffect();

    // Effacer tous les marqueurs existants
    this.clearAllMarkers();

    // Afficher uniquement le marqueur de la région sélectionnée (sans l'éclater)
    const region = this.maliRegionData[regionIndex];
    const marker = this.createMarker(
      [region.lat, region.lon],
      region.weight,
      region.color,
      region.name,
      () => this.handleRegionMarkerClick(regionIndex)
    );
    this.regionMarkers.push(marker);

    // Centrer la carte sur la région sélectionnée
    this.map.setView([region.lat, region.lon], 6);

    // Ajouter effet de pulsation pour la région
    this.addPulseEffect(region.lat, region.lon, "#4CAF50", 10000);
  }

  public onCercleFilterChange(): void {
    if (this.selectedCercleFilter === '' || this.selectedRegionIndex === -1) {
      // Revenir à l'affichage de la région uniquement
      if (this.selectedRegionIndex !== -1) {
        this.onRegionFilterChange();
      } else {
        this.resetFilters();
      }
      return;
    }

    // Convertir la chaîne en nombre
    const cercleIndex = parseInt(this.selectedCercleFilter);
    this.selectedCercleIndex = cercleIndex;
    this.selectedCommuneIndex = -1;

    // Mettre à jour les options disponibles pour les communes
    this.availableCommunes = [...this.maliRegionData[this.selectedRegionIndex].children[cercleIndex].children];
    this.availableCenters = [];

    // Réinitialiser les filtres inférieurs
    this.selectedCommuneFilter = '';
    this.selectedCenterFilter = '';

    // Supprimer l'effet de pulsation et l'explosion précédents
    this.removePulseEffect();
    this.removeExplosionEffect();

    // Effacer tous les marqueurs existants
    this.clearAllMarkers();

    // Afficher uniquement le marqueur du cercle sélectionné (sans l'éclater)
    const cercle = this.maliRegionData[this.selectedRegionIndex].children[cercleIndex];
    const marker = this.createMarker(
      [cercle.lat, cercle.lon],
      cercle.weight,
      cercle.color,
      cercle.name,
      () => this.handleCercleMarkerClick(this.selectedRegionIndex, cercleIndex)
    );
    this.cercleMarkers.push(marker);

    // Centrer la carte sur le cercle
    this.map.setView([cercle.lat, cercle.lon], 6.5);

    // Ajouter effet de pulsation pour le cercle
    this.addPulseEffect(cercle.lat, cercle.lon, "#FFC107", 5000);
  }

  public onCommuneFilterChange(): void {
    if (this.selectedCommuneFilter === '' || this.selectedCercleIndex === -1) {
      // Revenir à l'affichage du cercle uniquement
      if (this.selectedCercleIndex !== -1) {
        this.onCercleFilterChange();
      } else if (this.selectedRegionIndex !== -1) {
        this.onRegionFilterChange();
      } else {
        this.resetFilters();
      }
      return;
    }

    // Convertir la chaîne en nombre
    const communeIndex = parseInt(this.selectedCommuneFilter);
    this.selectedCommuneIndex = communeIndex;

    // Mettre à jour les options disponibles pour les centres
    this.availableCenters = [...this.maliRegionData[this.selectedRegionIndex]
      .children[this.selectedCercleIndex]
      .children[communeIndex].children];

    // Réinitialiser le filtre des centres
    this.selectedCenterFilter = '';

    // Supprimer l'effet de pulsation et l'explosion précédents
    this.removePulseEffect();
    this.removeExplosionEffect();

    // Effacer tous les marqueurs existants
    this.clearAllMarkers();

    // Afficher uniquement le marqueur de la commune sélectionnée (sans l'éclater)
    const commune = this.maliRegionData[this.selectedRegionIndex]
      .children[this.selectedCercleIndex]
      .children[communeIndex];

    const marker = this.createMarker(
      [commune.lat, commune.lon],
      commune.weight,
      commune.color,
      commune.name,
      () => this.handleCommuneMarkerClick(this.selectedRegionIndex, this.selectedCercleIndex, communeIndex)
    );
    this.communeMarkers.push(marker);

    // Centrer la carte sur la commune
    this.map.setView([commune.lat, commune.lon], 7);

    // Ajouter effet de pulsation pour la commune
    this.addPulseEffect(commune.lat, commune.lon, "#F44336", 3000);
  }

  public onCenterFilterChange(): void {
    if (this.selectedCenterFilter === '' || this.selectedCommuneIndex === -1) {
      // Revenir à l'affichage de la commune uniquement
      if (this.selectedCommuneIndex !== -1) {
        this.onCommuneFilterChange();
      } else if (this.selectedCercleIndex !== -1) {
        this.onCercleFilterChange();
      } else if (this.selectedRegionIndex !== -1) {
        this.onRegionFilterChange();
      } else {
        this.resetFilters();
      }
      return;
    }

    // Convertir la chaîne en nombre
    const centerIndex = parseInt(this.selectedCenterFilter);

    // Récupérer le centre d'état civil sélectionné
    const center = this.maliRegionData[this.selectedRegionIndex]
      .children[this.selectedCercleIndex]
      .children[this.selectedCommuneIndex]
      .children[centerIndex];

    // Supprimer l'effet de pulsation et l'explosion précédents
    this.removePulseEffect();
    this.removeExplosionEffect();

    // Effacer tous les marqueurs existants
    this.clearAllMarkers();

    // Afficher uniquement le marqueur du centre sélectionné
    const marker = this.createMarker(
      [center.lat, center.lon],
      center.weight,
      center.color,
      center.name,
      () => this.handleCivilStatusCenterClick(center)
    );
    this.civilStatusMarkers.push(marker);

    // Centrer la carte sur le centre d'état civil
    this.map.setView([center.lat, center.lon], 8);

    // Ajouter effet de pulsation pour le centre
    this.addPulseEffect(center.lat, center.lon, "#2196F3", 1000);

    // Tracer automatiquement l'itinéraire vers ce centre
    this.handleCivilStatusCenterClick(center);
  }

  // Méthodes pour la recherche par texte
  public filterRegionsByInput(): void {
    if (this.regionSearchInput.trim() === '') {
      // Réinitialiser la liste complète
      this.availableRegions = [...this.maliRegionData];
      return;
    }

    const searchText = this.regionSearchInput.toLowerCase();
    this.availableRegions = this.maliRegionData.filter(
      region => region.name.toLowerCase().includes(searchText)
    );
  }

  public filterCerclesByInput(): void {
    if (this.selectedRegionIndex === -1) return;

    if (this.cercleSearchInput.trim() === '') {
      // Réinitialiser la liste complète
      this.availableCercles = [...this.maliRegionData[this.selectedRegionIndex].children];
      return;
    }

    const searchText = this.cercleSearchInput.toLowerCase();
    this.availableCercles = this.maliRegionData[this.selectedRegionIndex].children.filter(
      cercle => cercle.name.toLowerCase().includes(searchText)
    );
  }

  public filterCommunesByInput(): void {
    if (this.selectedRegionIndex === -1 || this.selectedCercleIndex === -1) return;

    if (this.communeSearchInput.trim() === '') {
      // Réinitialiser la liste complète
      this.availableCommunes = [...this.maliRegionData[this.selectedRegionIndex].children[this.selectedCercleIndex].children];
      return;
    }

    const searchText = this.communeSearchInput.toLowerCase();
    this.availableCommunes = this.maliRegionData[this.selectedRegionIndex].children[this.selectedCercleIndex].children.filter(
      commune => commune.name.toLowerCase().includes(searchText)
    );
  }

  public filterCentersByInput(): void {
    if (this.selectedRegionIndex === -1 || this.selectedCercleIndex === -1 || this.selectedCommuneIndex === -1) return;

    if (this.centerSearchInput.trim() === '') {
      // Réinitialiser la liste complète
      this.availableCenters = [...this.maliRegionData[this.selectedRegionIndex]
        .children[this.selectedCercleIndex]
        .children[this.selectedCommuneIndex].children];
      return;
    }

    const searchText = this.centerSearchInput.toLowerCase();
    this.availableCenters = this.maliRegionData[this.selectedRegionIndex]
      .children[this.selectedCercleIndex]
      .children[this.selectedCommuneIndex].children.filter(
        center => center.name.toLowerCase().includes(searchText)
      );
  }

  // Méthodes pour les effets visuels
  private addPulseEffect(lat: number, lon: number, color: string = "#2196F3", radius: number = 5000): void {
    // Supprimer l'effet existant s'il y en a un
    this.removePulseEffect();

    // Déterminer si c'est un effet pour la position centrale de la carte
    const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
    const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
    const isCentralPosition = Math.abs(lat - centerLat) < 0.5 && Math.abs(lon - centerLon) < 0.5;

    // Créer un nouvel effet de pulsation - transparent si c'est au centre
    this.pulseEffectCircle = L.circle([lat, lon], {
      radius: radius,
      color: isCentralPosition ? 'transparent' : color,
      fillColor: isCentralPosition ? 'transparent' : color,
      fillOpacity: isCentralPosition ? 0 : 0.2,
      className: 'pulse-effect',
      weight: isCentralPosition ? 0 : 2,
      interactive: !isCentralPosition  // Non interactif si c'est au centre
    }).addTo(this.map);
  }

  private removePulseEffect(): void {
    if (this.pulseEffectCircle) {
      this.map.removeLayer(this.pulseEffectCircle);
      this.pulseEffectCircle = null;
    }
  }

  private createExplosionEffect(lat: number, lon: number, color: string, radius: number, callback: () => void): void {
    // Supprimer l'effet existant s'il y en a un
    this.removeExplosionEffect();

    // Déterminer si c'est un effet pour la position centrale de la carte
    const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
    const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
    const isCentralPosition = Math.abs(lat - centerLat) < 0.5 && Math.abs(lon - centerLon) < 0.5;

    // Créer l'effet d'explosion - transparent si c'est au centre
    this.explosionEffectCircle = L.circle([lat, lon], {
      radius: 1000,
      color: isCentralPosition ? 'transparent' : color,
      fillColor: isCentralPosition ? 'transparent' : color,
      fillOpacity: isCentralPosition ? 0 : 0.5,
      className: 'explosion-effect',
      weight: isCentralPosition ? 0 : 3,
      interactive: !isCentralPosition  // Non interactif si c'est au centre
    }).addTo(this.map);


    // Animation d'expansion et de disparition
    let currentSize = 1000;
    let opacity = isCentralPosition ? 0 : 0.5;
    const growRate = (radius - 1000) / 15;

    const animationInterval = setInterval(() => {
      currentSize += growRate;
      if (!isCentralPosition) opacity -= 0.03;

      if (opacity <= 0 || currentSize >= radius) {
        clearInterval(animationInterval);
        this.removeExplosionEffect();
        callback();
        return;
      }

      if (this.explosionEffectCircle) {
        this.map.removeLayer(this.explosionEffectCircle);
      }

      this.explosionEffectCircle = L.circle([lat, lon], {
        radius: currentSize,
        color: isCentralPosition ? 'transparent' : color,
        fillColor: isCentralPosition ? 'transparent' : color,
        fillOpacity: opacity,
        className: 'explosion-effect',
        weight: isCentralPosition ? 0 : (3 * opacity),
        interactive: !isCentralPosition
      }).addTo(this.map);

    }, 40);
  }

  private removeExplosionEffect(): void {
    if (this.explosionEffectCircle) {
      this.map.removeLayer(this.explosionEffectCircle);
      this.explosionEffectCircle = null;
    }
  }

  // Mise à jour des options disponibles dans les filtres
  private updateFilterOptions(): void {
    // Mettre à jour les valeurs des filtres pour correspondre à la sélection actuelle
    this.selectedRegionFilter = this.selectedRegionIndex !== -1 ? this.selectedRegionIndex.toString() : '';
    this.selectedCercleFilter = this.selectedCercleIndex !== -1 ? this.selectedCercleIndex.toString() : '';
    this.selectedCommuneFilter = this.selectedCommuneIndex !== -1 ? this.selectedCommuneIndex.toString() : '';

    // Mettre à jour les options disponibles dans les listes déroulantes
    if (this.selectedRegionIndex !== -1) {
      this.availableCercles = [...this.maliRegionData[this.selectedRegionIndex].children];

      if (this.selectedCercleIndex !== -1) {
        this.availableCommunes = [...this.maliRegionData[this.selectedRegionIndex]
          .children[this.selectedCercleIndex].children];

        if (this.selectedCommuneIndex !== -1) {
          this.availableCenters = [...this.maliRegionData[this.selectedRegionIndex]
            .children[this.selectedCercleIndex]
            .children[this.selectedCommuneIndex].children];
        } else {
          this.availableCenters = [];
        }
      } else {
        this.availableCommunes = [];
        this.availableCenters = [];
      }
    } else {
      this.availableCercles = [];
      this.availableCommunes = [];
      this.availableCenters = [];
    }
  }

  // Méthodes utilitaires
  public resetFilters(): void {
    // Réinitialiser tous les filtres
    this.selectedRegionFilter = '';
    this.selectedCercleFilter = '';
    this.selectedCommuneFilter = '';
    this.selectedCenterFilter = '';

    this.regionSearchInput = '';
    this.cercleSearchInput = '';
    this.communeSearchInput = '';
    this.centerSearchInput = '';

    // Réinitialiser les indices sélectionnés
    this.selectedRegionIndex = -1;
    this.selectedCercleIndex = -1;
    this.selectedCommuneIndex = -1;

    // Réinitialiser les listes disponibles
    this.availableRegions = [...this.maliRegionData];
    this.availableCercles = [];
    this.availableCommunes = [];
    this.availableCenters = [];

    // Réinitialiser la carte
    this.clearAllMarkers();
    this.initializeRegionMarkers();

    // Supprimer les effets visuels
    this.removePulseEffect();
    this.removeExplosionEffect();

    // Centrer la carte sur le Mali
    const centerLat = (this.maliRegionData[0].lat + this.maliRegionData[1].lat) / 2;
    const centerLon = (this.maliRegionData[0].lon + this.maliRegionData[1].lon) / 2;
    this.map.setView([centerLat, centerLon], 6);

    // Supprimer l'itinéraire s'il existe
    this.clearRoute();

    // Réinitialiser le niveau de zoom
    this.currentZoomLevel = 0;
  }

  public resetMap(): void {
    // Réinitialiser les filtres et la carte
    this.resetFilters();

    // Réinitialiser la position de l'utilisateur
    this.refreshUserLocation();
  }

  private createRoute(lat: number, lon: number, placeName: string): void {
    // Supprimer l'itinéraire existant s'il y en a un
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

    // Créer un nouveau contrôle d'itinéraire
    const routingOptions: any = {
      waypoints: [
        this.userLatLng,
        L.latLng(lat, lon)
      ],
      routeWhileDragging: false,
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

  private clearAllMarkers(): void {
    // Effacer les marqueurs de région
    this.regionMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.regionMarkers = [];

    // Effacer tous les autres marqueurs
    this.clearCercleAndLowerMarkers();
  }

  private clearCercleAndLowerMarkers(): void {
    // Effacer les marqueurs de cercle
    this.cercleMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.cercleMarkers = [];

    // Effacer les marqueurs de commune et inférieurs
    this.clearCommuneAndLowerMarkers();
  }

  private clearCommuneAndLowerMarkers(): void {
    // Effacer les marqueurs de commune
    this.communeMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.communeMarkers = [];

    // Effacer les marqueurs de centre d'état civil
    this.civilStatusMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.civilStatusMarkers = [];
  }

  public clearRoute(): void {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
  }

  // Gestion de la position de l'utilisateur
  private getUserLocation(): void {
    this.geolocationService.getCurrentPosition().subscribe({
      next: (position) => {
        this.updateUserLocationOnMap(position);
      },
      error: (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert(`Erreur de géolocalisation: ${error}`);
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
    this.trackingEnabled = !this.trackingEnabled;

    if (this.trackingEnabled) {
      // Démarrer le suivi
      this.geolocationService.startLocationTracking().subscribe({
        next: (position) => {
          this.updateUserLocationOnMap(position);
        },
        error: (error) => {
          console.error('Erreur de suivi de position:', error);
          this.trackingEnabled = false;
          alert(`Erreur de suivi de position: ${error}`);
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
}