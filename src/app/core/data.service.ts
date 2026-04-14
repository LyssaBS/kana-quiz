import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabItem, KanaItem, VerbItem, AdjectiveItem, KanjiItem } from './models';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  loadVocab(): Promise<VocabItem[]> {
    return firstValueFrom(this.http.get<VocabItem[]>('assets/data/vocab.json'));
  }

  loadKana(): Promise<KanaItem[]> {
    return firstValueFrom(this.http.get<KanaItem[]>('assets/data/kana.json'));
  }

  loadVerbs(): Promise<VerbItem[]> {
    return firstValueFrom(this.http.get<VerbItem[]>('assets/data/verbs.json'));
  }

  loadAdjectives(): Promise<AdjectiveItem[]> {
    return firstValueFrom(this.http.get<AdjectiveItem[]>('assets/data/adjectives.json'));
  }

  loadKanji(): Promise<KanjiItem[]> {
    return firstValueFrom(this.http.get<KanjiItem[]>('assets/data/kanji.json'));
  }
}
