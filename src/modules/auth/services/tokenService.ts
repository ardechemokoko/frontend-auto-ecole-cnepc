import { User } from "../types";

class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
   private readonly  USER_KEY = "user";
 private readonly  TOKEN_KEYApi = "access_token";

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

   // ✅ Sauvegarde du token et de l'utilisateur
  setAuthData(token: any, user: User) {
  localStorage.setItem(this.TOKEN_KEYApi, token);
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
   // ✅ Récupération du token
  getTokenApi() {
    return localStorage.getItem(this.TOKEN_KEYApi);
  }

  clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

   // ✅ Récupération des infos utilisateur
  getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

   // ✅ Vérifie si un utilisateur est connecté
  isAuthenticated(){
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}

export default new TokenService();
