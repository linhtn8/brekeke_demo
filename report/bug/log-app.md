2026/04/14 09:55:08.119 [WebRTC] Requesting audio permission...
2026/04/14 09:55:08.128 [WebRTC] ✅ Local audio stream obtained: EF3B83B2-C3C8-4BAD-B56F-097ABAB04ABB
2026/04/14 09:55:08.128 [WebRTC] Audio tracks: 1
2026/04/14 09:55:08.129 [WebRTC] ✅ Local audio stream obtained: EF3B83B2-C3C8-4BAD-B56F-097ABAB04ABB
2026/04/14 09:55:08.129 [WebRTC] Audio tracks: [{"label":"","enabled":true,"muted":false,"kind":"audio"}]
2026/04/14 09:55:08.130 [WebRTC] Starting InCallManager...
2026/04/14 09:55:08.130 [WebRTC] Creating peer connection...
2026/04/14 09:55:08.131 [WebRTC] ICE servers: {"iceServers":[{"urls":"stun:stun.l.google.com:19302"},{"urls":"stun:stun1.l.google.com:19302"},{"urls":"turn:openrelay.metered.ca:80","username":"openrelayproject","credential":"openrelayproject"},{"urls":"turn:openrelay.metered.ca:443","username":"openrelayproject","credential":"openrelayproject"},{"urls":"turn:openrelay.metered.ca:443?transport=tcp","username":"openrelayproject","credential":"openrelayproject"}]}
2026/04/14 09:55:08.134 rn-webrtc:pc:DEBUG 2 ctor +26s
2026/04/14 09:55:08.135 [WebRTC] ✅ Peer connection created
RNInCallManager.start() start InCallManager. media=audio, type=audio, mode=AVAudioSessionModeVoiceChat
2026/04/14 09:55:08.136 [WebRTC] Adding local stream to peer connection...
2026/04/14 09:55:08.136 rn-webrtc:pc:DEBUG 2 addTrack +2ms
RNInCallManager.storeOriginalAudioSetup(): origAudioCategory=AVAudioSessionCategorySoloAmbient, origAudioMode=AVAudioSessionModeDefault
RNInCallManager.startAudioSessionNotification() starting...
RNInCallManager.startAudioSessionInterruptionNotification()
RNInCallManager.startAudioSessionRouteChangeNotification()
RNInCallManager.startAudioSessionMediaServicesWereLostNotification()
RNInCallManager.startAudioSessionMediaServicesWereResetNotification()
RNInCallManager.startAudioSessionSilenceSecondaryAudioHintNotification()
2026/04/14 09:55:08.140 [WebRTC] ✅ Added track: audio - ID: 1FE1BC27-D2FB-4108-815F-2F854B3766A4
2026/04/14 09:55:08.140 [WebRTC] ✅ Local stream added to peer connection
2026/04/14 09:55:08.141 [WebRTC] Setting remote description (offer)...
2026/04/14 09:55:08.141 [WebRTC] Offer type: offer
2026/04/14 09:55:08.142 rn-webrtc:pc:DEBUG 2 setRemoteDescription +6ms
2026/04/14 09:55:08.144 [WebRTC] 📡 Signaling state: have-remote-offer
2026/04/14 09:55:08.146 rn-webrtc:pc:DEBUG 2 ontrack +4ms
2026/04/14 09:55:08.148 [WebRTC] 🎧 Remote track received
2026/04/14 09:55:08.148 [WebRTC] Track kind: audio
2026/04/14 09:55:08.148 [WebRTC] Track enabled: true
2026/04/14 09:55:08.148 [WebRTC] Track readyState: live
2026/04/14 09:55:08.148 [WebRTC] event.streams length: 1
2026/04/14 09:55:08.148 [WebRTC] ✅ Using stream from event.streams[0]: 91226e8b-69b3-44bd-8084-d5bb1b0a5efc
2026/04/14 09:55:08.149 [WebRTC] ✅ Remote stream saved, audio tracks: 1
2026/04/14 09:55:08.149 rn-webrtc:pc:DEBUG 2 setRemoteDescription OK +3ms
2026/04/14 09:55:08.149 [WebRTC] ✅ Remote description set
2026/04/14 09:55:08.150 [WebRTC] 🔄 Processing 11 queued ICE candidates
2026/04/14 09:55:08.150 rn-webrtc:pc:DEBUG 2 addIceCandidate +1ms
2026/04/14 09:55:08.150 [WebRTC] Creating SDP answer...
2026/04/14 09:55:08.150 rn-webrtc:pc:DEBUG 2 createAnswer +0ms
candidate:4013573731 1 udp 2122260223 169.254.159.222 61749 typ host generation 0 ufrag UKYb network-id 2 <- candidate
2026/04/14 09:55:08.152 rn-webrtc:pc:DEBUG 2 addIceCandidate +1ms
candidate:1536326463 1 udp 2122194687 169.254.244.9 54915 typ host generation 0 ufrag UKYb network-id 3 <- candidate
2026/04/14 09:55:08.152 [WebRTC] ✅ SDP answer created
2026/04/14 09:55:08.152 [WebRTC] Answer type: answer
2026/04/14 09:55:08.153 [WebRTC] Answer SDP length: 1195
2026/04/14 09:55:08.153 rn-webrtc:pc:DEBUG 2 setLocalDescription +2ms
2026/04/14 09:55:08.153 rn-webrtc:pc:DEBUG 2 addIceCandidate +0ms
RNInCallManager.start:auto:ringbackUriType:: audioSession.setCategory: AVAudioSessionCategoryPlayAndRecord, withOptions: 0 success
RNInCallManager.start:auto:ringbackUriType:: audioSession.setMode(AVAudioSessionModeVoiceChat) success
AudioSessionManager: 🔀 RouteChange reason: 3, speaker: false, isOtherAudioPlaying:false, isAudioEnabled: false, category:AVAudioSessionCategory(_rawValue: AVAudioSessionCategoryPlayAndRecord) ,mode: AVAudioSessionMode(_rawValue: AVAudioSessionModeDefault), options: AVAudioSessionCategoryOptions(rawValue: 0)
RNInCallManager.start:auto:ringbackUriType:: audioSession.setActive(YES), withOptions: 0 success
RNInCallManager.startProximitySensor()
RNInCallManager.setKeepScreenOn(): enable: YES
RNInCallManager.setForceSpeakerphoneOn(): flag: -1
RNInCallManager.AudioRouteChange.Reason: CategoryChange. category=AVAudioSessionCategoryPlayAndRecord mode=AVAudioSessionModeVoiceChat
RNInCallManager.updateAudioRoute(): [Enter] forceSpeakerOn flag=-1 media=audio category=AVAudioSessionCategoryPlayAndRecord mode=AVAudioSessionModeVoiceChat
RNInCallManager.updateAudioRoute(): [Enter] forceSpeakerOn flag=-1 media=audio category=AVAudioSessionCategoryPlayAndRecord mode=AVAudioSessionModeVoiceChat
RNInCallManager.updateAudioRoute(): did NOT overrideOutputAudioPort()
RNInCallManager.updateAudioRoute(): did NOT overrideOutputAudioPort()
RNInCallManager.updateAudioRoute() did NOT change audio category
RNInCallManager.updateAudioRoute() did NOT change audio mode
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: End
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: Unknow Value
RNInCallManager.updateAudioRoute() did NOT change audio category
RNInCallManager.updateAudioRoute() did NOT change audio mode
RNInCallManager.setMicrophoneMute(): ios doesn't support setMicrophoneMute()
Sending `onAudioRouteChange` with no listeners registered.
Sending `onAudioRouteChange` with no listeners registered.
candidate:1226969915 1 udp 2122129151 172.66.0.95 60674 typ host generation 0 ufrag UKYb network-id 1 network-cost 10 <- candidate
2026/04/14 09:55:08.434 [WebRTC] 📡 Signaling state: stable
2026/04/14 09:55:08.436 rn-webrtc:pc:DEBUG 2 setLocalDescription OK +283ms
2026/04/14 09:55:08.436 [WebRTC] ✅ Local description set
2026/04/14 09:55:08.436 [Signaling] 📤 Sending call answer to 101
2026/04/14 09:55:08.437 [DemoCallScreen] Rendering remote audio, stream URL: AD50D2FC-C6E6-420A-9945-3F8F281EA05D
2026/04/14 09:55:08.449 [DemoCallScreen] Rendering remote audio, stream URL: AD50D2FC-C6E6-420A-9945-3F8F281EA05D
2026/04/14 09:55:08.455 [WebRTC] 🧊 ICE connection state: checking
2026/04/14 09:55:08.455 [WebRTC] 🧊 ICE gathering state: gathering
2026/04/14 09:55:08.455 rn-webrtc:pc:DEBUG 2 addIceCandidate +19ms
RNInCallManager.stopRingtone()
AudioSessionManager: 🔀 RouteChange reason: 8, speaker: false, isOtherAudioPlaying:false, isAudioEnabled: false, category:AVAudioSessionCategory(_rawValue: AVAudioSessionCategoryPlayAndRecord) ,mode: AVAudioSessionMode(_rawValue: AVAudioSessionModeVoiceChat), options: AVAudioSessionCategoryOptions(rawValue: 0)
RNInCallManager.AudioRouteChange.Reason: RouteConfigurationChange. category=AVAudioSessionCategoryPlayAndRecord mode=AVAudioSessionModeVoiceChat
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: End
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: Unknow Value
Sending `onAudioRouteChange` with no listeners registered.
Sending `onAudioRouteChange` with no listeners registered.
RNInCallManager.restoreOriginalAudioSetup(): origAudioCategory=AVAudioSessionCategoryPlayAndRecord, origAudioMode=AVAudioSessionModeVoiceChat
candidate:3752956858 1 udp 2122068735 fd42:7af5:7e92::2 64707 typ host generation 0 ufrag UKYb network-id 4 network-cost 50 <- candidate
No video stream for react tag: AD50D2FC-C6E6-420A-9945-3F8F281EA05D
2026/04/14 09:55:08.482 [WebRTC] 🧊 ICE candidate generated
2026/04/14 09:55:08.482 [WebRTC] Candidate: candidate:2202481666 1 udp 2122262783 2402:9d80:410:160c:4d5c:63d8:f6b7:6511 52576 typ host generation 0 ufrag pSWC network-id 7 network-cost 900
2026/04/14 09:55:08.483 [WebRTC] 🔌 Connection state: connecting
2026/04/14 09:55:08.483 [WebRTC] 🧊 ICE candidate generated
2026/04/14 09:55:08.483 [WebRTC] Candidate: candidate:2008514690 1 udp 2122194687 10.228.222.171 52663 typ host generation 0 ufrag pSWC network-id 6 network-cost 900
No video stream for react tag: AD50D2FC-C6E6-420A-9945-3F8F281EA05D
2026/04/14 09:55:08.486 rn-webrtc:pc:DEBUG 2 addIceCandidate +31ms
candidate:2316372196 1 udp 2122003199 fd87:7c1:2f2f::2 61639 typ host generation 0 ufrag UKYb network-id 5 network-cost 50 <- candidate
2026/04/14 09:55:08.486 rn-webrtc:pc:DEBUG 2 addIceCandidate +0ms
candidate:1817959633 1 udp 1685921535 14.241.120.147 60674 typ srflx raddr 172.66.0.95 rport 60674 generation 0 ufrag UKYb network-id 1 network-cost 10 <- candidate
2026/04/14 09:55:08.487 rn-webrtc:pc:DEBUG 2 addIceCandidate +1ms
candidate:2448794875 1 tcp 1518280447 169.254.159.222 9 typ host tcptype active generation 0 ufrag UKYb network-id 2 <- candidate
2026/04/14 09:55:08.487 rn-webrtc:pc:DEBUG 2 addIceCandidate +0ms
candidate:626891175 1 tcp 1518214911 169.254.244.9 9 typ host tcptype active generation 0 ufrag UKYb network-id 3 <- candidate
2026/04/14 09:55:08.487 rn-webrtc:pc:DEBUG 2 addIceCandidate +0ms
candidate:938340771 1 tcp 1518149375 172.66.0.95 9 typ host tcptype active generation 0 ufrag UKYb network-id 1 network-cost 10 <- candidate
2026/04/14 09:55:08.488 rn-webrtc:pc:DEBUG 2 addIceCandidate +1ms
candidate:2709418274 1 tcp 1518088959 fd42:7af5:7e92::2 9 typ host tcptype active generation 0 ufrag UKYb network-id 4 network-cost 50 <- candidate
2026/04/14 09:55:08.488 rn-webrtc:pc:DEBUG 2 addIceCandidate +0ms
candidate:4108249724 1 tcp 1518023423 fd87:7c1:2f2f::2 9 typ host tcptype active generation 0 ufrag UKYb network-id 5 network-cost 50 <- candidate
2026/04/14 09:55:08.488 [WebRTC] ✅ All queued candidates processed
RNInCallManager.restoreOriginalAudioSetup: audioSession.setCategory: AVAudioSessionCategorySoloAmbient, withOptions: 0 success
RNInCallManager.restoreOriginalAudioSetup: audioSession.setMode(AVAudioSessionModeDefault) success
RNInCallManager.stopRingtone: audioSession.setActive(NO), withOptions: 1 success
2026/04/14 09:55:08.555 [WebRTC] 🧊 ICE candidate generated
2026/04/14 09:55:08.555 [WebRTC] Candidate: candidate:4253603482 1 tcp 1518283007 2402:9d80:410:160c:4d5c:63d8:f6b7:6511 54706 typ host tcptype passive generation 0 ufrag pSWC network-id 7 network-cost 900
2026/04/14 09:55:08.566 [WebRTC] 🧊 ICE candidate generated
2026/04/14 09:55:08.566 [WebRTC] Candidate: candidate:158884378 1 tcp 1518214911 10.228.222.171 54707 typ host tcptype passive generation 0 ufrag pSWC network-id 6 network-cost 900
AudioSessionManager: 🔀 RouteChange reason: 3, speaker: true, isOtherAudioPlaying:false, isAudioEnabled: false, category:AVAudioSessionCategory(_rawValue: AVAudioSessionCategorySoloAmbient) ,mode: AVAudioSessionMode(_rawValue: AVAudioSessionModeDefault), options: AVAudioSessionCategoryOptions(rawValue: 0)
RNInCallManager.AudioRouteChange.Reason: CategoryChange. category=AVAudioSessionCategorySoloAmbient mode=AVAudioSessionModeDefault
RNInCallManager.updateAudioRoute(): [Enter] forceSpeakerOn flag=-1 media=audio category=AVAudioSessionCategorySoloAmbient mode=AVAudioSessionModeDefault
RNInCallManager.updateAudioRoute(): audioSession.overrideOutputAudioPort(.None) success
RNInCallManager.updateAudioRoute: audioSession.setCategory: AVAudioSessionCategoryPlayAndRecord, withOptions: 0 success
RNInCallManager.updateAudioRoute() audio category has changed to AVAudioSessionCategoryPlayAndRecord
RNInCallManager.updateAudioRoute() did NOT change audio mode
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: End
RNInCallManager.AudioRouteChange.SilenceSecondaryAudioHint: Unknow Value
Sending `onAudioRouteChange` with no listeners registered.
Sending `onAudioRouteChange` with no listeners registered.
2026/04/14 09:55:08.610 [WebRTC] 🧊 ICE candidate generated
2026/04/14 09:55:08.610 [WebRTC] Candidate: candidate:2780497165 1 udp 1685987071 42.1.85.156 9188 typ srflx raddr 10.228.222.171 rport 52663 generation 0 ufrag pSWC network-id 6 network-cost 900
nw_socket_handle_socket_event [C121.1.1:1] Socket SO_ERROR [61: Connection refused]
nw_protocol_socket_set_no_wake_from_sleep [C121.1.1:1] setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_protocol_socket_set_no_wake_from_sleep setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_endpoint_flow_failed_with_error [C121.1.1 ::1.8081 in_progress socket-flow (satisfied (Path is satisfied), viable, interface: lo0)] already failing, returning
nw_socket_handle_socket_event [C121.1.2:1] Socket SO_ERROR [61: Connection refused]
nw_protocol_socket_set_no_wake_from_sleep [C121.1.2:1] setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_protocol_socket_set_no_wake_from_sleep setsockopt SO_NOWAKEFROMSLEEP failed [22: Invalid argument]
nw_endpoint_flow_failed_with_error [C121.1.2 127.0.0.1:8081 in_progress socket-flow (satisfied (Path is satisfied), viable, interface: lo0)] already failing, returning
nw_endpoint_flow_failed_with_error [C121.1.2 127.0.0.1:8081 cancelled socket-flow ((null))] already failing, returning
nw_connection_get_connected_socket_block_invoke [C121] Client called nw_connection_get_connected_socket on unconnected nw_connection
TCP Conn 0x15202c0a0 Failed : error 0:61 [61]
2026/04/14 09:55:09.521 [DemoCallScreen] Rendering remote audio, stream URL: AD50D2FC-C6E6-420A-9945-3F8F281EA05D
2026/04/14 09:55:10.586 [DemoCallScreen] Rendering remote audio, stream URL: AD50D2FC-C6E6-420A-9945-3F8F281EA05D
2026/04/14 09:55:11.300 [WebRTC-DIAG] ICE=checking | Conn=connecting | Sig=stable | LocalTracks=1(enabled=true) | RemoteTracks=1(enabled=true)
