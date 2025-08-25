import DataLoader from 'dataloader';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt';
import { ICategory, IMediaAsset, ITag, IUser } from '../models';

export interface GraphQLContext {
  req: Request;
  user?: AuthUser;
  dataloaders: {
    categoryById: DataLoader<string, ICategory | null>;
    tagById: DataLoader<string, ITag | null>;
    mediaAssetById: DataLoader<string, IMediaAsset | null>;
    userById: DataLoader<string, IUser | null>;
    categoriesByIds: DataLoader<string[], ICategory[]>;
    tagsByIds: DataLoader<string[], ITag[]>;
  };
}
