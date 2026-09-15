import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { KanjiItem } from './models';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  loadKanji(): Promise<KanjiItem[]> {
    return firstValueFrom(this.http.get<KanjiItem[]>('assets/data/kanji.json'));
  }
}
