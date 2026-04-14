2026/04/14 10:48:24.718 [Signaling] 📨 Received: ice-candidate
2026/04/14 10:48:24.719 [Signaling] 🧊 ICE candidate from: 101
2026/04/14 10:48:24.719 [WebRTC] ⏳ Queuing ICE candidate (peer connection/remote description not ready)
2026/04/14 10:48:24.772 [Signaling] 📨 Received: ice-candidate
2026/04/14 10:48:24.773 [Signaling] 🧊 ICE candidate from: 101
2026/04/14 10:48:24.773 [WebRTC] ⏳ Queuing ICE candidate (peer connection/remote description not ready)
RNInCallManager.stopRingtone()
RNInCallManager.restoreOriginalAudioSetup(): origAudioCategory=AVAudioSessionCategorySoloAmbient, origAudioMode=AVAudioSessionModeDefault
RNInCallManager.restoreOriginalAudioSetup: audioSession.setCategory: AVAudioSessionCategoryPlayback, withOptions: 0 success
RNInCallManager.restoreOriginalAudioSetup: audioSession.setMode(AVAudioSessionModeDefault) success
RNInCallManager.stopRingtone: audioSession.setActive(NO), withOptions: 1 success
2026/04/14 10:48:25.924 [WebRTC] Requesting audio permission...
2026/04/14 10:48:25.924 [WebRTC] Fetching TURN credentials from Metered...
2026/04/14 10:48:26.513 [WebRTC] ✅ Got TURN servers: 5 entries
2026/04/14 10:48:26.530 [WebRTC] ✅ Local audio stream obtained: E79D400F-4A78-4EC4-93CA-AD79E498671C
2026/04/14 10:48:26.530 [WebRTC] Audio tracks: 1
2026/04/14 10:48:26.531 [WebRTC] ✅ Local audio stream obtained: E79D400F-4A78-4EC4-93CA-AD79E498671C
2026/04/14 10:48:26.531 [WebRTC] Audio tracks: [{"label":"","enabled":true,"muted":false,"kind":"audio"}]
2026/04/14 10:48:26.531 [WebRTC] Starting InCallManager...
2026/04/14 10:48:26.531 [WebRTC] Creating peer connection...
2026/04/14 10:48:26.532 [WebRTC] ICE servers: {"iceServers":[{"urls":"stun:stun.l.google.com:19302"},{"urls":"stun:stun1.l.google.com:19302"},{"urls":"stun:stun2.l.google.com:19302"},{"urls":"stun:stun3.l.google.com:19302"},{"urls":"stun:stun.relay.metered.ca:80"},{"urls":"turn:asia.relay.metered.ca:80","username":"9b2b3f7c444b4fcdd13e528a","credential":"z6923n/o735/qBru"},{"urls":"turn:asia.relay.metered.ca:80?transport=tcp","username":"9b2b3f7c444b4fcdd13e528a","credential":"z6923n/o735/qBru"},{"urls":"turn:asia.relay.metered.ca:443","username":"9b2b3f7c444b4fcdd13e528a","credential":"z6923n/o735/qBru"},{"urls":"turns:asia.relay.metered.ca:443?transport=tcp","username":"9b2b3f7c444b4fcdd13e528a","credential":"z6923n/o735/qBru"}]}
2026/04/14 10:48:26.544 rn-webrtc:pc:DEBUG 0 ctor +0ms
2026/04/14 10:48:26.545 [WebRTC] ✅ Peer connection created
RNInCallManager.start() start InCallManager. media=audio, type=audio, mode=AVAudioSessionModeVoiceChat
2026/04/14 10:48:26.545 [WebRTC] Adding local stream to peer connection...
2026/04/14 10:48:26.546 rn-webrtc:pc:DEBUG 0 addTrack +1ms
RNInCallManager.storeOriginalAudioSetup(): origAudioCategory=AVAudioSessionCategoryPlayback, origAudioMode=AVAudioSessionModeDefault
RNInCallManager.startAudioSessionNotification() starting...
RNInCallManager.startAudioSessionInterruptionNotification()
RNInCallManager.startAudioSessionRouteChangeNotification()
RNInCallManager.startAudioSessionMediaServicesWereLostNotification()
RNInCallManager.startAudioSessionMediaServicesWereResetNotification()
RNInCallManager.startAudioSessionSilenceSecondaryAudioHintNotification()
RNInCallManager.start:auto:ringbackUriType:: audioSession.setCategory: AVAudioSessionCategoryPlayAndRecord, withOptions: 0 success
RNInCallManager.start:auto:ringbackUriType:: audioSession.setMode(AVAudioSessionModeVoiceChat) success
2026/04/14 10:48:26.550 [WebRTC] ✅ Added track: audio - ID: 7026112B-2356-44AD-8787-39B015F4BA72
2026/04/14 10:48:26.550 [WebRTC] ✅ Local stream added to peer connection
2026/04/14 10:48:26.551 [WebRTC] Setting remote description (offer)...
2026/04/14 10:48:26.551 [WebRTC] Offer type: offer
2026/04/14 10:48:26.551 rn-webrtc:pc:DEBUG 0 setRemoteDescription +6ms
2026/04/14 10:48:26.555 [WebRTC] 📡 Signaling state: have-remote-offer
2026/04/14 10:48:26.556 rn-webrtc:pc:DEBUG 0 ontrack +4ms
2026/04/14 10:48:26.556 [WebRTC] 🎧 Remote track received
2026/04/14 10:48:26.557 [WebRTC] Track kind: audio
2026/04/14 10:48:26.557 [WebRTC] Track enabled: true
2026/04/14 10:48:26.557 [WebRTC] Track readyState: live
2026/04/14 10:48:26.557 [WebRTC] event.streams length: 1
2026/04/14 10:48:26.557 [WebRTC] ✅ Using stream from event.streams[0]: 8dc50917-2632-41f9-9985-4e5d04adae13
2026/04/14 10:48:26.557 [WebRTC] ✅ Remote stream saved, audio tracks: 1
2026/04/14 10:48:26.557 rn-webrtc:pc:DEBUG 0 setRemoteDescription OK +2ms
2026/04/14 10:48:26.557 [WebRTC] ✅ Remote description set
2026/04/14 10:48:26.557 [WebRTC] 🔄 Processing 11 queued ICE candidates
2026/04/14 10:48:26.558 rn-webrtc:pc:DEBUG 0 addIceCandidate +1ms
2026/04/14 10:48:26.558 [WebRTC] Creating SDP answer...
2026/04/14 10:48:26.558 rn-webrtc:pc:DEBUG 0 createAnswer +0ms
candidate:3939548777 1 udp 2122260223 169.254.146.3 58632 typ host generation 0 ufrag alJO network-id 2 <- candidate
2026/04/14 10:48:26.559 rn-webrtc:pc:DEBUG 0 addIceCandidate +1ms
candidate:4044191457 1 udp 2122194687 172.66.0.95 56198 typ host generation 0 ufrag alJO network-id 1 network-cost 10 <- candidate
2026/04/14 10:48:26.559 [WebRTC] ✅ SDP answer created
2026/04/14 10:48:26.559 [WebRTC] Answer type: answer
2026/04/14 10:48:26.559 [WebRTC] Answer SDP length: 1195
2026/04/14 10:48:26.560 rn-webrtc:pc:DEBUG 0 setLocalDescription +1ms
2026/04/14 10:48:26.560 rn-webrtc:pc:DEBUG 0 addIceCandidate +0ms
nw_socket_handle_socket_event [C32.1.1:1] Socket SO_ERROR [61: Connection refused]
nw_protocol_socket_set_no_wake_from_sleep [C32.1.1:1] setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_protocol_socket_set_no_wake_from_sleep setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_endpoint_flow_failed_with_error [C32.1.1 ::1.8081 in_progress socket-flow (satisfied (Path is satisfied), viable, interface: lo0)] already failing, returning
nw_socket_handle_socket_event [C32.1.2:1] Socket SO_ERROR [61: Connection refused]
nw_protocol_socket_set_no_wake_from_sleep [C32.1.2:1] setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_protocol_socket_set_no_wake_from_sleep setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_endpoint_flow_failed_with_error [C32.1.2 127.0.0.1:8081 in_progress socket-flow (satisfied (Path is satisfied), viable, interface: lo0)] already failing, returning
nw_endpoint_flow_failed_with_error [C32.1.2 127.0.0.1:8081 cancelled socket-flow ((null))] already failing, returning
nw_connection_get_connected_socket_block_invoke [C32] Client called nw_connection_get_connected_socket on unconnected nw_connection
TCP Conn 0x12e2d5860 Failed : error 0:61 [61]
RNInCallManager.start:auto:ringbackUriType:: audioSession.setActive(YES), withOptions: 0 success
RNInCallManager.startProximitySensor()
RNInCallManager.setKeepScreenOn(): enable: YES
RNInCallManager.setForceSpeakerphoneOn(): flag: -1
RNInCallManager.updateAudioRoute(): [Enter] forceSpeakerOn flag=-1 media=audio category=AVAudioSessionCategoryPlayAndRecord mode=AVAudioSessionModeVoiceChat
RNInCallManager.updateAudioRoute(): did NOT overrideOutputAudioPort()
RNInCallManager.updateAudioRoute() did NOT change audio category
RNInCallManager.updateAudioRoute() did NOT change audio mode
RNInCallManager.setMicrophoneMute(): ios doesn't support setMicrophoneMute()
candidate:3624975307 1 udp 2122134271 fd9a:cadc:ecbe::2 63769 typ host generation 0 ufrag alJO network-id 3 network-cost 50 <- candidate
2026/04/14 10:48:27.232 [WebRTC] 📡 Signaling state: stable
2026/04/14 10:48:27.238 rn-webrtc:pc:DEBUG 0 setLocalDescription OK +678ms
2026/04/14 10:48:27.238 [WebRTC] ✅ Local description set
2026/04/14 10:48:27.239 [Signaling] 📤 Sending call answer to 101
2026/04/14 10:48:27.242 [DemoCallScreen] Rendering remote audio, stream URL: BE76DA08-1BA2-4502-BB0D-292662D86F26
2026/04/14 10:48:27.262 [DemoCallScreen] Rendering remote audio, stream URL: BE76DA08-1BA2-4502-BB0D-292662D86F26
2026/04/14 10:48:27.270 [WebRTC] 🧊 ICE connection state: checking
2026/04/14 10:48:27.270 [WebRTC] 🧊 ICE gathering state: gathering
2026/04/14 10:48:27.270 rn-webrtc:pc:DEBUG 0 addIceCandidate +32ms
2026/04/14 10:48:27.270 [WebRTC] 🔌 Connection state: connecting
candidate:2985755720 1 udp 1685987071 14.241.120.147 56198 typ srflx raddr 172.66.0.95 rport 56198 generation 0 ufrag alJO network-id 1 network-cost 10 <- candidate
2026/04/14 10:48:27.279 [WebRTC] 🧊 ICE candidate generated
2026/04/14 10:48:27.279 [WebRTC] Candidate: candidate:367916030 1 udp 2122262783 2402:9d80:410:160c:4d5c:63d8:f6b7:6511 65015 typ host generation 0 ufrag BkvG network-id 5 network-cost 900
2026/04/14 10:48:27.279 [WebRTC] 🧊 ICE candidate generated
2026/04/14 10:48:27.280 [WebRTC] Candidate: candidate:4171333738 1 udp 2122194687 10.228.222.171 63811 typ host generation 0 ufrag BkvG network-id 4 network-cost 900
2026/04/14 10:48:27.280 rn-webrtc:pc:DEBUG 0 addIceCandidate +10ms
candidate:343567101 1 tcp 1518280447 169.254.146.3 9 typ host tcptype active generation 0 ufrag alJO network-id 2 <- candidate
2026/04/14 10:48:27.281 rn-webrtc:pc:DEBUG 0 addIceCandidate +1ms
candidate:262644341 1 tcp 1518214911 172.66.0.95 9 typ host tcptype active generation 0 ufrag alJO network-id 1 network-cost 10 <- candidate
2026/04/14 10:48:27.282 rn-webrtc:pc:DEBUG 0 addIceCandidate +1ms
candidate:649752415 1 tcp 1518154495 fd9a:cadc:ecbe::2 9 typ host tcptype active generation 0 ufrag alJO network-id 3 network-cost 50 <- candidate
2026/04/14 10:48:27.282 rn-webrtc:pc:DEBUG 0 addIceCandidate +0ms
candidate:4294713413 1 udp 58597631 172.104.172.212 22236 typ relay raddr 14.241.120.147 rport 56198 generation 0 ufrag alJO network-id 1 network-cost 10 <- candidate
2026/04/14 10:48:27.283 rn-webrtc:pc:DEBUG 0 addIceCandidate +1ms
candidate:4294713413 1 udp 58598143 172.104.172.212 26682 typ relay raddr 14.241.120.147 rport 56198 generation 0 ufrag alJO network-id 1 network-cost 10 <- candidate
2026/04/14 10:48:27.283 rn-webrtc:pc:DEBUG 0 addIceCandidate +0ms
candidate:4256413856 1 udp 25043455 172.236.136.45 29998 typ relay raddr 14.241.120.147 rport 59450 generation 0 ufrag alJO network-id 1 network-cost 10 <- candidate
2026/04/14 10:48:27.284 rn-webrtc:pc:DEBUG 0 addIceCandidate +1ms
candidate:1513562627 1 udp 8265727 172.236.136.45 26655 typ relay raddr 14.241.120.147 rport 59453 generation 0 ufrag alJO network-id 1 network-cost 10 <- candidate
2026/04/14 10:48:27.285 [WebRTC] ✅ All queued candidates processed
AudioSessionManager: 🔀 RouteChange reason: 3, speaker: false, isOtherAudioPlaying:false, isAudioEnabled: false, category:AVAudioSessionCategory(_rawValue: AVAudioSessionCategoryPlayAndRecord) ,mode: AVAudioSessionMode(_rawValue: AVAudioSessionModeVoiceChat), options: AVAudioSessionCategoryOptions(rawValue: 0)
RNInCallManager.AudioRouteChange.Reason: CategoryChange. category=AVAudioSessionCategoryPlayAndRecord mode=AVAudioSessionModeVoiceChat
RNInCallManager.updateAudioRoute(): [Enter] forceSpeakerOn flag=-1 media=audio category=AVAudioSessionCategoryPlayAndRecord mode=AVAudioSessionModeVoiceChat
RNInCallManager.updateAudioRoute(): did NOT overrideOutputAudioPort()
RNInCallManager.updateAudioRoute() did NOT change audio category
RNInCallManager.updateAudioRoute() did NOT change audio mode
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: End
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: Unknow Value
App is being debugged, do not track this hang
Hang detected: 0.60s (debugger attached, not reporting)
2026/04/14 10:48:27.931 [WebRTC] 🧊 ICE candidate generated
2026/04/14 10:48:27.932 [WebRTC] Candidate: candidate:3947308906 1 tcp 1518283007 2402:9d80:410:160c:4d5c:63d8:f6b7:6511 57124 typ host tcptype passive generation 0 ufrag BkvG network-id 5 network-cost 900
2026/04/14 10:48:27.933 [WebRTC] 🧊 ICE candidate generated
2026/04/14 10:48:27.934 [WebRTC] Candidate: candidate:101405950 1 tcp 1518214911 10.228.222.171 57125 typ host tcptype passive generation 0 ufrag BkvG network-id 4 network-cost 900
2026/04/14 10:48:27.935 [WebRTC] 🧊 ICE candidate generated
2026/04/14 10:48:27.936 [WebRTC] Candidate: candidate:2238976606 1 udp 1685987071 42.1.85.156 10182 typ srflx raddr 10.228.222.171 rport 63811 generation 0 ufrag BkvG network-id 4 network-cost 900
No video stream for react tag: BE76DA08-1BA2-4502-BB0D-292662D86F26
No video stream for react tag: BE76DA08-1BA2-4502-BB0D-292662D86F26
Sending `onAudioRouteChange` with no listeners registered.
App is being debugged, do not track this hang
Hang detected: 0.66s (debugger attached, not reporting)
Sending `onAudioRouteChange` with no listeners registered.
2026/04/14 10:48:28.020 [WebRTC] 🧊 ICE candidate generated
2026/04/14 10:48:28.020 [WebRTC] Candidate: candidate:4259815484 1 udp 1686052607 42.1.87.112 19178 typ srflx raddr 2402:9d80:410:160c:4d5c:63d8:f6b7:6511 rport 65015 generation 0 ufrag BkvG network-id 5 network-cost 900
2026/04/14 10:48:28.026 [WebRTC] 🧊 ICE candidate generated
2026/04/14 10:48:28.026 [WebRTC] Candidate: candidate:2238976606 1 udp 1685987071 42.1.85.156 17899 typ srflx raddr 10.228.222.171 rport 63811 generation 0 ufrag BkvG network-id 4 network-cost 900
2026/04/14 10:48:28.284 [WebRTC] 🧊 ICE candidate gathering complete
2026/04/14 10:48:28.285 [WebRTC] 🧊 ICE gathering state: complete
2026/04/14 10:48:28.332 [DemoCallScreen] Rendering remote audio, stream URL: BE76DA08-1BA2-4502-BB0D-292662D86F26
2026/04/14 10:48:28.523 [WebRTC] 🔌 Connection state: connected
2026/04/14 10:48:28.524 [WebRTC] 🧊 ICE connection state: connected
