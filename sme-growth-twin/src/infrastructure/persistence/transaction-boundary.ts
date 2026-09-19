/** Marker for operations that must execute in one database transaction/RPC. */
export interface TransactionBoundary { readonly transaction: "database-rpc" | "local-fixture" }
