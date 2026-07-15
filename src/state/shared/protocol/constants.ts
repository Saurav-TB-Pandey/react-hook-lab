/**
 * BroadcastChannel name used by react-hook-lab shared state.
 */
export const CHANNEL_NAME = "react-hook-lab:shared-state";

/**
 * Current wire protocol version.
 */
export const PROTOCOL_VERSION = 1;

/**
 * Message type constants for the shared state protocol.
 */
export const MESSAGE_TYPES = {
  REQUEST: "REQUEST",
  SNAPSHOT: "SNAPSHOT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
