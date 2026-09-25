const debugLog = (...args: any[]) => { if (process.env.NODE_ENV === 'development') console.log(...args); };
const debugError = (...args: any[]) => { if (process.env.NODE_ENV === 'development') console.error(...args); };
const debugWarn = (...args: any[]) => { if (process.env.NODE_ENV === 'development') console.warn(...args); };
import { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, query, where, addDoc, getDocs, deleteDoc } from '../lib/firebase';

export const createDummyStream = (): MediaStream => {
  // Create black canvas video
  const canvas = Object.assign(document.createElement('canvas'), { width: 640, height: 480 });
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 640, 480);
  }
  const stream = canvas.captureStream(1); // 1 FPS to keep it extremely lightweight

  // Create silent audio
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    stream.addTrack(dest.stream.getAudioTracks()[0]);
  } catch (e) {
    debugWarn("[WebRTC] Could not create silent audio track", e);
  }

  return stream;
};

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

export const useWebRTCStream = ({
  isTeacher,
  roomId,
  localStream,
  currentUserUid
}: {
  isTeacher: boolean;
  roomId: string | null;
  localStream: MediaStream | null;
  currentUserUid: string | null;
}) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  const localStreamRef = useRef(localStream);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const [sessionGuid] = useState(() => Math.random().toString(36).substring(2, 10));

  // Effect 1: Handle Room Connection & Signaling
  useEffect(() => {
    debugLog(`[WebRTC Debug - 0] Hook evaluates. isTeacher=${isTeacher}, roomId=${roomId}, uid=${currentUserUid}`);
    if (!roomId) {
      debugLog(`[WebRTC Debug - 0] roomId is null or empty. Skipping connection flow.`);
      return;
    }
    
    if (isTeacher) {
      // TEACHER LOGIC (Sender)
      const connectionsRef = collection(db, 'live_sessions', roomId, 'webrtc_connections');
      
      const unsubscribe = onSnapshot(connectionsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const studentId = change.doc.id;
          const data = change.doc.data();

          if (change.type === 'added' || change.type === 'modified') {
            if (data.offer && !data.answer) {
              debugLog(`[WebRTC] Teacher received offer from student: ${studentId}. Recreating connection.`);
              let pc = peerConnections.current.get(studentId);
              if (pc) {
                pc.close();
              }
              
              debugLog(`[WebRTC Debug - 1] (Teacher) Creating RTCPeerConnection for student: ${studentId}`);
              pc = new RTCPeerConnection(STUN_SERVERS);
              peerConnections.current.set(studentId, pc);
              
              pc.onconnectionstatechange = () => {
                 debugLog(`[WebRTC Debug - 4] (Teacher for ${studentId}) connectionState: ${pc?.connectionState}`);
              };

              pc.oniceconnectionstatechange = () => {
                 debugLog(`[WebRTC Debug - 5] (Teacher for ${studentId}) iceConnectionState: ${pc?.iceConnectionState}`);
              };

              pc.onicecandidate = (event) => {
                if (event.candidate) {
                  addDoc(collection(db, 'live_sessions', roomId, 'webrtc_connections', studentId, 'teacher_candidates'), {
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid,
                  }).catch(e => debugError(`[WebRTC Debug - Err] (Teacher) Error adding teacher candidate:`, e));
                }
              };

              try {
                if (pc.signalingState !== "stable") {
                   debugLog("[WebRTC] Teacher PC not stable, ignoring offer. State:", pc.signalingState);
                   return;
                }
                
                debugLog(`[WebRTC Debug - 2] (Teacher for ${studentId}) Setting Remote Description (Offer)...`);
                const offerDesc = new RTCSessionDescription(data.offer);
                await pc.setRemoteDescription(offerDesc);

                const activeStream = localStreamRef.current || createDummyStream();
                debugLog(`[WebRTC Debug - 2] (Teacher for ${studentId}) Setting tracks from localStream...`);
                
                // Force all transceivers to allow sending so replaceTrack works later without renegotiation
                pc!.getTransceivers().forEach(t => {
                   t.direction = 'sendrecv';
                });

                const transceivers = pc!.getTransceivers();
                activeStream.getTracks().forEach((track) => {
                  debugLog(`[WebRTC Debug - 2] (Teacher for ${studentId}) binding track: ${track.kind}`);
                  const transceiver = transceivers.find(t => 
                    t.receiver && t.receiver.track && t.receiver.track.kind === track.kind
                  );
                  
                  if (transceiver && transceiver.sender) {
                     transceiver.sender.replaceTrack(track).catch(e => debugError(`[WebRTC Debug - Err] (Teacher) Replace track failed:`, e));
                  } else {
                     pc!.addTrack(track, activeStream);
                  }
                });

                debugLog(`[WebRTC Debug - 2] (Teacher for ${studentId}) Creating Answer...`);
                const answer = await pc.createAnswer();
                debugLog(`[WebRTC Debug - 2] (Teacher for ${studentId}) Setting Local Description (Answer)...`);
                await pc.setLocalDescription(answer);

                await setDoc(change.doc.ref, { answer: { type: answer.type, sdp: answer.sdp } }, { merge: true });
                debugLog(`[WebRTC Debug - 2] (Teacher for ${studentId}) Sent Answer to Firestore.`);
                
                const studentCandidatesRef = collection(db, 'live_sessions', roomId, 'webrtc_connections', studentId, 'student_candidates');
                onSnapshot(studentCandidatesRef, (subSnap) => {
                  subSnap.docChanges().forEach((subChange) => {
                    if (subChange.type === 'added') {
                      debugLog(`[WebRTC Debug - 3] (Teacher for ${studentId}) Received student ICE candidate.`);
                      const candidate = new RTCIceCandidate(subChange.doc.data());
                      pc?.addIceCandidate(candidate).then(() => {
                         debugLog(`[WebRTC Debug - 3] (Teacher for ${studentId}) Successfully added student ICE candidate.`);
                      }).catch(e => {
                         debugError(`[WebRTC Debug - Err] (Teacher for ${studentId}) Failed to add student ICE candidate:`, e);
                      });
                    }
                  });
                });
              } catch (e) {
                debugError("[WebRTC] Error handling offer:", e);
              }
            }
          }

          if (change.type === 'removed') {
            const pc = peerConnections.current.get(studentId);
            if (pc) {
              pc.close();
              peerConnections.current.delete(studentId);
            }
          }
        });
      });

      return () => {
        unsubscribe();
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
      };
    } else {
      // STUDENT LOGIC (Receiver)
      if (!currentUserUid) return;

      debugLog(`[WebRTC Debug - 1] (Student) Creating RTCPeerConnection for room: ${roomId}`);
      const pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnections.current.set('teacher', pc);
      
      pc.oniceconnectionstatechange = () => {
         debugLog(`[WebRTC Debug - 5] (Student) iceConnectionState changed to: ${pc.iceConnectionState}`);
      };

      pc.onconnectionstatechange = () => {
         debugLog(`[WebRTC Debug - 4] (Student) connectionState changed to: ${pc.connectionState}`);
      };

      pc.ontrack = (event) => {
        debugLog(`[WebRTC Debug - 6] (Student) ontrack invoked! Track kind: ${event.track.kind}, id: ${event.track.id}`);
        debugLog(`[WebRTC Debug - 7] (Student) event.streams length: ${event.streams?.length}`);
        if (event.streams && event.streams.length > 0) {
          event.streams[0].getTracks().forEach(t => debugLog(`  -> stream[0] has track: ${t.kind} id: ${t.id}`));
        }
        
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          setRemoteStream((prevStream) => {
            const stream = prevStream || new MediaStream();
            stream.addTrack(event.track);
            debugLog(`[WebRTC Debug - 7b] (Student) manually added track to MediaStream. Total tracks: ${stream.getTracks().length}`);
            return new MediaStream(stream.getTracks());
          });
        }
      };

      const connectionDocRef = doc(db, 'live_sessions', roomId, 'webrtc_connections', `${currentUserUid}_${sessionGuid}`);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(collection(connectionDocRef, 'student_candidates'), {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          });
        }
      };

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      const unsubscribeConnection = onSnapshot(connectionDocRef, async (snap) => {
        const data = snap.data();
        if (data && data.answer && !pc.currentRemoteDescription) {
          debugLog(`[WebRTC Debug - 2] (Student) Received Answer from teacher. Processing...`);
          try {
            const answerDesc = new RTCSessionDescription(data.answer);
            await pc.setRemoteDescription(answerDesc);
            debugLog(`[WebRTC Debug - 2] (Student) Successfully set remote description (Answer).`);
          } catch (e) {
            debugError(`[WebRTC Debug - Err] (Student) Failed to set remote description`, e);
          }
        }
      });

      const teacherCandidatesRef = collection(connectionDocRef, 'teacher_candidates');
      const unsubscribeCandidates = onSnapshot(teacherCandidatesRef, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            debugLog(`[WebRTC Debug - 3] (Student) Received ICE candidate from teacher.`);
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).then(() => {
               debugLog(`[WebRTC Debug - 3] (Student) Successfully added teacher ICE candidate.`);
            }).catch(e => {
               debugError(`[WebRTC Debug - Err] (Student) Failed to add teacher ICE candidate`, e);
            });
          }
        });
      });

      const initCall = async () => {
        try { await deleteDoc(connectionDocRef); } catch(e) {}
        debugLog(`[WebRTC Debug - 2] (Student) Creating Offer...`);
        const offer = await pc.createOffer();
        debugLog(`[WebRTC Debug - 2] (Student) Setting Local Description (Offer)...`);
        await pc.setLocalDescription(offer);
        await setDoc(connectionDocRef, { offer: { type: offer.type, sdp: offer.sdp } });
        debugLog(`[WebRTC Debug - 2] (Student) Offer sent to Firestore.`);
      };

      initCall();

      return () => {
        unsubscribeConnection();
        unsubscribeCandidates();
        pc.close();
        peerConnections.current.clear();
        setRemoteStream(null);
        // Do not delete doc immediately because strict cleanup on unmount might flash, but standard way is to clear it.
        deleteDoc(connectionDocRef).catch(()=> {});
      };
    }
  }, [isTeacher, roomId, currentUserUid]);

  // Effect 2: Update Teacher tracks whenever localStream changes
  useEffect(() => {
    if (isTeacher && localStream) {
      debugLog("[WebRTC] Updating teacher tracks. localStream id:", localStream.id, "Video:", localStream.getVideoTracks().length, "Audio:", localStream.getAudioTracks().length);
      peerConnections.current.forEach((pc, studentId) => {
        const transceivers = pc.getTransceivers();
        localStream.getTracks().forEach((track) => {
          const transceiver = transceivers.find(t => t.receiver && t.receiver.track && t.receiver.track.kind === track.kind);
          if (transceiver && transceiver.sender) {
            debugLog("[WebRTC] Replacing track for kind:", track.kind, "for student:", studentId);
            transceiver.sender.replaceTrack(track).catch(e => debugError("Error replacing track", e));
            // Ensure direction allows sending
            if (transceiver.direction === 'recvonly') transceiver.direction = 'sendrecv';
            else if (transceiver.direction === 'inactive') transceiver.direction = 'sendonly';
          } else {
            debugLog("[WebRTC] Adding new track for kind:", track.kind, "for student:", studentId);
            try {
               pc.addTrack(track, localStream);
            } catch(e) { debugError(e) }
          }
        });
      });
    }
  }, [isTeacher, localStream]);

  return { remoteStream, peerConnectionsRef: peerConnections };
};
