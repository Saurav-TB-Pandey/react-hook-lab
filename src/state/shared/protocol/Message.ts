import { MESSAGE_TYPES, PROTOCOL_VERSION } from "./constants";
import type { SharedEntry, SharedEntryMeta } from "../types";

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

interface BaseMessage {
  protocolVersion: typeof PROTOCOL_VERSION;
  type: MessageType;
  key: string;
  tabId: string;
}

/**
 * Message sent by a tab that needs the latest value for a key.
 */
export interface RequestMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.REQUEST;
}

/**
 * Message sent in response to a REQUEST.
 */
export interface SnapshotMessage<T = unknown> extends BaseMessage {
  type: typeof MESSAGE_TYPES.SNAPSHOT;
  entry: SharedEntry<T>;
}

/**
 * Message sent after a local state update.
 */
export interface UpdateMessage<T = unknown> extends BaseMessage {
  type: typeof MESSAGE_TYPES.UPDATE;
  entry: SharedEntry<T>;
}

/**
 * Message sent when a key is deleted.
 */
export interface DeleteMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.DELETE;
  meta: SharedEntryMeta;
}

export type SharedMessage<T = unknown> =
  | RequestMessage
  | SnapshotMessage<T>
  | UpdateMessage<T>
  | DeleteMessage;

/**
 * Creates a REQUEST message.
 */
export function createRequestMessage(key: string, tabId: string): RequestMessage {
  return {
    protocolVersion: PROTOCOL_VERSION,
    type: MESSAGE_TYPES.REQUEST,
    key,
    tabId,
  };
}

/**
 * Creates a SNAPSHOT message.
 */
export function createSnapshotMessage<T>(
  key: string,
  tabId: string,
  entry: SharedEntry<T>
): SnapshotMessage<T> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    type: MESSAGE_TYPES.SNAPSHOT,
    key,
    tabId,
    entry,
  };
}

/**
 * Creates an UPDATE message.
 */
export function createUpdateMessage<T>(
  key: string,
  tabId: string,
  entry: SharedEntry<T>
): UpdateMessage<T> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    type: MESSAGE_TYPES.UPDATE,
    key,
    tabId,
    entry,
  };
}

/**
 * Creates a DELETE message.
 */
export function createDeleteMessage(
  key: string,
  tabId: string,
  meta: SharedEntryMeta
): DeleteMessage {
  return {
    protocolVersion: PROTOCOL_VERSION,
    type: MESSAGE_TYPES.DELETE,
    key,
    tabId,
    meta,
  };
}

/**
 * Parses and validates a BroadcastChannel payload.
 */
export function parseMessage(value: unknown): SharedMessage | null {
  if (!isRecord(value)) return null;
  if (value.protocolVersion !== PROTOCOL_VERSION) return null;
  if (!isMessageType(value.type)) return null;
  if (typeof value.key !== "string" || value.key.length === 0) return null;
  if (typeof value.tabId !== "string" || value.tabId.length === 0) return null;

  const key = value.key;
  const tabId = value.tabId;

  if (value.type === MESSAGE_TYPES.REQUEST) {
    return createRequestMessage(key, tabId);
  }

  if (value.type === MESSAGE_TYPES.DELETE) {
    return isEntryMeta(value.meta)
      ? createDeleteMessage(key, tabId, value.meta)
      : null;
  }

  if (value.type === MESSAGE_TYPES.SNAPSHOT || value.type === MESSAGE_TYPES.UPDATE) {
    if (!isSharedEntry(value.entry)) return null;

    return value.type === MESSAGE_TYPES.SNAPSHOT
      ? createSnapshotMessage(key, tabId, value.entry)
      : createUpdateMessage(key, tabId, value.entry);
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMessageType(value: unknown): value is MessageType {
  return (
    value === MESSAGE_TYPES.REQUEST ||
    value === MESSAGE_TYPES.SNAPSHOT ||
    value === MESSAGE_TYPES.UPDATE ||
    value === MESSAGE_TYPES.DELETE
  );
}

function isEntryMeta(value: unknown): value is SharedEntryMeta {
  if (!isRecord(value)) return false;

  return (
    typeof value.version === "number" &&
    Number.isFinite(value.version) &&
    typeof value.tabId === "string" &&
    value.tabId.length > 0 &&
    typeof value.updatedAt === "number" &&
    Number.isFinite(value.updatedAt)
  );
}

function isSharedEntry(value: unknown): value is SharedEntry<unknown> {
  return isRecord(value) && "value" in value && isEntryMeta(value);
}
