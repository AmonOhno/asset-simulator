import { defaultUserId } from './environment';

// ユーザー認証関連の定数
export const DEFAULT_USER_ID = defaultUserId;

// APIレスポンス用の定数
export const API_MESSAGES = {
  SUCCESS: 'Success',
  ERROR: 'Internal Server Error',
  NOT_FOUND: 'Not Found',
  VALIDATION_ERROR: 'Validation Error'
} as const;
