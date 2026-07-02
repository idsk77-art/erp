export type EntityId = string;
export type ISODateTime = string;

export type OwnedEntity = {
  id: EntityId;
  userId: EntityId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
