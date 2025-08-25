import DataLoader from 'dataloader';
import { Category, ICategory, IMediaAsset, ITag, IUser, MediaAsset, Tag, User } from '../models';

// Category loaders
export const createCategoryByIdLoader = (): DataLoader<string, ICategory | null> =>
  new DataLoader(async (ids: readonly string[]) => {
    const categories = await Category.find({ _id: { $in: ids } });
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    return ids.map(id => categoryMap.get(id) || null);
  });

export const createCategoriesByIdsLoader = (): DataLoader<string[], ICategory[]> =>
  new DataLoader(async (idArrays: readonly string[][]) => {
    const allIds = Array.from(new Set(idArrays.flat()));
    const categories = await Category.find({ _id: { $in: allIds } });
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    return idArrays.map(ids => ids.map(id => categoryMap.get(id)).filter(Boolean) as ICategory[]);
  });

// Tag loaders
export const createTagByIdLoader = (): DataLoader<string, ITag | null> =>
  new DataLoader(async (ids: readonly string[]) => {
    const tags = await Tag.find({ _id: { $in: ids } });
    const tagMap = new Map(tags.map(tag => [tag.id, tag]));
    return ids.map(id => tagMap.get(id) || null);
  });

export const createTagsByIdsLoader = (): DataLoader<string[], ITag[]> =>
  new DataLoader(async (idArrays: readonly string[][]) => {
    const allIds = Array.from(new Set(idArrays.flat()));
    const tags = await Tag.find({ _id: { $in: allIds } });
    const tagMap = new Map(tags.map(tag => [tag.id, tag]));

    return idArrays.map(ids => ids.map(id => tagMap.get(id)).filter(Boolean) as ITag[]);
  });

// MediaAsset loader
export const createMediaAssetByIdLoader = (): DataLoader<string, IMediaAsset | null> =>
  new DataLoader(async (ids: readonly string[]) => {
    const mediaAssets = await MediaAsset.find({ _id: { $in: ids } });
    const mediaMap = new Map(mediaAssets.map(media => [media.id, media]));
    return ids.map(id => mediaMap.get(id) || null);
  });

// User loader
export const createUserByIdLoader = (): DataLoader<string, IUser | null> =>
  new DataLoader(async (ids: readonly string[]) => {
    const users = await User.find({ _id: { $in: ids } });
    const userMap = new Map(users.map(user => [user.id, user]));
    return ids.map(id => userMap.get(id) || null);
  });

// Factory function to create all loaders
export const createDataLoaders = () => ({
  categoryById: createCategoryByIdLoader(),
  tagById: createTagByIdLoader(),
  mediaAssetById: createMediaAssetByIdLoader(),
  userById: createUserByIdLoader(),
  categoriesByIds: createCategoriesByIdsLoader(),
  tagsByIds: createTagsByIdsLoader(),
});
