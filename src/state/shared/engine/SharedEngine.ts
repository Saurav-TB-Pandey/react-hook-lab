import { Channel } from "./Channel";
import { EventBus } from "./EventBus";
import { SharedStore } from "./SharedStore";
import {
  createDeleteMessage,
  createRequestMessage,
  createSnapshotMessage,
  createUpdateMessage,
  type SharedMessage,
} from "../protocol/Message";
import type {
  SharedEntryMeta,
  SharedListener,
  SharedStateAction,
  SharedStateInitialValue,
  Unsubscribe,
} from "../types";
import { createTabId } from "../utils/uuid";

/**
 * Coordinates shared state storage, subscriptions, and cross-tab transport.
 */
export class SharedEngine {
  private readonly tabId = createTabId();
  private readonly store = new SharedStore();
  private readonly eventBus = new EventBus();
  private readonly requestedKeys = new Set<string>();
  private readonly channel: Channel;

  /**
   * Creates a shared state engine.
   */
  constructor() {
    this.channel = new Channel((message) => this.handleMessage(message));
  }

  /**
   * Ensures a key exists locally and requests remote snapshots once.
   */
  initializeKey<T>(key: string, initialValue: SharedStateInitialValue<T>): void {
    this.store.ensureEntry(key, initialValue, this.tabId);

    if (!this.channel.isSupported || this.requestedKeys.has(key)) {
      return;
    }

    this.requestedKeys.add(key);
    this.channel.post(createRequestMessage(key, this.tabId));
  }

  /**
   * Gets the current value for a key.
   */
  getSnapshot<T>(key: string, initialValue: SharedStateInitialValue<T>): T {
    return this.store.ensureEntry(key, initialValue, this.tabId).value;
  }

  /**
   * Subscribes to changes for one key.
   */
  subscribe(key: string, listener: SharedListener): Unsubscribe {
    return this.eventBus.subscribe(key, listener);
  }

  /**
   * Applies a local state update and broadcasts it.
   */
  setState<T>(
    key: string,
    action: SharedStateAction<T>,
    initialValue: SharedStateInitialValue<T>
  ): void {
    const entry = this.store.setLocalValue(key, action, initialValue, this.tabId);
    if (!entry) return;

    this.eventBus.emit(key);
    this.channel.post(createUpdateMessage(key, this.tabId, entry));
  }

  /**
   * Deletes a local key and broadcasts a DELETE message.
   */
  deleteKey(key: string): void {
    const entry = this.store.getEntry<unknown>(key);
    if (!entry) return;

    const meta: SharedEntryMeta = {
      version: entry.version + 1,
      tabId: this.tabId,
      updatedAt: Date.now(),
    };

    const didDelete = this.store.applyRemoteDelete(key, meta);
    if (!didDelete) return;

    this.eventBus.emit(key);
    this.channel.post(createDeleteMessage(key, this.tabId, meta));
  }

  private handleMessage(message: SharedMessage): void {
    if (message.tabId === this.tabId) {
      return;
    }

    if (message.type === "REQUEST") {
      this.handleRequest(message.key);
      return;
    }

    if (message.type === "SNAPSHOT" || message.type === "UPDATE") {
      const didChange = this.store.applyRemoteEntry(message.key, message.entry);
      if (didChange) {
        this.eventBus.emit(message.key);
      }
      return;
    }

    if (message.type === "DELETE") {
      const didDelete = this.store.applyRemoteDelete(message.key, message.meta);
      if (didDelete) {
        this.eventBus.emit(message.key);
      }
    }
  }

  private handleRequest(key: string): void {
    const entry = this.store.getEntry<unknown>(key);
    if (!entry) return;

    this.channel.post(createSnapshotMessage(key, this.tabId, entry));
  }
}

/**
 * Singleton shared engine for this module instance.
 */
export const sharedEngine = new SharedEngine();
