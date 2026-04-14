AudioSessionManager: 🔀 RouteChange reason: 3, speaker: true, isOtherAudioPlaying:false, isAudioEnabled: false, category:AVAudioSessionCategory(_rawValue: AVAudioSessionCategoryPlayAndRecord) ,mode: AVAudioSessionMode(_rawValue: AVAudioSessionModeDefault), options: AVAudioSessionCategoryOptions(rawValue: 0)
Sending `onAudioRouteChange` with no listeners registered.
Sending `onAudioRouteChange` with no listeners registered.
ATS failed system trust
Connection 76: system TLS Trust evaluation failed(-9802)
Connection 76: TLS Trust encountered error 3:-9802
Connection 76: encountered error(3:-9802)
Task <04FBDE69-24A9-4805-A342-FBD680887F86>.<4> HTTP load failed, 0/0 bytes (error code: -1200 [3:-9802])
Task <04FBDE69-24A9-4805-A342-FBD680887F86>.<4> finished with error [-1200] Error Domain=NSURLErrorDomain Code=-1200 "An SSL error has occurred and a secure connection to the server cannot be made." UserInfo={NSLocalizedRecoverySuggestion=Would you like to connect to the server anyway?, _kCFStreamErrorDomainKey=3, NSErrorPeerCertificateChainKey=(
    "<cert(0x12bbf4000) s: *.azureedge.net i: Microsoft Azure ECC TLS Issuing CA 08>",
    "<cert(0x12c22a400) s: Microsoft Azure ECC TLS Issuing CA 08 i: DigiCert Global Root G3>",
    "<cert(0x12c2d2300) s: DigiCert Global Root G3 i: DigiCert Global Root G3>"
), NSErrorClientCertificateStateKey=0, NSErrorFailingURLKey=https://bap-phone.metered.live.metered.live/api/v1/turn/credentials?apiKey=ly5vlvqxIui_UxsJy3kRGLDPpJPgmH14h1t0XYnPPeur0SJX, NSErrorFailingURLStringKey=https://bap-phone.metered.live.metered.live/api/v1/turn/credentials?apiKey=ly5vlvqxIui_UxsJy3kRGLDPpJPgmH14h1t0XYnPPeur0SJX, NSUnderlyingError=0x12bb7fc00 {Error Domain=kCFErrorDomainCFNetwork Code=-1200 "(null)" UserInfo={_kCFStreamPropertySSLClientCertificateState=0, kCFStreamPropertySSLPeerTrust=<SecTrustRef: 0x12c331380>, _kCFNetworkCFStreamSSLErrorOriginalValue=-9802, _kCFStreamErrorDomainKey=3, _kCFStreamErrorCodeKey=-9802, kCFStreamPropertySSLPeerCertificates=(
    "<cert(0x12bbf4000) s: *.azureedge.net i: Microsoft Azure ECC TLS Issuing CA 08>",
    "<cert(0x12c22a400) s: Microsoft Azure ECC TLS Issuing CA 08 i: DigiCert Global Root G3>",
    "<cert(0x12c2d2300) s: DigiCert Global Root G3 i: DigiCert Global Root G3>"
)}}, _NSURLErrorRelatedURLSessionTaskErrorKey=(
    "LocalDataTask <04FBDE69-24A9-4805-A342-FBD680887F86>.<4>"
), _kCFStreamErrorCodeKey=-9802, _NSURLErrorFailingURLSessionTaskErrorKey=LocalDataTask <04FBDE69-24A9-4805-A342-FBD680887F86>.<4>, NSURLErrorFailingURLPeerTrustErrorKey=<SecTrustRef: 0x12c331380>, NSLocalizedDescription=An SSL error has occurred and a secure connection to the server cannot be made.}
2026/04/14 10:20:32.364 [WebRTC] ❌ Failed to fetch TURN credentials: Network request failed
2026/04/14 10:20:32.365 [WebRTC] Falling back to STUN-only