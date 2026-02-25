export interface PasswordService {
  hash(rawPassword: string): string;
  verify(rawPassword: string, passwordHash: string): boolean;
}
