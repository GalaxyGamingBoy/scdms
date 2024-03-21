import { Injectable, inject } from '@angular/core';
import { Token } from './token';
import { ApiService } from './api.service';
import { ApiDiscordClientId } from './api';
import { v4 } from 'uuid';
import { lastValueFrom } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  protected token?: Token;
  protected state?: string;
  protected redirect!: string;
  protected clientid!: string;

  private apiService: ApiService = inject(ApiService);
  private cookieService: CookieService = inject(CookieService);
  constructor() {
    this.apiService
      .getDiscordClientId()
      .subscribe((v: ApiDiscordClientId) => (this.clientid = v.clientid));
    this.redirect = encodeURIComponent(
      `${window.location.protocol}//${window.location.host}/auth/login/finalize`
    );
  }

  getToken(): Token | undefined {
    return this.token;
  }

  hasToken(): boolean {
    return this.token !== undefined;
  }

  setState(state: string) {
    this.state = state;
  }

  discordRedirectURL(): string {
    return `https://discord.com/oauth2/authorize?response_type=code&client_id=${this.clientid}&scope=identify%20guilds&state=${this.state}&redirect_uri=${this.redirect}&prompt=consent`;
  }

  async discordFinalize(code: string): Promise<void> {
    const user = await lastValueFrom(
      this.apiService.finalizeDiscordOAuth(this.state!, code, this.redirect)
    );

    this.token = {
      admin: user.admin,
      jwt: user.jwt,
    };

    this.cookieService.set(
      'token',
      JSON.stringify(this.token),
      undefined,
      undefined,
      undefined,
      true,
      'Strict'
    );
  }

  async genState(): Promise<string> {
    this.state = v4();
    await lastValueFrom(this.apiService.pushState(this.state));
    return this.state;
  }
}
