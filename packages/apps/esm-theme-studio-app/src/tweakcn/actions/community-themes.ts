// Communauté retirée dans le Studio EGEN : API compatible, listes vides.
const none = async (..._args: any[]): Promise<any> => ({ success: true, data: [] });
export const getCommunityThemes = async (..._args: any[]): Promise<any> => ({ themes: [], total: 0 });
export const getCommunityTagCounts = async (..._args: any[]): Promise<any> => [];
export const publishTheme = none;
export const unpublishTheme = none;
export const toggleLikeTheme = none;
export const getMyPublishedThemeIds = async (..._args: any[]): Promise<any> => [];
export const updateCommunityThemeTags = none;
