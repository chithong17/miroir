export interface Subscription {
  planCode?: string;
  expiresAt?: string | null;
  allFeaturesIncluded?: boolean;
  plan?: string;
  status?: string;
  isPremium?: boolean;
  usage?: { used?: number; limit?: number; remaining?: number; isExhausted?: boolean };
}

export interface UserProfile {
  gender?: string;
  bodyShape?: string;
  skinTone?: string;
  stylePreferences?: string[];
  measurements?: { height?: number; weight?: number; bust?: number; waist?: number; hips?: number };
  modelImageUrl?: string;
  modelImagePublicId?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  status?: string;
  profile: UserProfile;
  profileCompleted: boolean;
  profileSkipped: boolean;
  favoriteProductIds?: string[];
  subscription?: Subscription;
}

export interface AuthResult { success: boolean; token: string; user: CustomerUser }
export interface UploadAsset { uri: string; name: string; mimeType: string; file?: Blob }

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
  get unauthorized() { return this.status === 401; }
}
