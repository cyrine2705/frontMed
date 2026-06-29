import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api.token';
import { ChatRequest, ChatResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(API_URL);

  send(body: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.api}/v1/chat`, body);
  }
}
