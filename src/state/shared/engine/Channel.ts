import { CHANNEL_NAME } from "../protocol/constants";
import { parseMessage, type SharedMessage } from "../protocol/Message";

/**
 * BroadcastChannel transport wrapper.
 */
export class Channel {
  private readonly channel: BroadcastChannel | null;

  /**
   * Creates a channel and registers a validated message handler.
   */
  constructor(onMessage: (message: SharedMessage) => void) {
    if (!("BroadcastChannel" in globalThis)) {
      this.channel = null;
      return;
    }

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      const channel = this.channel as BroadcastChannel & { unref?: () => void };
      if (typeof channel.unref === "function") {
        channel.unref();
      }
    } catch {
      this.channel = null;
      return;
    }

    this.channel.onmessage = (event: MessageEvent<unknown>) => {
      const message = parseMessage(event.data);
      if (message) {
        onMessage(message);
      }
    };
  }

  /**
   * Returns whether BroadcastChannel is available.
   */
  get isSupported(): boolean {
    return this.channel !== null;
  }

  /**
   * Posts a protocol message when transport is available.
   */
  post(message: SharedMessage): void {
    if (!this.channel) return;

    try {
      this.channel.postMessage(message);
    } catch {
      // Structured clone can fail for unsupported values.
    }
  }

  /**
   * Closes the underlying BroadcastChannel.
   */
  close(): void {
    this.channel?.close();
  }
}
