import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { SignalingClient } from "../ws/signaling";
import { createPeerConnection, getUserMediaStream } from "../webrtc/peer";
import { ErrorBanner } from "../components/Status";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function now() {
  const d = new Date();
  return `${d.toLocaleTimeString()}`;
}

// PUBLIC_INTERFACE
export default function CallScreen() {
  /** WebRTC call screen with signaling over websocket. */
  const { token } = useAuth();
  const nav = useNavigate();
  const q = useQuery();
  const to = q.get("to") || "";

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const [status, setStatus] = useState("idle"); // idle|ready|calling|in-call|ended|error
  const [wsState, setWsState] = useState("closed"); // connecting|open|closed|error
  const [error, setError] = useState("");
  const [log, setLog] = useState("");

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  function appendLog(line) {
    setLog((prev) => `${prev}${prev ? "\n" : ""}[${now()}] ${line}`);
  }

  function cleanupPeer() {
    try {
      if (pcRef.current) pcRef.current.close();
    } catch {
      // ignore
    }
    pcRef.current = null;

    if (remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
  }

  function cleanupMedia() {
    const s = localStreamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }

  function cleanupWs() {
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
  }

  async function ensureReady() {
    setError("");
    appendLog("Bootstrapping call console…");

    // WS client
    const ws = new SignalingClient({
      token,
      onMessage: async (msg) => {
        // Expected message schema: {type, from, to, sdp, candidate}
        if (!msg || !msg.type) return;

        if (msg.type === "offer") {
          appendLog(`RX offer from ${msg.from || "peer"}`);
          await handleOffer(msg);
        } else if (msg.type === "answer") {
          appendLog("RX answer");
          await handleAnswer(msg);
        } else if (msg.type === "candidate") {
          await handleCandidate(msg);
        } else if (msg.type === "hangup") {
          appendLog("RX hangup");
          endCall("Remote hung up.");
        } else if (msg.type === "info") {
          appendLog(`INFO: ${msg.message || ""}`.trim());
        }
      },
      onStatus: (s) => {
        setWsState(s.state);
        if (s.state === "open") appendLog("WS connected.");
        if (s.state === "connecting") appendLog("WS connecting…");
        if (s.state === "closed") appendLog("WS closed.");
        if (s.state === "error") appendLog(`WS error: ${s.detail || ""}`.trim());
      },
    });

    wsRef.current = ws;
    ws.connect();

    // Local media
    try {
      const stream = await getUserMediaStream({ video: true, audio: true });
      localStreamRef.current = stream;

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      appendLog("Local media acquired.");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Could not access camera/microphone.");
      appendLog("ERROR: media denied.");
      return;
    }

    // Peer connection
    const pc = createPeerConnection({
      onIceCandidate: (candidate) => {
        wsRef.current?.send("candidate", { to, candidate });
      },
      onRemoteTrack: (stream) => {
        if (stream && remoteVideoRef.current) {
          remoteStreamRef.current = stream;
          remoteVideoRef.current.srcObject = stream;
          appendLog("Remote stream attached.");
        }
      },
    });

    pcRef.current = pc;

    // Add tracks
    localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));

    setStatus("ready");
    appendLog("Ready. You can start calling or wait for an incoming offer.");
  }

  async function handleOffer(msg) {
    try {
      setStatus("in-call");
      const pc = pcRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send("answer", { to: msg.from || to, sdp: pc.localDescription });
      appendLog("TX answer.");
    } catch (err) {
      setError(err?.message || "Failed handling offer.");
      setStatus("error");
    }
  }

  async function handleAnswer(msg) {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      setStatus("in-call");
      appendLog("Call established.");
    } catch (err) {
      setError(err?.message || "Failed handling answer.");
      setStatus("error");
    }
  }

  async function handleCandidate(msg) {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      if (!msg.candidate) return;
      await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      appendLog("RX ICE candidate.");
    } catch {
      // Candidate may arrive before remote description; ignore to be robust.
    }
  }

  async function startCall() {
    setError("");
    if (!to) {
      setError("Missing target. Open this screen with ?to=<handle>.");
      return;
    }
    const pc = pcRef.current;
    if (!pc) return;
    try {
      setStatus("calling");
      appendLog(`Dialing ${to}…`);
      wsRef.current?.send("call", { to });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send("offer", { to, sdp: pc.localDescription });
      appendLog("TX offer.");
    } catch (err) {
      setError(err?.message || "Failed to start call.");
      setStatus("error");
    }
  }

  function endCall(reason) {
    appendLog(`Call ended: ${reason || "done"}`);
    try {
      wsRef.current?.send("hangup", { to });
    } catch {
      // ignore
    }
    cleanupPeer();
    setStatus("ended");
  }

  function toggleMic() {
    const s = localStreamRef.current;
    if (!s) return;
    const next = !micEnabled;
    s.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setMicEnabled(next);
    appendLog(next ? "Mic enabled." : "Mic muted.");
  }

  function toggleCam() {
    const s = localStreamRef.current;
    if (!s) return;
    const next = !camEnabled;
    s.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    setCamEnabled(next);
    appendLog(next ? "Camera enabled." : "Camera disabled.");
  }

  useEffect(() => {
    ensureReady();
    return () => {
      cleanupWs();
      cleanupPeer();
      cleanupMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wsBadge = wsState === "open" ? "WS:ONLINE" : wsState === "connecting" ? "WS:DIALING" : "WS:OFFLINE";

  return (
    <div className="call-grid">
      <div>
        <div className="video-wrap">
          <div className="video-overlay">
            <div className="badge">{wsBadge}</div>
            <div className="badge">STATE:{String(status).toUpperCase()}</div>
            <div className="badge">TO:{to || "—"}</div>
          </div>

          <video className="video" ref={remoteVideoRef} autoPlay playsInline />
          <div className="pip" title="Your camera preview">
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <div className="panel-title">CONTROLS</div>
            <div className="spacer" />
            <button className="btn" onClick={() => nav("/app")}>
              Back
            </button>
          </div>
          <div className="panel-body">
            <ErrorBanner message={error} />
            <div className="btn-row">
              <button className="btn btn-primary" onClick={startCall} disabled={status === "calling" || status === "in-call"}>
                Start call
              </button>
              <button className="btn" onClick={toggleMic} disabled={!localStreamRef.current}>
                {micEnabled ? "Mute mic" : "Unmute mic"}
              </button>
              <button className="btn" onClick={toggleCam} disabled={!localStreamRef.current}>
                {camEnabled ? "Disable cam" : "Enable cam"}
              </button>
              <button className="btn btn-danger" onClick={() => endCall("User hangup")}>
                Hang up
              </button>
            </div>
            <div className="footer-hint">
              Signaling uses <span className="kbd">{process.env.REACT_APP_WS_URL}</span>. Media is peer-to-peer.
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">SIGNAL + DEBUG LOG</div>
          <div className="spacer" />
          <button className="btn" onClick={() => setLog("")}>
            Clear
          </button>
        </div>
        <div className="panel-body">
          <div className="log" aria-label="Debug log">
            {log || "[no events yet]"}
          </div>
          <div className="footer-hint">
            If calls don’t connect, verify backend signaling message schema matches {`{type, to, sdp, candidate}`}.
          </div>
        </div>
      </div>
    </div>
  );
}
