import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket/client';
import { VoicePeerState } from '@/lib/game-engine/types';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface UseWebRTCVoiceProps {
  roomId: string;
  myPlayerId: string;
  playerName: string;
}

export function useWebRTCVoice({ roomId, myPlayerId, playerName }: UseWebRTCVoiceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicePeers, setVoicePeers] = useState<VoicePeerState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isMutedRef = useRef(isMuted);
  const isDeafenedRef = useRef(isDeafened);
  const isSpeakingRef = useRef(isSpeaking);

  isMutedRef.current = isMuted;
  isDeafenedRef.current = isDeafened;
  isSpeakingRef.current = isSpeaking;

  // Cleanup helper for an individual peer
  const closePeer = useCallback((socketId: string) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    const audio = remoteAudiosRef.current.get(socketId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
      remoteAudiosRef.current.delete(socketId);
    }
  }, []);

  // Voice Activity Detection loop
  const startVolumeDetection = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioCtx.createMediaStreamSource(stream);
      microphone.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current || !localStreamRef.current) return;

        analyserRef.current.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;

        const speakingNow = average > 14 && !isMutedRef.current;
        if (speakingNow !== isSpeakingRef.current) {
          setIsSpeaking(speakingNow);
          const socket = getSocket();
          socket.emit('voice_state_update', {
            roomId,
            isSpeaking: speakingNow,
          });
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // AudioContext failure gracefully ignored
    }
  };

  // Create an RTCPeerConnection for a remote socket
  const createPeerConnection = useCallback(
    (targetSocketId: string) => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId)!;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(targetSocketId, pc);

      // Add local audio tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket().emit('voice_signal', {
            roomId,
            toSocketId: targetSocketId,
            signal: { candidate: event.candidate },
          });
        }
      };

      // Handle remote incoming audio stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          let audio = remoteAudiosRef.current.get(targetSocketId);
          if (!audio) {
            audio = new Audio();
            audio.autoplay = true;
            remoteAudiosRef.current.set(targetSocketId, audio);
          }
          audio.srcObject = remoteStream;
          audio.muted = isDeafenedRef.current;
          audio.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          closePeer(targetSocketId);
        }
      };

      return pc;
    },
    [roomId, closePeer]
  );

  // Connect to Voice Room
  const joinVoice = async () => {
    try {
      setError(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('مرورگر شما از وب‌آر‌تی‌سی صوتی پشتیبانی نمی‌کند.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setIsConnected(true);
      setIsMuted(false);

      // Start volume detection
      startVolumeDetection(stream);

      // Emit join to server
      const socket = getSocket();
      socket.emit('voice_join', { roomId });
    } catch (err: any) {
      console.error('Voice join error:', err);
      const msg =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'دسترسی به میکروفون داده نشد. لطفاً دسترسی میکروفون را در مرورگر مجاز کنید.'
          : 'خطا در اتصال به ویس‌چت سالون.';
      setError(msg);
      setIsConnected(false);
    }
  };

  // Leave Voice Room
  const leaveVoice = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Remove all remote audios
    remoteAudiosRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    remoteAudiosRef.current.clear();

    setIsConnected(false);
    setIsMuted(false);
    setIsSpeaking(false);
    setVoicePeers([]);

    getSocket().emit('voice_leave', { roomId });
  }, [roomId]);

  // Toggle Mic Mute
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const newMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !newMuted;
    });
    setIsMuted(newMuted);
    if (newMuted) setIsSpeaking(false);

    getSocket().emit('voice_state_update', {
      roomId,
      isMuted: newMuted,
      isSpeaking: false,
    });
  };

  // Toggle Deafen (Silence incoming peers)
  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    remoteAudiosRef.current.forEach((audio) => {
      audio.muted = newDeafened;
    });

    // If deafened, also mute self to prevent accidental speaking
    if (newDeafened && !isMuted) {
      toggleMute();
    }

    getSocket().emit('voice_state_update', {
      roomId,
      isDeafened: newDeafened,
    });
  };

  // Socket signaling listener effects
  useEffect(() => {
    const socket = getSocket();

    // 1. Received list of existing voice peers
    socket.on('voice_room_peers', async ({ peers }: { peers: VoicePeerState[] }) => {
      setVoicePeers(peers.filter((p) => p.socketId !== socket.id));

      // Initiate WebRTC Offer to each existing peer
      for (const peer of peers) {
        if (peer.socketId === socket.id) continue;
        try {
          const pc = createPeerConnection(peer.socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('voice_signal', {
            roomId,
            toSocketId: peer.socketId,
            signal: { offer },
          });
        } catch (err) {
          console.error('Error creating offer for peer:', peer.socketId, err);
        }
      }
    });

    // 2. Another peer joined
    socket.on('voice_peer_joined', ({ peer }: { peer: VoicePeerState }) => {
      setVoicePeers((prev) => {
        if (prev.some((p) => p.socketId === peer.socketId)) return prev;
        return [...prev, peer];
      });
    });

    // 3. Peer state updated (muted, deafened, speaking)
    socket.on('voice_peer_updated', ({ peer }: { peer: VoicePeerState }) => {
      setVoicePeers((prev) =>
        prev.map((p) => (p.socketId === peer.socketId ? { ...p, ...peer } : p))
      );
    });

    // 4. Peer left
    socket.on('voice_peer_left', ({ socketId }: { socketId: string }) => {
      closePeer(socketId);
      setVoicePeers((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    // 5. WebRTC Signaling message received
    socket.on(
      'voice_signal',
      async ({
        fromSocketId,
        signal,
      }: {
        fromSocketId: string;
        fromPlayerId?: string;
        signal: any;
      }) => {
        try {
          const pc = createPeerConnection(fromSocketId);

          if (signal.offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('voice_signal', {
              roomId,
              toSocketId: fromSocketId,
              signal: { answer },
            });
          } else if (signal.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } catch (err) {
          console.error('Signal handling error:', err);
        }
      }
    );

    return () => {
      socket.off('voice_room_peers');
      socket.off('voice_peer_joined');
      socket.off('voice_peer_updated');
      socket.off('voice_peer_left');
      socket.off('voice_signal');
    };
  }, [roomId, createPeerConnection, closePeer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  return {
    isConnected,
    isMuted,
    isDeafened,
    isSpeaking,
    voicePeers,
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
  };
}
