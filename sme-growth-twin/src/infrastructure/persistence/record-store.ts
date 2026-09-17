export interface VersionedRecord {
  readonly id: string;
  readonly revision: number;
}

/**
 * Persistence port only. A SQLite or hosted adapter is intentionally deferred.
 */
export interface RecordStore<TRecord extends VersionedRecord> {
  findById(id: string): Promise<TRecord | null>;
  save(record: TRecord): Promise<void>;
}
