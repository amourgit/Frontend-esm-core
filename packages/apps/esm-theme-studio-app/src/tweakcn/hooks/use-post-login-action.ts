export type PostLoginActionType =
  | 'SAVE_THEME'
  | 'AI_GENERATE_FROM_PAGE'
  | 'AI_GENERATE_FROM_CHAT'
  | 'AI_GENERATE_FROM_CHAT_SUGGESTION'
  | 'AI_GENERATE_EDIT'
  | 'AI_GENERATE_RETRY'
  | 'SAVE_THEME_FOR_SHARE'
  | 'SAVE_THEME_FOR_V0'
  | 'CHECKOUT'
  | 'LIKE_THEME';

// Plus de connexion différée : aucune action à rejouer.
export function usePostLoginAction(_type: PostLoginActionType, _handler: (data?: any) => void | Promise<void>) {}
