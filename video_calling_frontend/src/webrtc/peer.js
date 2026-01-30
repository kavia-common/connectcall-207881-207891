/**
 * WebRTC helper: create and manage a PeerConnection and streams.
 *
 * This frontend assumes backend only does signaling (no media relay).
 */

const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

// PUBLIC_INTERFACE
export function createPeerConnection({
  onIceCandidate,
  onRemoteTrack,
  iceServers = DEFAULT_ICE_SERVERS,
}) {
  /** Create a new RTCPeerConnection with sane defaults. */
  const pc = new RTCPeerConnection({ iceServers });

  pc.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate(event.candidate);
  };

  pc.ontrack = (event) => {
    onRemoteTrack(event.streams?.[0] || null, event);
  };

  return pc;
}

// PUBLIC_INTERFACE
export async function getUserMediaStream({ video = true, audio = true } = {}) {
  /** Get local user media stream, throwing a helpful error on denial. */
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support getUserMedia.");
  }
  return navigator.mediaDevices.getUserMedia({ video, audio });
}
