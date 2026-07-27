/**
 * BroadcastChannel name used by react-hook-lab shared state.
 * @internal
 */
export const CHANNEL_NAME = "react-hook-lab:shared-state";

/**
 * Current wire protocol version.
 * @internal
 */
export const PROTOCOL_VERSION = 1;

/**
 * Message type constants for the shared state protocol.
 * @internal
 */
export const MESSAGE_TYPES = {
  REQUEST: "REQUEST",
  SNAPSHOT: "SNAPSHOT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
