// geolocation.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subscriber, throwError } from 'rxjs';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private watchId: number | null = null;
  private positionObserver: Subscriber<GeolocationPosition> | null = null;

  constructor() { }

  public isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  public getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable<GeolocationPosition>(observer => {
      if (!this.isGeolocationAvailable()) {
        observer.error('La géolocalisation n\'est pas prise en charge par votre navigateur');
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
          observer.complete();
        },
        (error) => {
          observer.error(this.getPositionErrorMessage(error));
        },
        options
      );
    });
  }

  public startLocationTracking(): Observable<GeolocationPosition> {
    // Arrêter le suivi existant s'il y en a un
    this.stopLocationTracking();

    return new Observable<GeolocationPosition>(observer => {
      if (!this.isGeolocationAvailable()) {
        observer.error('La géolocalisation n\'est pas prise en charge par votre navigateur');
        return;
      }

      this.positionObserver = observer;

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          observer.error(this.getPositionErrorMessage(error));
        },
        options
      );

      // Fonction de nettoyage
      return () => {
        this.stopLocationTracking();
      };
    });
  }

  public stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.positionObserver) {
      this.positionObserver.complete();
      this.positionObserver = null;
    }
  }

  public isTracking(): boolean {
    return this.watchId !== null;
  }

  private getPositionErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'L\'utilisateur a refusé la demande de géolocalisation';
      case error.POSITION_UNAVAILABLE:
        return 'Les informations de localisation sont indisponibles';
      case error.TIMEOUT:
        return 'La demande de géolocalisation a expiré';
      default:
        return 'Une erreur inconnue est survenue';
    }
  }
}